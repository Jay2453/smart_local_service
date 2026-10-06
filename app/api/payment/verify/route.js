import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySession } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import Booking from "@/models/Booking";
import Payment from "@/models/Payment";
import Notification from "@/models/Notification";
import { verifyPaymentSignature } from "@/lib/paymentVerification";
import { getRazorpay, paiseToRupees } from "@/lib/razorpay";

/**
 * POST /api/payment/verify
 *
 * Called by the frontend AFTER Razorpay Checkout reports success.
 * This is the CRITICAL security gate — the booking is only marked PAID
 * after:
 *   1. Session is authenticated.
 *   2. Booking ownership is confirmed.
 *   3. Razorpay signature is cryptographically verified.
 *   4. Razorpay payment details are fetched from Razorpay's server
 *      and cross-checked (amount, order ID, status).
 *
 * The frontend saying "payment succeeded" is NEVER sufficient.
 */
export async function POST(request) {
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
        if (!session || session.role !== "customer") {
            return NextResponse.json(
                { success: false, message: "Only customers can verify payments." },
                { status: 403 }
            );
        }

        // ── 2. Parse & validate payload ──────────────────────────────────
        let body;
        try {
            body = await request.json();
        } catch {
            return NextResponse.json(
                { success: false, message: "Invalid request body." },
                { status: 400 }
            );
        }

        const { razorpay_payment_id, razorpay_order_id, razorpay_signature, bookingId } = body;

        if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature || !bookingId) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Missing required payment verification fields.",
                },
                { status: 400 }
            );
        }

        await connectDB();

        // ── 3. Fetch payment record & verify booking ownership ───────────
        const payment = await Payment.findOne({
            bookingId,
            razorpayOrderId: razorpay_order_id,
        });

        if (!payment) {
            console.warn(`[VERIFY] No payment record found for orderId=${razorpay_order_id} bookingId=${bookingId}`);
            return NextResponse.json(
                { success: false, message: "Payment record not found. Please contact support." },
                { status: 404 }
            );
        }

        // Confirm this payment belongs to the authenticated customer
        if (payment.customerId.toString() !== session.id) {
            console.warn(`[VERIFY] Ownership mismatch: session=${session.id} payment.customerId=${payment.customerId}`);
            return NextResponse.json(
                { success: false, message: "You are not authorised to verify this payment." },
                { status: 403 }
            );
        }

        // ── 4. Idempotency — already paid? ───────────────────────────────
        if (payment.status === "paid" || payment.status === "completed") {
            const booking = await Booking.findById(bookingId);
            return NextResponse.json({
                success: true,
                alreadyVerified: true,
                message: "Payment was already verified.",
                payment: {
                    id: payment._id,
                    razorpayPaymentId: payment.razorpayPaymentId,
                    status: payment.status,
                    amount: payment.amount,
                    paidAt: payment.paidAt,
                },
                booking: {
                    id: booking?._id,
                    status: booking?.status,
                },
            });
        }

        // ── 5. CRITICAL: Cryptographic signature verification ────────────
        const signatureValid = verifyPaymentSignature(
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature
        );

        if (!signatureValid) {
            console.error(`[VERIFY] INVALID SIGNATURE for orderId=${razorpay_order_id} paymentId=${razorpay_payment_id}`);

            // Mark as failed
            payment.status = "failed";
            payment.paymentFailureReason = "Signature verification failed";
            await payment.save();

            return NextResponse.json(
                {
                    success: false,
                    message: "Payment signature verification failed. This incident has been logged.",
                },
                { status: 400 }
            );
        }

        // ── 6. Fetch payment details from Razorpay API ───────────────────
        // Do not trust what the frontend said. Fetch from Razorpay directly.
        const razorpay = getRazorpay();
        let razorpayPaymentDetails;

        try {
            razorpayPaymentDetails = await razorpay.payments.fetch(razorpay_payment_id);
        } catch (fetchErr) {
            console.error("[VERIFY] Failed to fetch payment from Razorpay:", fetchErr.message);
            return NextResponse.json(
                {
                    success: false,
                    message: "Unable to verify payment with Razorpay. Please wait and try again.",
                },
                { status: 502 }
            );
        }

        // ── 7. Cross-check Razorpay payment details ──────────────────────
        const fetchedOrderId = razorpayPaymentDetails.order_id;
        const fetchedStatus = razorpayPaymentDetails.status; // "captured" or "authorized"
        const fetchedAmountPaise = razorpayPaymentDetails.amount;

        const expectedAmountPaise = Math.round(payment.amount * 100);
        const fetchedAmountRupees = paiseToRupees(fetchedAmountPaise);

        if (fetchedOrderId !== razorpay_order_id) {
            console.error(`[VERIFY] Order ID mismatch: fetched=${fetchedOrderId} expected=${razorpay_order_id}`);
            payment.status = "failed";
            payment.paymentFailureReason = "Order ID mismatch detected";
            await payment.save();
            return NextResponse.json(
                { success: false, message: "Payment order mismatch. Contact support." },
                { status: 400 }
            );
        }

        if (Math.abs(fetchedAmountPaise - expectedAmountPaise) > 1) {
            // Allow 1 paise rounding tolerance
            console.error(`[VERIFY] Amount mismatch: fetched=${fetchedAmountPaise} expected=${expectedAmountPaise}`);
            payment.status = "failed";
            payment.paymentFailureReason = `Amount mismatch: expected ${expectedAmountPaise} paise, got ${fetchedAmountPaise} paise`;
            await payment.save();
            return NextResponse.json(
                { success: false, message: "Payment amount mismatch. Contact support." },
                { status: 400 }
            );
        }

        if (fetchedStatus !== "captured" && fetchedStatus !== "authorized") {
            console.warn(`[VERIFY] Razorpay payment status not captured: ${fetchedStatus}`);
            payment.status = "failed";
            payment.paymentFailureReason = `Razorpay payment status: ${fetchedStatus}`;
            await payment.save();
            return NextResponse.json(
                {
                    success: false,
                    message: `Payment not confirmed by gateway (status: ${fetchedStatus}).`,
                },
                { status: 400 }
            );
        }

        // ── 8. All checks passed — mark booking as PAID ──────────────────
        const now = new Date();

        // Update payment record
        payment.status = "paid";
        payment.razorpayPaymentId = razorpay_payment_id;
        payment.razorpaySignature = razorpay_signature;
        payment.paidAt = now;
        payment.transactionId = razorpay_payment_id;
        payment.paymentFailureReason = "";
        await payment.save();

        // Update booking status to confirmed/completed (completed means service done & paid)
        const booking = await Booking.findById(bookingId);
        if (booking) {
            // If booking was completed (service done), keep it; otherwise update
            // Payment confirmation doesn't override service status,
            // but we do want to track the payment status on the booking
            // The booking status flow is separate from payment status
            await booking.save();
        }

        // ── 9. Send notifications ────────────────────────────────────────
        await Notification.create({
            recipientId: session.id,
            recipientRole: "customer",
            title: "Payment Successful ✓",
            message: `Your payment of ₹${fetchedAmountRupees} for booking #${bookingId.slice(-6)} has been confirmed. Payment ID: ${razorpay_payment_id}`,
            type: "system",
            link: `/payment/success?bookingId=${bookingId}`,
        });

        if (booking?.assignedProviderId) {
            await Notification.create({
                recipientId: booking.assignedProviderId,
                recipientRole: "serviceprovider",
                title: "Payment Received",
                message: `Payment of ₹${fetchedAmountRupees} received for booking #${bookingId.slice(-6)}.`,
                type: "system",
                link: "/Serviceprovider",
            });
        }

        return NextResponse.json({
            success: true,
            message: "Payment verified and confirmed successfully.",
            payment: {
                id: payment._id,
                razorpayPaymentId: razorpay_payment_id,
                razorpayOrderId: razorpay_order_id,
                status: "paid",
                amount: payment.amount,
                currency: payment.currency,
                paidAt: now,
            },
            booking: {
                id: bookingId,
                status: booking?.status,
            },
        });

    } catch (error) {
        console.error("[VERIFY] Unexpected error:", error.message || error);
        return NextResponse.json(
            { success: false, message: "Payment verification failed. Please try again." },
            { status: 500 }
        );
    }
}
