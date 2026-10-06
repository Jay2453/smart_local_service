/**
 * SmartServe — Server-side Razorpay signature & payment verification.
 *
 * CRITICAL: This file must NEVER be imported in client-side code.
 * All verification uses RAZORPAY_KEY_SECRET which is server-only.
 */
import crypto from "crypto";

/**
 * Cryptographically verify a Razorpay payment signature.
 *
 * Razorpay signs the payload as:
 *   HMAC-SHA256( razorpay_order_id + "|" + razorpay_payment_id , KEY_SECRET )
 *
 * @param {string} razorpayOrderId
 * @param {string} razorpayPaymentId
 * @param {string} receivedSignature  - the signature sent by Razorpay Checkout
 * @returns {boolean}
 */
export function verifyPaymentSignature(razorpayOrderId, razorpayPaymentId, receivedSignature) {
    const secret = process.env.RAZORPAY_KEY_SECRET;
    if (!secret) throw new Error("RAZORPAY_KEY_SECRET is not set");

    const message = `${razorpayOrderId}|${razorpayPaymentId}`;
    const expectedSignature = crypto
        .createHmac("sha256", secret)
        .update(message)
        .digest("hex");

    // Timing-safe comparison to prevent timing attacks
    try {
        return crypto.timingSafeEqual(
            Buffer.from(expectedSignature, "hex"),
            Buffer.from(receivedSignature, "hex")
        );
    } catch {
        // Buffer lengths differ → definitely not equal
        return false;
    }
}

/**
 * Verify a Razorpay webhook signature.
 *
 * Razorpay signs with:
 *   HMAC-SHA256( rawBody , WEBHOOK_SECRET )
 *
 * IMPORTANT: rawBody must be the ORIGINAL binary buffer/string —
 * not a parsed-and-re-stringified JSON object.
 *
 * @param {string|Buffer} rawBody   - raw request body bytes
 * @param {string} receivedSignature - X-Razorpay-Signature header value
 * @returns {boolean}
 */
export function verifyWebhookSignature(rawBody, receivedSignature) {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!secret) throw new Error("RAZORPAY_WEBHOOK_SECRET is not set");

    const expectedSignature = crypto
        .createHmac("sha256", secret)
        .update(rawBody)
        .digest("hex");

    try {
        return crypto.timingSafeEqual(
            Buffer.from(expectedSignature, "hex"),
            Buffer.from(receivedSignature, "hex")
        );
    } catch {
        return false;
    }
}
