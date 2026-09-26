import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import connectDB from "@/lib/mongodb";
import AdminAuditLog from "@/models/AdminAuditLog";

export async function GET(request) {
    try {
        const { error } = await requireAdmin(request);
        if (error) return error;

        const { searchParams } = new URL(request.url);
        const search = searchParams.get("search")?.trim() || "";
        const action = searchParams.get("action") || "all";
        const targetType = searchParams.get("targetType") || "all";
        const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
        const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));
        const skip = (page - 1) * limit;

        await connectDB();

        const query = {};

        if (action !== "all") {
            query.action = action;
        }

        if (targetType !== "all") {
            query.targetType = targetType;
        }

        if (search) {
            const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
            const searchRegex = new RegExp(escapedSearch, "i");
            query.$or = [
                { description: searchRegex },
                { adminName: searchRegex },
                { adminEmail: searchRegex },
                { action: searchRegex },
                { targetId: searchRegex },
            ];
        }

        const [total, logs] = await Promise.all([
            AdminAuditLog.countDocuments(query),
            AdminAuditLog.find(query)
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
            logs,
        });
    } catch (error) {
        console.error("Admin list audit logs error:", error);
        return NextResponse.json(
            { success: false, message: "Failed to retrieve audit logs" },
            { status: 500 }
        );
    }
}
