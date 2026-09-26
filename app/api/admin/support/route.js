import { NextResponse } from "next/server";
import { requireAdmin, logAdminAction } from "@/lib/adminAuth";
import connectDB from "@/lib/mongodb";
import SupportTicket from "@/models/SupportTicket";

export async function GET(request) {
    try {
        const { error } = await requireAdmin(request);
        if (error) return error;

        const { searchParams } = new URL(request.url);
        const search = searchParams.get("search")?.trim() || "";
        const status = searchParams.get("status") || "all";
        const priority = searchParams.get("priority") || "all";
        const category = searchParams.get("category") || "all";
        const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
        const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "15", 10)));
        const skip = (page - 1) * limit;

        await connectDB();

        const query = {};

        if (status !== "all") {
            query.status = status;
        }

        if (priority !== "all") {
            query.priority = priority;
        }

        if (category !== "all") {
            query.category = category;
        }

        if (search) {
            const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
            const searchRegex = new RegExp(escapedSearch, "i");
            query.$or = [
                { ticketNumber: searchRegex },
                { subject: searchRegex },
                { userName: searchRegex },
                { userEmail: searchRegex },
            ];
        }

        const [total, tickets] = await Promise.all([
            SupportTicket.countDocuments(query),
            SupportTicket.find(query)
                .populate("assignedAdminId", "name email")
                .populate("bookingId")
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
            tickets,
        });
    } catch (error) {
        console.error("Admin list support tickets error:", error);
        return NextResponse.json(
            { success: false, message: "Failed to retrieve support tickets" },
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
            userId,
            userRole = "customer",
            userName,
            userEmail,
            userPhone = "",
            subject,
            category = "other",
            bookingId = null,
            priority = "medium",
            initialMessage,
        } = body;

        if (!userId || !userName || !userEmail || !subject || !initialMessage) {
            return NextResponse.json(
                { success: false, message: "userId, userName, userEmail, subject, and initialMessage are required." },
                { status: 400 }
            );
        }

        await connectDB();

        const count = await SupportTicket.countDocuments();
        const ticketNumber = `TKT-${1000 + count + 1}`;

        const newTicket = await SupportTicket.create({
            ticketNumber,
            userId,
            userRole,
            userName: userName.trim(),
            userEmail: userEmail.toLowerCase().trim(),
            userPhone: userPhone.trim(),
            subject: subject.trim(),
            category,
            bookingId: bookingId || null,
            priority,
            status: "open",
            assignedAdminId: admin.id,
            messages: [
                {
                    senderRole: "admin",
                    senderId: admin.id,
                    senderName: admin.name,
                    message: initialMessage.trim(),
                    isInternalNote: false,
                    createdAt: new Date(),
                },
            ],
        });

        await logAdminAction({
            admin,
            action: "support_ticket_created",
            targetType: "support",
            targetId: newTicket._id.toString(),
            description: `Admin created support ticket #${ticketNumber} for ${userName} (${userEmail})`,
            req: request,
            metadata: { ticketNumber, userId, subject },
        });

        return NextResponse.json(
            {
                success: true,
                message: "Support ticket created successfully.",
                ticket: newTicket,
            },
            { status: 201 }
        );
    } catch (error) {
        console.error("Admin create support ticket error:", error);
        return NextResponse.json(
            { success: false, message: "Failed to create support ticket" },
            { status: 500 }
        );
    }
}
