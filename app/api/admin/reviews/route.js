import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import connectDB from "@/lib/mongodb";
import Review from "@/models/Review";

export async function GET(request) {
    try {
        const { error } = await requireAdmin(request);
        if (error) return error;

        const { searchParams } = new URL(request.url);
        const search = searchParams.get("search")?.trim() || "";
        const status = searchParams.get("status") || "all";
        const rating = searchParams.get("rating");
        const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
        const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "15", 10)));
        const skip = (page - 1) * limit;

        await connectDB();

        const query = {};

        if (status !== "all") {
            query.status = status;
        }

        if (rating) {
            query.rating = Number(rating);
        }

        if (search) {
            const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
            query.comment = new RegExp(escapedSearch, "i");
        }

        const [total, reviews] = await Promise.all([
            Review.countDocuments(query),
            Review.find(query)
                .populate("customerId", "name email phone")
                .populate("providerId", "name phone Proffesion")
                .populate("moderatedBy", "name email")
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
            reviews,
        });
    } catch (error) {
        console.error("Admin list reviews error:", error);
        return NextResponse.json(
            { success: false, message: "Failed to retrieve reviews" },
            { status: 500 }
        );
    }
}
