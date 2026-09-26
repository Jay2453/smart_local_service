import { NextResponse } from "next/server";
import { requireAdmin, logAdminAction } from "@/lib/adminAuth";
import connectDB from "@/lib/mongodb";
import Review from "@/models/Review";

export async function GET(request, { params }) {
    try {
        const { error } = await requireAdmin(request);
        if (error) return error;

        const { id } = await params;
        await connectDB();

        const review = await Review.findById(id)
            .populate("customerId", "name email phone")
            .populate("providerId", "name phone Proffesion")
            .populate("bookingId")
            .populate("moderatedBy", "name email")
            .lean();

        if (!review) {
            return NextResponse.json(
                { success: false, message: "Review not found." },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            review,
        });
    } catch (error) {
        console.error("Admin get review error:", error);
        return NextResponse.json(
            { success: false, message: "Failed to fetch review details" },
            { status: 500 }
        );
    }
}

export async function PATCH(request, { params }) {
    try {
        const { error, admin } = await requireAdmin(request);
        if (error) return error;

        const { id } = await params;
        const body = await request.json().catch(() => ({}));
        const { status, moderationReason = "" } = body;

        if (!["visible", "hidden", "flagged"].includes(status)) {
            return NextResponse.json(
                { success: false, message: "Status must be 'visible', 'hidden', or 'flagged'." },
                { status: 400 }
            );
        }

        await connectDB();

        const review = await Review.findById(id);
        if (!review) {
            return NextResponse.json(
                { success: false, message: "Review not found." },
                { status: 404 }
            );
        }

        const oldStatus = review.status;
        review.status = status;
        review.moderatedBy = admin.id;
        review.moderatedAt = new Date();
        review.moderationReason = moderationReason.trim();

        await review.save();

        await logAdminAction({
            admin,
            action: "review_moderated",
            targetType: "review",
            targetId: review._id.toString(),
            description: `Admin moderated review #${review._id.toString().slice(-6)}: status changed from '${oldStatus}' to '${status}'. Reason: ${moderationReason || "Admin moderation"}`,
            req: request,
            metadata: { reviewId: review._id, oldStatus, newStatus: status, moderationReason },
        });

        return NextResponse.json({
            success: true,
            message: `Review marked as ${status}.`,
            review,
        });
    } catch (error) {
        console.error("Admin moderate review error:", error);
        return NextResponse.json(
            { success: false, message: "Failed to moderate review" },
            { status: 500 }
        );
    }
}
