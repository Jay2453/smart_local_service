import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Payment from "@/models/Payment";
import Booking from "@/models/Booking";
import Notification from "@/models/Notification";
import { verifyWebhookSignature } from "@/lib/paymentVerification";
import { paiseToRupees } from "@/lib/razorpay";

/**
 * POST /api/payment/webhook
 *
 * Razorpay Webhook endpoint.
 *
 * CRITICAL: This route reads the RAW request body before any parsing
 * so that the HMAC signature over the raw bytes matches Razorpay's
 * expectation. Parsing and re-stringifying would break the signature.
 *
 * Configure in Razorpay Dashboard:
 *   URL: https://yourdomain.com/api/payment/webhook
 *   Events: payment.captured, payment.failed, refund.processed
 *   Secret: (value of RAZORPAY_WEBHOOK_SECRET)
 *
 * This endpoint is idempotent:
 *   - Duplicate events are ignored using processedWebhookEvents array.
 *   - A successful payment state cannot regress.
 */

// Next.js App Router: disable body parsing so we get raw bytes for sig verification
export const dynamic = "force-dynamic";

export async function POST(request) {
    // ── 1. Read RAW body FIRST — before any JSON.parse ──────────────────
    let rawBody;
    try {
        rawBody = await request.text();
    } catch {
        return NextResponse.json(
            { success: false, message: "Failed to read request body." },
            { status: 400 }
        );
    }

    // ── 2. Verify webhook signature ──────────────────────────────────────
    const signature = request.headers.get("x-razorpay-signature");

    if (!signature) {
        console.warn("[WEBHOOK] Missing X-Razorpay-Signature header");
        return NextResponse.json(
            { success: false, message: "Missing signature header." },
            { status: 401 }
        );
    }

    let signatureValid;
    try {
        signatureValid = verifyWebhookSignature(rawBody, signature);
    } catch (err) {
        console.error("[WEBHOOK] Signature verification error:", err.message);
        return NextResponse.json(
            { success: false, message: "Webhook secret not configured." },
            { status: 500 }
        );
    }

    if (!signatureValid) {
        console.error("[WEBHOOK] INVALID webhook signature — potential spoofing attempt");
        return NextResponse.json(
            { success: false, message: "Invalid webhook signature." },
            { status: 401 }
        );
    }

    // ── 3. Parse event payload ───────────────────────────────────────────
    let event;
    try {
        event = JSON.parse(rawBody);
    } catch {
        console.error("[WEBHOOK] Failed to parse webhook JSON");
        return NextResponse.json(
            { success: false, message: "Invalid JSON payload." },
            { status: 400 }
        );
    }

    const eventType = event.event;
    const eventId = event.id || "";
    const payload = event.payload;

    console.log(`[WEBHOOK] Received event: ${eventType} (id=${eventId})`);

    await connectDB();

    try {
        switch (eventType) {
            case "payment.captured":
                await handlePaymentCaptured(payload, eventId);
                break;

            case "payment.failed":
                await handlePaymentFailed(payload, eventId);
                break;

            case "refund.processed":
                await handleRefundProcessed(payload, eventId);
                break;

            case "order.paid":
                // Duplicate of payment.captured — handled by idempotency
                await handlePaymentCaptured(payload, eventId);
                break;

            default:
                // Acknowledge unknown events without processing
                console.log(`[WEBHOOK] Unhandled event type: ${eventType}`);
        }
    } catch (err) {
        // Log but always return 200 to Razorpay to prevent retry spam
        // (unless it's a bug we want Razorpay to retry)
        console.error(`[WEBHOOK] Error handling ${eventType}:`, err.message);
    }

    // Always acknowledge receipt to Razorpay
    return NextResponse.json({ success: true, received: true });
}

// ── Event Handlers ────────────────────────────────────────────────────────────

