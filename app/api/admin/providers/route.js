import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import connectDB from "@/lib/mongodb";
import Provider from "@/models/Provider";
import Booking from "@/models/Booking";

export async function GET(request) {
    try {
        const { error } = await requireAdmin(request);
        if (error) return error;

        const { searchParams } = new URL(request.url);
        const search = searchParams.get("search")?.trim() || "";
        const verificationStatus = searchParams.get("verificationStatus") || "all";
        const status = searchParams.get("status") || "all";
        const profession = searchParams.get("profession") || "all";
        const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
        const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "10", 10)));
        const skip = (page - 1) * limit;

        await connectDB();

        const query = {};

        if (verificationStatus !== "all") {
            query.verificationStatus = verificationStatus;
        }

        if (status === "active") {
            query.isSuspended = { $ne: true };
            query.isActive = { $ne: false };
        } else if (status === "suspended") {
            query.$or = [{ isSuspended: true }, { status: "suspended" }];
        }

        if (profession !== "all") {
            query.Proffesion = new RegExp(`^${profession}$`, "i");
        }

        if (search) {
            const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
            const searchRegex = new RegExp(escapedSearch, "i");
            query.$or = [
                { name: searchRegex },
                { email: searchRegex },
                { phone: searchRegex },
                { Proffesion: searchRegex },
                { address: searchRegex },
            ];
        }

        const [total, providers] = await Promise.all([
            Provider.countDocuments(query),
            Provider.find(query)
                .select("-password")
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
        ]);

        // Augment with completed booking counts and earnings
        const providerIds = providers.map((p) => p._id);
        const bookingStats = await Booking.aggregate([
            { $match: { assignedProviderId: { $in: providerIds } } },
            {
                $group: {
                    _id: "$assignedProviderId",
                    totalJobs: { $sum: 1 },
                    completedJobs: {
                        $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] },
                    },
                    totalEarnings: {
                        $sum: { $cond: [{ $eq: ["$status", "completed"] }, "$estimatedTotal", 0] },
                    },
                },
            },
        ]);

        const statsMap = {};
        bookingStats.forEach((s) => {
            statsMap[s._id.toString()] = s;
        });

        const enrichedProviders = providers.map((p) => ({
            ...p,
            stats: statsMap[p._id.toString()] || { totalJobs: 0, completedJobs: 0, totalEarnings: 0 },
        }));

        return NextResponse.json({
            success: true,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
            providers: enrichedProviders,
        });
    } catch (error) {
        console.error("Admin list providers error:", error);
        return NextResponse.json(
            { success: false, message: "Failed to retrieve service providers" },
            { status: 500 }
        );
    }
}
