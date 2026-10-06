/**
 * SmartServe — Razorpay SDK singleton
 *
 * NEVER import this file in client-side code.
 * It uses RAZORPAY_KEY_SECRET which must remain server-only.
 */
import Razorpay from "razorpay";

let razorpayInstance = null;

export function getRazorpay() {
    if (razorpayInstance) return razorpayInstance;

    const key_id = process.env.RAZORPAY_KEY_ID;
    const key_secret = process.env.RAZORPAY_KEY_SECRET;

    if (!key_id || !key_secret) {
        throw new Error(
            "Razorpay credentials are not configured. " +
            "Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in .env.local"
        );
    }

    razorpayInstance = new Razorpay({ key_id, key_secret });
    return razorpayInstance;
}

/**
 * Convert rupees to paise (smallest INR unit Razorpay requires).
 * Always calculate server-side. Never accept paise from the client.
 */
export function rupeesToPaise(rupees) {
    return Math.round(Number(rupees) * 100);
}

/**
 * Convert paise back to rupees for display.
 */
export function paiseToRupees(paise) {
    return Math.round(Number(paise)) / 100;
}