async function handlePaymentCaptured(payload, eventId) {
    const paymentEntity = payload?.payment?.entity;
    if (!paymentEntity) {
        console.warn("[WEBHOOK] payment.captured: missing payment entity");
        return;
    }

    const razorpayOrderId = paymentEntity.order_id;
    const razorpayPaymentId = paymentEntity.id;
    const amountPaise = paymentEntity.amount;
    const fetchedStatus = paymentEntity.status;

    if (!razorpayOrderId || !razorpayPaymentId) {
        console.warn("[WEBHOOK] payment.captured: missing orderId or paymentId");
        return;
    }

    const payment = await Payment.findOne({ razorpayOrderId });

    if (!payment) {
        console.warn(`[WEBHOOK] payment.captured: no payment record for orderId=${razorpayOrderId}`);
        return;
    }

    // ── Idempotency ──────────────────────────────────────────────────────
    if (eventId && payment.processedWebhookEvents.includes(eventId)) {
        console.log(`[WEBHOOK] Duplicate event ignored: ${eventId}`);
        return;
    }

    // ── No regression: already paid stays paid ───────────────────────────
    if (payment.status === "paid" || payment.status === "completed") {
        console.log(`[WEBHOOK] Payment already in terminal state: ${payment.status}`);
        if (eventId) {
            payment.processedWebhookEvents.push(eventId);
            await payment.save();
        }
        return;
    }

    // ── Amount cross-check ───────────────────────────────────────────────
    const expectedPaise = Math.round(payment.amount * 100);
    if (Math.abs(amountPaise - expectedPaise) > 1) {
        console.error(
            `[WEBHOOK] Amount mismatch for orderId=${razorpayOrderId}: ` +
            `expected=${expectedPaise} got=${amountPaise}`
        );
        // Don't mark as paid; log for manual review
        return;
    }

    if (fetchedStatus !== "captured" && fetchedStatus !== "authorized") {
        console.warn(`[WEBHOOK] Payment status not captured: ${fetchedStatus}`);
        return;
    }

    // ── Mark as paid ─────────────────────────────────────────────────────
    const now = new Date();
    payment.status = "paid";
    payment.razorpayPaymentId = razorpayPaymentId;
    payment.paidAt = now;
    payment.transactionId = razorpayPaymentId;
    payment.paymentFailureReason = "";
    if (eventId) payment.processedWebhookEvents.push(eventId);
    await payment.save();

    // ── Notify customer ──────────────────────────────────────────────────
    try {
        await Notification.create({
            recipientId: payment.customerId,
            recipientRole: "customer",
            title: "Payment Confirmed ✓",
            message: `Payment of ₹${paiseToRupees(amountPaise)} for booking #${payment.bookingId.toString().slice(-6)} has been confirmed.`,
            type: "system",
            link: `/payment/success?bookingId=${payment.bookingId}`,
        });

        if (payment.providerId) {
            await Notification.create({
                recipientId: payment.providerId,
                recipientRole: "serviceprovider",
                title: "Payment Received",
                message: `Payment of ₹${paiseToRupees(amountPaise)} received for booking #${payment.bookingId.toString().slice(-6)}.`,
                type: "system",
                link: "/Serviceprovider",
            });
        }
    } catch (notifErr) {
        console.error("[WEBHOOK] Notification error:", notifErr.message);
    }

    console.log(`[WEBHOOK] Payment marked PAID: orderId=${razorpayOrderId} paymentId=${razorpayPaymentId}`);
}

async function handlePaymentFailed(payload, eventId) {
    const paymentEntity = payload?.payment?.entity;
    if (!paymentEntity) return;

    const razorpayOrderId = paymentEntity.order_id;
    const errorDescription = paymentEntity.error_description || "Payment failed";

    if (!razorpayOrderId) return;

    const payment = await Payment.findOne({ razorpayOrderId });
    if (!payment) return;

    // Idempotency
    if (eventId && payment.processedWebhookEvents.includes(eventId)) return;

    // Don't regress from a paid state
    if (payment.status === "paid" || payment.status === "completed") return;

    payment.status = "failed";
    payment.paymentFailureReason = errorDescription.slice(0, 500);
    if (eventId) payment.processedWebhookEvents.push(eventId);
    await payment.save();

    // Notify customer of failure
    try {
        await Notification.create({
            recipientId: payment.customerId,
            recipientRole: "customer",
            title: "Payment Failed",
            message: `Payment for booking #${payment.bookingId.toString().slice(-6)} could not be processed. Please try again.`,
            type: "system",
            link: `/Dashboard`,
        });
    } catch (notifErr) {
        console.error("[WEBHOOK] Notification error:", notifErr.message);
    }

    console.log(`[WEBHOOK] Payment marked FAILED: orderId=${razorpayOrderId}`);
}

async function handleRefundProcessed(payload, eventId) {
    const refundEntity = payload?.refund?.entity;
    if (!refundEntity) return;

    const razorpayPaymentId = refundEntity.payment_id;
    const refundAmountPaise = refundEntity.amount;
    const refundId = refundEntity.id;

    if (!razorpayPaymentId) return;

    const payment = await Payment.findOne({ razorpayPaymentId });
    if (!payment) return;

    // Idempotency
    if (eventId && payment.processedWebhookEvents.includes(eventId)) return;

    payment.refundStatus = "processed";
    payment.refundAmount = paiseToRupees(refundAmountPaise);
    payment.refundedAt = new Date();
    payment.status = "refunded";
    if (eventId) payment.processedWebhookEvents.push(eventId);
    await payment.save();

    try {
        await Notification.create({
            recipientId: payment.customerId,
            recipientRole: "customer",
            title: "Refund Processed",
            message: `A refund of ₹${paiseToRupees(refundAmountPaise)} has been processed for booking #${payment.bookingId.toString().slice(-6)}.`,
            type: "system",
            link: "/Dashboard",
        });
    } catch (notifErr) {
        console.error("[WEBHOOK] Notification error:", notifErr.message);
    }

    console.log(`[WEBHOOK] Refund processed: paymentId=${razorpayPaymentId} refundId=${refundId}`);
}
