import { NextResponse } from "next/server";
import { requireAdmin, logAdminAction } from "@/lib/adminAuth";
import connectDB from "@/lib/mongodb";
import Notification from "@/models/Notification";
import User from "@/models/User";
import Provider from "@/models/Provider";

export async function GET(request) {
    try {
        const { error } = await requireAdmin(request);
        if (error) return error;

        const { searchParams } = new URL(request.url);
        const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
        const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "15", 10)));
        const skip = (page - 1) * limit;

        await connectDB();

        const [total, notifications] = await Promise.all([
            Notification.countDocuments({}),
            Notification.find({})
                .populate("sentByAdminId", "name email")
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
        ]);

        return NextResponse.json({
            success: true,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
            notifications,
        });
    } catch (error) {
        console.error("Admin list notifications error:", error);
        return NextResponse.json(
            { success: false, message: "Failed to retrieve notifications" },
            { status: 500 }
        );
    }
}

export async function POST(request) {
    try {
        const { error, admin } = await requireAdmin(request);
        if (error) return error;

        const body = await request.json().catch(() => ({}));
        const {
            target = "all", // "all" | "customers" | "providers" | "individual"
            recipientId = null,
            recipientRole = "customer",
            title,
            message,
            link = "",
        } = body;

        if (!title || !message || !title.trim() || !message.trim()) {
            return NextResponse.json(
                { success: false, message: "Title and message are required." },
                { status: 400 }
            );
        }

        await connectDB();

        let recipientCount = 0;

        if (target === "individual" && recipientId) {
            await Notification.create({
                recipientId,
                recipientRole,
                title: title.trim(),
                message: message.trim(),
                type: "announcement",
                link,
                sentByAdminId: admin.id,
            });
            recipientCount = 1;
        } else if (target === "customers") {
            const customers = await User.find({ role: "customer", isActive: { $ne: false } }).select("_id");
            const docs = customers.map((c) => ({
                recipientId: c._id,
                recipientRole: "customer",
                title: title.trim(),
                message: message.trim(),
                type: "announcement",
                link: link || "/Dashboard",
                isBroadcast: true,
                broadcastTarget: "customers",
                sentByAdminId: admin.id,
            }));
            if (docs.length > 0) {
                await Notification.insertMany(docs);
            }
            recipientCount = docs.length;
        } else if (target === "providers") {
            const providers = await Provider.find({ isSuspended: { $ne: true } }).select("_id");
            const docs = providers.map((p) => ({
                recipientId: p._id,
                recipientRole: "serviceprovider",
                title: title.trim(),
                message: message.trim(),
                type: "announcement",
                link: link || "/Serviceprovider",
                isBroadcast: true,
                broadcastTarget: "providers",
                sentByAdminId: admin.id,
            }));
            if (docs.length > 0) {
                await Notification.insertMany(docs);
            }
            recipientCount = docs.length;
        } else {
            // Target: "all"
            const [customers, providers] = await Promise.all([
                User.find({ role: "customer", isActive: { $ne: false } }).select("_id"),
                Provider.find({ isSuspended: { $ne: true } }).select("_id"),
            ]);

            const customerDocs = customers.map((c) => ({
                recipientId: c._id,
                recipientRole: "customer",
                title: title.trim(),
                message: message.trim(),
                type: "announcement",
                link: link || "/Dashboard",
                isBroadcast: true,
                broadcastTarget: "all",
                sentByAdminId: admin.id,
            }));

            const providerDocs = providers.map((p) => ({
                recipientId: p._id,
                recipientRole: "serviceprovider",
                title: title.trim(),
                message: message.trim(),
                type: "announcement",
                link: link || "/Serviceprovider",
                isBroadcast: true,
                broadcastTarget: "all",
                sentByAdminId: admin.id,
            }));

            const allDocs = [...customerDocs, ...providerDocs];
            if (allDocs.length > 0) {
                await Notification.insertMany(allDocs);
            }
            recipientCount = allDocs.length;
        }

        await logAdminAction({
            admin,
            action: "notification_broadcast",
            targetType: "notification",
            targetId: null,
            description: `Admin broadcasted announcement '${title.trim()}' to ${target} (${recipientCount} recipient(s))`,
            req: request,
            metadata: { target, recipientCount, title: title.trim() },
        });

        return NextResponse.json(
            {
                success: true,
                message: `Announcement successfully dispatched to ${recipientCount} user(s).`,
                recipientCount,
            },
            { status: 201 }
        );
    } catch (error) {
        console.error("Admin send notification error:", error);
        return NextResponse.json(
            { success: false, message: "Failed to dispatch notification" },
            { status: 500 }
        );
    }
}
