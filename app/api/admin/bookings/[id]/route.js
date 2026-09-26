import { NextResponse } from "next/server";
import { requireAdmin, logAdminAction } from "@/lib/adminAuth";
import connectDB from "@/lib/mongodb";
import Booking from "@/models/Booking";
import BookingRequest from "@/models/BookingRequest";
import Payment from "@/models/Payment";
import Review from "@/models/Review";
import Notification from "@/models/Notification";

export async function GET(request, { params }) {
    try {
        const { error } = await requireAdmin(request);
        if (error) return error;

        const { id } = await params;
        await connectDB();

        const booking = await Booking.findById(id)
            .populate("customerId", "name phone email address")
            .populate("assignedProviderId", "name phone Proffesion address Experience ServiceRadius rating reviewCount")
            .lean();

        if (!booking) {
            return NextResponse.json(
                { success: false, message: "Booking not found." },
                { status: 404 }
            );
        }

        const [requests, payment, review] = await Promise.all([
            BookingRequest.find({ bookingId: id })
                .populate("providerId", "name phone Proffesion rating")
                .sort({ sentAt: -1 })
                .lean(),
            Payment.findOne({ bookingId: id }).lean(),
            Review.findOne({ bookingId: id }).lean(),
        ]);

        return NextResponse.json({
            success: true,
            booking,
            requests,
            payment: payment || null,
            review: review || null,
        });
    } catch (error) {
        console.error("Admin get booking error:", error);
        return NextResponse.json(
            { success: false, message: "Failed to fetch booking details" },
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
        const { status, cancellationReason, assignedProviderId } = body;

        const VALID_STATUSES = ["pending", "accepted", "in_progress", "completed", "cancelled"];

        if (status && !VALID_STATUSES.includes(status)) {
            return NextResponse.json(
                { success: false, message: `Invalid status. Must be one of: ${VALID_STATUSES.join(", ")}` },
                { status: 400 }
            );
        }

        await connectDB();

        const booking = await Booking.findById(id);
        if (!booking) {
            return NextResponse.json(
                { success: false, message: "Booking not found." },
                { status: 404 }
            );
        }

        const oldStatus = booking.status;
        const updates = {};

        if (status) {
            updates.status = status;
            if (status === "completed") {
                updates.completedAt = new Date();
            } else if (status === "cancelled") {
                updates.cancelledAt = new Date();
                updates.cancellationReason = cancellationReason || "Cancelled by Administrator";
            }
        }

        if (assignedProviderId !== undefined) {
            updates.assignedProviderId = assignedProviderId || null;
            if (assignedProviderId && booking.status === "pending") {
                updates.status = "accepted";
            }
        }

        const updatedBooking = await Booking.findByIdAndUpdate(id, updates, { new: true })
            .populate("customerId", "name phone email")
            .populate("assignedProviderId", "name phone Proffesion");

        // Notify customer and provider of administrative update
        if (status && status !== oldStatus) {
            await Notification.create({
                recipientId: booking.customerId,
                recipientRole: "customer",
                title: "Booking Status Updated",
                message: `Your booking #${booking._id.toString().slice(-6)} status was updated to: ${status.replace("_", " ")}.`,
                type: "booking",
                link: "/Dashboard",
            });

            if (booking.assignedProviderId) {
                await Notification.create({
                    recipientId: booking.assignedProviderId,
                    recipientRole: "serviceprovider",
                    title: "Booking Status Updated",
                    message: `Booking #${booking._id.toString().slice(-6)} status was updated to: ${status.replace("_", " ")}.`,
                    type: "booking",
                    link: "/Serviceprovider",
                });
            }
        }

        await logAdminAction({
            admin,
            action: "booking_intervention",
            targetType: "booking",
            targetId: booking._id.toString(),
            description: `Admin updated booking #${booking._id.toString().slice(-6)}: status changed from '${oldStatus}' to '${status || oldStatus}'`,
            req: request,
            metadata: { bookingId: booking._id, oldStatus, newStatus: status, updates },
        });

        return NextResponse.json({
            success: true,
            message: "Booking updated successfully.",
            booking: updatedBooking,
        });
    } catch (error) {
        console.error("Admin update booking error:", error);
        return NextResponse.json(
            { success: false, message: "Failed to update booking" },
            { status: 500 }
        );
    }
}
