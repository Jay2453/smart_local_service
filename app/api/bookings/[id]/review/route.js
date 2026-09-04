import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySession } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import Booking from "@/models/Booking";
import Review from "@/models/Review";
import Provider from "@/models/Provider";
import Notification from "@/models/Notification";

export async function POST(request, { params }) {
    try {
        const { id } = await params;

        const cookieStore = await cookies();
        const token = cookieStore.get("smartserve_session")?.value;

        if (!token) {
            return NextResponse.json(
                { success: false, message: "Authentication required" },
                { status: 401 }
            );
        }

        const session = await verifySession(token);
        if (!session || session.role !== "customer") {
            return NextResponse.json(
                { success: false, message: "Only customers can submit reviews" },
                { status: 403 }
            );
        }

        const body = await request.json();
        const { rating, comment } = body;

        const numericRating = Number(rating);
        if (!numericRating || numericRating < 1 || numericRating > 5) {
            return NextResponse.json(
                { success: false, message: "Rating must be between 1 and 5 stars" },
                { status: 400 }
            );
        }

        await connectDB();

        const booking = await Booking.findById(id);
        if (!booking) {
            return NextResponse.json(
                { success: false, message: "Booking not found" },
                { status: 404 }
            );
        }

        if (booking.customerId.toString() !== session.id) {
            return NextResponse.json(
                { success: false, message: "You can only review your own bookings" },
                { status: 403 }
            );
        }

        if (booking.status !== "completed") {
            return NextResponse.json(
                { success: false, message: "Reviews can only be submitted after service is completed" },
                { status: 400 }
            );
        }

        if (!booking.assignedProviderId) {
            return NextResponse.json(
                { success: false, message: "No provider assigned to this booking" },
                { status: 400 }
            );
        }

        // Check if review already exists
        const existingReview = await Review.findOne({ bookingId: booking._id });
        if (existingReview) {
            return NextResponse.json(
                { success: false, message: "You have already reviewed this service" },
                { status: 400 }
            );
        }

        const review = await Review.create({
            bookingId: booking._id,
            customerId: session.id,
            providerId: booking.assignedProviderId,
            rating: numericRating,
            comment: (comment || "").trim(),
        });

        // Recalculate provider aggregate rating
        const allReviews = await Review.find({ providerId: booking.assignedProviderId });
        const avg = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;
        const roundedAvg = Math.round(avg * 10) / 10;

        await Provider.findByIdAndUpdate(booking.assignedProviderId, {
            rating: roundedAvg,
            reviewCount: allReviews.length,
        });

        // Notify provider of review
        await Notification.create({
            recipientId: booking.assignedProviderId,
            recipientRole: "serviceprovider",
            title: "New Review Received",
            message: `You received a ${numericRating}-star review for booking #${booking._id.toString().slice(-6)}.`,
            type: "system",
            link: "/Serviceprovider",
        });

        return NextResponse.json({
            success: true,
            message: "Review submitted successfully! Thank you for your feedback.",
            review,
            providerRating: roundedAvg,
        });

    } catch (error) {
        console.error("Submit review error:", error);
        return NextResponse.json(
            { success: false, message: "Failed to submit review" },
            { status: 500 }
        );
    }
}
