import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import connectDB from "@/lib/mongodb";
import Booking from "@/models/Booking";
import User from "@/models/User";
import Provider from "@/models/Provider";

export async function GET(request) {
    try {
        const { error } = await requireAdmin(request);
        if (error) return error;

        const { searchParams } = new URL(request.url);
        const search = searchParams.get("search")?.trim() || "";
        const status = searchParams.get("status") || "all";
        const profession = searchParams.get("profession") || "all";
        const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
        const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "15", 10)));
        const skip = (page - 1) * limit;

        await connectDB();

        const query = {};

        if (status !== "all") {
            query.status = status;
        }

        if (profession !== "all") {
            query["services.serviceId"] = profession.toLowerCase();
        }

        if (search) {
            const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
            const searchRegex = new RegExp(escapedSearch, "i");

            // Look up matching customer IDs and provider IDs
            const [matchingCustomers, matchingProviders] = await Promise.all([
                User.find({ $or: [{ name: searchRegex }, { phone: searchRegex }, { email: searchRegex }] }).select("_id"),
                Provider.find({ $or: [{ name: searchRegex }, { phone: searchRegex }, { email: searchRegex }] }).select("_id"),
            ]);

            const customerIds = matchingCustomers.map((c) => c._id);
            const providerIds = matchingProviders.map((p) => p._id);

            query.$or = [
                { address: searchRegex },
                { description: searchRegex },
                { customerId: { $in: customerIds } },
                { assignedProviderId: { $in: providerIds } },
            ];
        }

        const [total, bookings] = await Promise.all([
            Booking.countDocuments(query),
            Booking.find(query)
                .populate("customerId", "name phone email")
                .populate("assignedProviderId", "name phone Proffesion rating")
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
            bookings,
        });
    } catch (error) {
        console.error("Admin list bookings error:", error);
        return NextResponse.json(
            { success: false, message: "Failed to retrieve bookings" },
            { status: 500 }
        );
    }
}
