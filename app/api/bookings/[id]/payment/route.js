import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySession } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import Booking from "@/models/Booking";
import Payment from "@/models/Payment";
import Notification from "@/models/Notification";

/**
 * POST /api/bookings/[id]/payment
 *
 * LEGACY CASH PAYMENT ROUTE
 *
 * This route now only handles cash payments.
 * For Razorpay online payments, use:
 *   POST /api/payment/create-order  → initiates order
 *   POST /api/payment/verify        → verifies & confirms
 *
 * Online payment status is ONLY updated after server-side Razorpay
 * signature verification. This route will NOT mark an online payment
 * as completed.
 */
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
        const { method = "cash" } = body;

        // SECURITY: Reject attempts to mark online/Razorpay payments via this route
        if (method === "online" || method === "razorpay") {
            return NextResponse.json(
                {
                    success: false,
                    message:
                        "Online payments must be processed through the secure Razorpay checkout flow.",
                },
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

        // Only the customer or assigned provider can confirm cash payment
        const isCustomer = booking.customerId.toString() === session.id;
        const isProvider = booking.assignedProviderId?.toString() === session.id;

        if (!isCustomer && !isProvider) {
            return NextResponse.json(
                { success: false, message: "Unauthorized payment action" },
                { status: 403 }
            );
        }

        // Check for existing Razorpay payment — don't allow cash override
        const existingPayment = await Payment.findOne({ bookingId: booking._id });
        if (existingPayment && (existingPayment.status === "paid" || existingPayment.status === "completed")) {
            return NextResponse.json(
                { success: false, message: "This booking has already been paid online." },
                { status: 409 }
            );
        }

        const payment = await Payment.findOneAndUpdate(
            { bookingId: booking._id },
            {
                bookingId: booking._id,
                customerId: booking.customerId,
                providerId: booking.assignedProviderId || null,
                amount: booking.estimatedTotal,
                method: "cash",
                paymentProvider: "cash",
                status: "completed",
                paidAt: new Date(),
                commissionPercent: 10,
                commissionAmount: Math.round(booking.estimatedTotal * 0.1),
                providerPayoutAmount: Math.round(booking.estimatedTotal * 0.9),
            },
            { upsert: true, new: true }
        );

        // Notify both parties
        await Notification.create({
            recipientId: booking.customerId,
            recipientRole: "customer",
            title: "Cash Payment Recorded",
            message: `Cash payment of ₹${booking.estimatedTotal} confirmed for booking #${booking._id.toString().slice(-6)}.`,
            type: "system",
            link: "/Dashboard",
        });

        if (booking.assignedProviderId) {
            await Notification.create({
                recipientId: booking.assignedProviderId,
                recipientRole: "serviceprovider",
                title: "Cash Payment Collected",
                message: `Cash payment of ₹${booking.estimatedTotal} recorded for booking #${booking._id.toString().slice(-6)}.`,
                type: "system",
                link: "/Serviceprovider",
            });
        }

        return NextResponse.json({
            success: true,
            message: "Cash payment successfully recorded.",
            payment,
        });

    } catch (error) {
        console.error("Cash payment error:", error);
        return NextResponse.json(
            { success: false, message: "Failed to process cash payment." },
            { status: 500 }
        );
    }
}
