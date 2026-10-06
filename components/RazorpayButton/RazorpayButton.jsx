"use client";
import { useState, useCallback } from "react";

/**
 * SmartServe — RazorpayButton
 *
 * Replaces the fake "Confirm Payment" button with a real Razorpay checkout.
 *
 * Flow:
 *  1. User clicks "Pay ₹XXX Securely"
 *  2. We POST /api/payment/create-order → get Razorpay order ID (server-verified amount)
 *  3. We load Razorpay Checkout script
 *  4. Razorpay Checkout opens (UPI, cards, etc.)
 *  5. On success, we POST /api/payment/verify with the 3 Razorpay fields
 *  6. Server verifies signature + fetches from Razorpay → marks PAID
 *  7. We redirect to /payment/success or /payment/failure
 *
 * Security notes:
 *  - Amount is NEVER sent to the backend; it comes from the booking record server-side.
 *  - We NEVER mark payment as successful based on Razorpay Checkout's success callback alone.
 *  - Only after /api/payment/verify confirms do we redirect to success page.
 */

function loadRazorpayScript() {
    return new Promise((resolve) => {
        if (typeof window !== "undefined" && window.Razorpay) {
            resolve(true);
            return;
        }
        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        script.async = true;
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
    });
}

export default function RazorpayButton({
    bookingId,
    estimatedTotal,
    customerName,
    customerEmail,
    customerPhone,
    serviceNames,
    onSuccess,
    onFailure,
    onCancel,
    disabled = false,
}) {
    const [state, setState] = useState("idle"); // idle | loading | processing | verifying

    const stateLabels = {
        idle: `Pay ₹${estimatedTotal} Securely`,
        loading: "Opening secure payment...",
        processing: "Opening secure payment...",
        verifying: "Verifying payment...",
    };

    const handlePay = useCallback(async () => {
        if (state !== "idle" || disabled) return;

        setState("loading");

        try {
            // ── Step 1: Create Razorpay order (server-side, amount from booking) ──
            const orderRes = await fetch("/api/payment/create-order", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ bookingId }),
            });

            const orderData = await orderRes.json();

            if (!orderRes.ok) {
                if (orderData.alreadyPaid) {
                    // Redirect to success if already paid
                    if (typeof onSuccess === "function") {
                        onSuccess({ alreadyPaid: true, bookingId });
                    }
                    setState("idle");
                    return;
                }
                setState("idle");
                if (typeof onFailure === "function") {
                    onFailure(orderData.message || "Failed to create payment order.");
                }
                return;
            }

            const { orderId, keyId, amountPaise, currency } = orderData;

            // ── Step 2: Load Razorpay script ──────────────────────────────
            const scriptLoaded = await loadRazorpayScript();
            if (!scriptLoaded || typeof window.Razorpay === "undefined") {
                setState("idle");
                if (typeof onFailure === "function") {
                    onFailure("Razorpay checkout could not be loaded. Check your internet connection.");
                }
                return;
            }

            setState("processing");

            // ── Step 3: Open Razorpay Checkout ────────────────────────────
            const options = {
                key: keyId,                          // Public key only
                amount: amountPaise,
                currency: currency || "INR",
                name: "SmartServe",
                description: serviceNames || "Home Service Booking",
                order_id: orderId,
                prefill: {
                    name: customerName || "",
                    email: customerEmail || "",
                    contact: customerPhone || "",
                },
                theme: {
                    color: "#1e9e5a",               // SmartServe green
                },
                modal: {
                    ondismiss: () => {
                        // Customer closed the modal without paying
                        setState("idle");
                        if (typeof onCancel === "function") {
                            onCancel();
                        }
                    },
                },

                // ── Step 4: On payment success — verify server-side ───────
                handler: async function (response) {
                    setState("verifying");

                    const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = response;

                    try {
                        const verifyRes = await fetch("/api/payment/verify", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                                razorpay_payment_id,
                                razorpay_order_id,
                                razorpay_signature,
                                bookingId,
                            }),
                        });

                        const verifyData = await verifyRes.json();

                        setState("idle");

                        if (verifyRes.ok && verifyData.success) {
                            if (typeof onSuccess === "function") {
                                onSuccess({
                                    bookingId,
                                    razorpay_payment_id,
                                    razorpay_order_id,
                                    amount: verifyData.payment?.amount,
                                    paidAt: verifyData.payment?.paidAt,
                                });
                            }
                        } else {
                            if (typeof onFailure === "function") {
                                onFailure(verifyData.message || "Payment verification failed.");
                            }
                        }
                    } catch (verifyErr) {
                        setState("idle");
                        // Network failure after payment — the webhook will recover.
                        // Tell the user to check their payment status page.
                        if (typeof onFailure === "function") {
                            onFailure(
                                "Payment may have succeeded but could not be confirmed. " +
                                "Please check your bookings page or contact support."
                            );
                        }
                    }
                },
            };

            const rzp = new window.Razorpay(options);

            rzp.on("payment.failed", function (response) {
                setState("idle");
                const reason =
                    response.error?.description ||
                    response.error?.reason ||
                    "Payment failed";
                if (typeof onFailure === "function") {
                    onFailure(reason);
                }
            });

            rzp.open();

        } catch (err) {
            console.error("RazorpayButton error:", err);
            setState("idle");
            if (typeof onFailure === "function") {
                onFailure("Something went wrong. Please try again.");
            }
        }
    }, [bookingId, state, disabled, customerName, customerEmail, customerPhone, serviceNames, onSuccess, onFailure, onCancel]);

    const isActive = state !== "idle";

    return (
        <button
            type="button"
            onClick={handlePay}
            disabled={isActive || disabled}
            style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                background: isActive
                    ? "#94a3b8"
                    : "linear-gradient(135deg, #1e9e5a 0%, #15803d 100%)",
                color: "#ffffff",
                border: "none",
                borderRadius: "10px",
                padding: "10px 20px",
                fontSize: "14px",
                fontWeight: "700",
                cursor: isActive || disabled ? "not-allowed" : "pointer",
                transition: "all 0.2s ease",
                boxShadow: isActive ? "none" : "0 2px 8px rgba(30,158,90,0.35)",
                letterSpacing: "0.01em",
                minWidth: "180px",
            }}
        >
            {isActive && (
                <span
                    style={{
                        width: "14px",
                        height: "14px",
                        border: "2px solid rgba(255,255,255,0.4)",
                        borderTopColor: "#fff",
                        borderRadius: "50%",
                        display: "inline-block",
                        animation: "rzp-spin 0.7s linear infinite",
                    }}
                />
            )}
            {!isActive && (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                    <line x1="1" y1="10" x2="23" y2="10" />
                </svg>
            )}
            {stateLabels[state]}

            <style>{`
                @keyframes rzp-spin {
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </button>
    );
}
