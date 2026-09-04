import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySession } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import Booking from "@/models/Booking";
import BookingRequest from "@/models/BookingRequest";
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
        if (!session) {
            return NextResponse.json(
                { success: false, message: "Invalid session" },
                { status: 401 }
            );
        }

        const body = await request.json().catch(() => ({}));
        const reason = body.reason || "Cancelled by customer";

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
                { success: false, message: "Only the customer can cancel this booking." },
                { status: 403 }
            );
        }

        if (booking.status === "completed" || booking.status === "cancelled") {
            return NextResponse.json(
                { success: false, message: `Booking is already ${booking.status}.` },
                { status: 400 }
            );
        }

        if (booking.status === "in_progress") {
            return NextResponse.json(
                { success: false, message: "Cannot cancel a service that is already in progress." },
                { status: 400 }
            );
        }

        booking.status = "cancelled";
        booking.cancelledAt = new Date();
        booking.cancellationReason = reason;
        await booking.save();

        // Expire all pending requests for this booking
        await BookingRequest.updateMany(
            { bookingId: booking._id, status: "sent" },
            { status: "expired" }
        );

        // Notify provider if assigned
        if (booking.assignedProviderId) {
            await Notification.create({
                recipientId: booking.assignedProviderId,
                recipientRole: "serviceprovider",
                title: "Job Cancelled",
                message: `Booking #${booking._id.toString().slice(-6)} was cancelled by the customer.`,
                type: "booking",
                link: "/Serviceprovider",
            });
        }

        return NextResponse.json({
            success: true,
            message: "Booking cancelled successfully.",
            booking,
        });

    } catch (error) {
        console.error("Cancel booking error:", error);
        return NextResponse.json(
            { success: false, message: "Failed to cancel booking." },
            { status: 500 }
        );
    }
}
