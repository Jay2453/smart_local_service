import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import Booking from "@/models/Booking";

export async function GET(request) {
    try {
        const { error } = await requireAdmin(request);
        if (error) return error;

        const { searchParams } = new URL(request.url);
        const search = searchParams.get("search")?.trim() || "";
        const status = searchParams.get("status") || "all";
        const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
        const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "10", 10)));
        const skip = (page - 1) * limit;

        await connectDB();

        const query = { role: "customer" };

        if (status === "active") {
            query.isActive = { $ne: false };
            query.status = { $ne: "deactivated" };
        } else if (status === "deactivated") {
            query.$or = [{ isActive: false }, { status: "deactivated" }];
        }

        if (search) {
            const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
            const searchRegex = new RegExp(escapedSearch, "i");
            query.$and = [
                {
                    $or: [
                        { name: searchRegex },
                        { email: searchRegex },
                        { phone: searchRegex },
                    ],
                },
            ];
        }

        const [total, users] = await Promise.all([
            User.countDocuments(query),
            User.find(query)
                .select("-password")
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
        ]);

        // Augment with booking count for each customer
        const userIds = users.map((u) => u._id);
        const bookingCounts = await Booking.aggregate([
            { $match: { customerId: { $in: userIds } } },
            { $group: { _id: "$customerId", count: { $sum: 1 } } },
        ]);

        const bookingCountMap = {};
        bookingCounts.forEach((b) => {
            bookingCountMap[b._id.toString()] = b.count;
        });

        const enrichedUsers = users.map((u) => ({
            ...u,
            bookingCount: bookingCountMap[u._id.toString()] || 0,
        }));

        return NextResponse.json({
            success: true,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
            customers: enrichedUsers,
        });
    } catch (error) {
        console.error("Admin list customers error:", error);
        return NextResponse.json(
            { success: false, message: "Failed to retrieve customers" },
            { status: 500 }
        );
    }
}
