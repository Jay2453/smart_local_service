import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySession } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import Booking from "@/models/Booking";
import Payment from "@/models/Payment";

/**
 * GET /api/payment/status?bookingId=<id>
 *
 * Returns the server-side payment & booking status for a given booking.
 * Used by the success/failure page to show the REAL server-verified state.
 *
 * The frontend NEVER decides payment status from local state.
 * It always fetches from this endpoint.
 */
export async function GET(request) {
    try {
        // ── 1. Authenticate ──────────────────────────────────────────────
        const cookieStore = await cookies();
        const token = cookieStore.get("smartserve_session")?.value;

        if (!token) {
            return NextResponse.json(
                { success: false, message: "Authentication required." },
                { status: 401 }
            );
        }

        const session = await verifySession(token);
        if (!session) {
            return NextResponse.json(
                { success: false, message: "Invalid session." },
                { status: 401 }
            );
        }

        // ── 2. Get bookingId from query params ───────────────────────────
        const { searchParams } = new URL(request.url);
        const bookingId = searchParams.get("bookingId");

        if (!bookingId) {
            return NextResponse.json(
                { success: false, message: "bookingId query parameter is required." },
                { status: 400 }
            );
        }

        await connectDB();

        // ── 3. Fetch booking & verify access ────────────────────────────
        const booking = await Booking.findById(bookingId).lean();

        if (!booking) {
            return NextResponse.json(
                { success: false, message: "Booking not found." },
                { status: 404 }
            );
        }

        // Allow: customer, assigned provider, or admin
        const isCustomer = booking.customerId?.toString() === session.id;
        const isProvider = booking.assignedProviderId?.toString() === session.id;
        const isAdmin = session.role === "admin";

        if (!isCustomer && !isProvider && !isAdmin) {
            return NextResponse.json(
                { success: false, message: "Access denied." },
                { status: 403 }
            );
        }

        // ── 4. Fetch payment record ──────────────────────────────────────
        const payment = await Payment.findOne({ bookingId }).lean();

        // ── 5. Return safe, minimal info ─────────────────────────────────
        // Never expose razorpaySignature or full webhook event IDs to frontend
        const safePayment = payment
            ? {
                id: payment._id,
                status: payment.status,
                amount: payment.amount,
                currency: payment.currency,
                paymentProvider: payment.paymentProvider,
                razorpayOrderId: payment.razorpayOrderId,
                razorpayPaymentId: payment.razorpayPaymentId,
                paidAt: payment.paidAt,
                paymentFailureReason: payment.paymentFailureReason,
                refundStatus: payment.refundStatus,
                refundAmount: payment.refundAmount,
                refundedAt: payment.refundedAt,
                method: payment.method,
            }
            : null;

        return NextResponse.json({
            success: true,
            booking: {
                id: booking._id,
                status: booking.status,
                estimatedTotal: booking.estimatedTotal,
                services: booking.services,
                preferredDate: booking.preferredDate,
                preferredTime: booking.preferredTime,
                address: booking.address,
                createdAt: booking.createdAt,
            },
            payment: safePayment,
        });

    } catch (error) {
        console.error("[STATUS] Error:", error.message || error);
        return NextResponse.json(
            { success: false, message: "Unable to retrieve payment status." },
            { status: 500 }
        );
    }
}
