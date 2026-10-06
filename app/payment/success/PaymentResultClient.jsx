"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

/**
 * SmartServe Payment Result Page
 * /payment/success
 *
 * IMPORTANT: This page does NOT trust URL parameters or localStorage to
 * determine payment success. It ALWAYS fetches the server-side payment
 * status from /api/payment/status?bookingId=<id>.
 *
 * Only after the server confirms the payment is "paid" does it show
 * the success state.
 */

const STATUS_ICONS = {
    paid: (
        <div style={{
            width: "72px", height: "72px", borderRadius: "50%",
            background: "linear-gradient(135deg, #22c55e, #15803d)",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 8px 24px rgba(34,197,94,0.35)",
            margin: "0 auto 20px"
        }}>
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
            </svg>
        </div>
    ),
    completed: (
        <div style={{
            width: "72px", height: "72px", borderRadius: "50%",
            background: "linear-gradient(135deg, #22c55e, #15803d)",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 8px 24px rgba(34,197,94,0.35)",
            margin: "0 auto 20px"
        }}>
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
            </svg>
        </div>
    ),
    failed: (
        <div style={{
            width: "72px", height: "72px", borderRadius: "50%",
            background: "linear-gradient(135deg, #ef4444, #b91c1c)",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 8px 24px rgba(239,68,68,0.35)",
            margin: "0 auto 20px"
        }}>
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
        </div>
    ),
    cancelled: (
        <div style={{
            width: "72px", height: "72px", borderRadius: "50%",
            background: "linear-gradient(135deg, #f59e0b, #b45309)",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 8px 24px rgba(245,158,11,0.35)",
            margin: "0 auto 20px"
        }}>
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
        </div>
    ),
    pending: (
        <div style={{
            width: "72px", height: "72px", borderRadius: "50%",
            background: "linear-gradient(135deg, #6366f1, #4338ca)",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 8px 24px rgba(99,102,241,0.35)",
            margin: "0 auto 20px"
        }}>
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
            </svg>
        </div>
    ),
    created: (
        <div style={{
            width: "72px", height: "72px", borderRadius: "50%",
            background: "linear-gradient(135deg, #6366f1, #4338ca)",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 8px 24px rgba(99,102,241,0.35)",
            margin: "0 auto 20px"
        }}>
            <span style={{
                width: "32px", height: "32px",
                border: "3px solid rgba(255,255,255,0.35)",
                borderTopColor: "#fff",
                borderRadius: "50%",
                display: "inline-block",
                animation: "psr-spin 0.8s linear infinite",
            }} />
        </div>
    ),
};

function formatDate(dateStr) {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleString("en-IN", {
        day: "numeric", month: "long", year: "numeric",
        hour: "2-digit", minute: "2-digit",
    });
}

function InfoRow({ label, value, mono }) {
    return (
        <div style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            padding: "10px 0", borderBottom: "1px solid #f1f5f9",
        }}>
            <span style={{ fontSize: "13.5px", color: "#64748b", fontWeight: "500" }}>{label}</span>
            <span style={{
                fontSize: "13.5px", color: "#1e293b", fontWeight: "600",
                fontFamily: mono ? "monospace" : undefined,
                wordBreak: "break-all", textAlign: "right", maxWidth: "60%",
            }}>
                {value || "—"}
            </span>
        </div>
    );
}

export default function PaymentResultPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const bookingId = searchParams.get("bookingId");

    const [loading, setLoading] = useState(true);
    const [data, setData] = useState(null);
    const [error, setError] = useState("");
    const [pollCount, setPollCount] = useState(0);

    const fetchStatus = useCallback(async () => {
        if (!bookingId) {
            setError("No booking ID provided.");
            setLoading(false);
            return;
        }

        try {
            const res = await fetch(`/api/payment/status?bookingId=${bookingId}`);
            const json = await res.json();

            if (!res.ok || !json.success) {
                setError(json.message || "Failed to retrieve payment status.");
                setLoading(false);
                return;
            }

            setData(json);
            setLoading(false);

            // If still in a transient state, poll again (max 12 attempts = ~60s)
            const paymentStatus = json.payment?.status;
            const isTransient = !paymentStatus || paymentStatus === "created";
            if (isTransient && pollCount < 12) {
                setTimeout(() => {
                    setPollCount((c) => c + 1);
                }, 5000);
            }
        } catch (err) {
            console.error("fetchStatus error:", err);
            setError("Network error. Please refresh the page.");
            setLoading(false);
        }
    }, [bookingId, pollCount]);

    useEffect(() => {
        fetchStatus();
    }, [fetchStatus]);

    const paymentStatus = data?.payment?.status;
    const bookingData = data?.booking;
    const paymentData = data?.payment;
    const isSuccess = paymentStatus === "paid" || paymentStatus === "completed";
    const isFailed = paymentStatus === "failed";
    const isCancelled = paymentStatus === "cancelled";
    const isPending = !paymentStatus || paymentStatus === "created" || paymentStatus === "pending";

    if (loading) {
        return (
            <div style={pageStyle}>
                <div style={cardStyle}>
                    <div style={{ textAlign: "center", padding: "40px 20px" }}>
                        <div style={{
                            width: "48px", height: "48px",
                            border: "3px solid #e2e8f0",
                            borderTopColor: "#1e9e5a",
                            borderRadius: "50%",
                            animation: "psr-spin 0.7s linear infinite",
                            margin: "0 auto 20px",
                        }} />
                        <p style={{ color: "#64748b", fontSize: "15px" }}>Loading payment status...</p>
                    </div>
                    <style>{`@keyframes psr-spin { to { transform: rotate(360deg); } }`}</style>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div style={pageStyle}>
                <div style={cardStyle}>
                    <div style={{ textAlign: "center", padding: "20px" }}>
                        <div style={{
                            width: "64px", height: "64px", borderRadius: "50%",
                            background: "#fef2f2", display: "flex", alignItems: "center",
                            justifyContent: "center", margin: "0 auto 16px"
                        }}>
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10" />
                                <line x1="12" y1="8" x2="12" y2="12" />
                                <line x1="12" y1="16" x2="12.01" y2="16" />
                            </svg>
                        </div>
                        <h2 style={{ fontSize: "18px", fontWeight: "700", marginBottom: "8px" }}>Unable to Load Status</h2>
                        <p style={{ color: "#64748b", fontSize: "14px", marginBottom: "20px" }}>{error}</p>
                        <div style={{ display: "flex", gap: "10px", justifyContent: "center", flexWrap: "wrap" }}>
                            <button onClick={fetchStatus} style={btnPrimary}>Retry</button>
                            <Link href="/Dashboard" style={btnSecondary}>Go to Dashboard</Link>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div style={pageStyle}>
            <div style={cardStyle}>
                {/* Icon */}
                {STATUS_ICONS[paymentStatus] || STATUS_ICONS.pending}

                {/* Headline */}
                <h1 style={{ textAlign: "center", fontSize: "22px", fontWeight: "800", marginBottom: "6px", color: "#1e293b" }}>
                    {isSuccess && "Payment Successful! 🎉"}
                    {isFailed && "Payment Failed"}
                    {isCancelled && "Payment Cancelled"}
                    {isPending && "Verifying Payment..."}
                </h1>

                <p style={{ textAlign: "center", color: "#64748b", fontSize: "14px", marginBottom: "28px" }}>
                    {isSuccess && "Your booking has been confirmed and payment received securely."}
                    {isFailed && "Your payment could not be processed. No amount has been deducted."}
                    {isCancelled && "You closed the payment window. No amount was deducted."}
                    {isPending && "We're confirming your payment with our payment partner. This usually takes a few seconds."}
                </p>

                {/* Details */}
                {bookingData && (
                    <div style={{ marginBottom: "20px" }}>
                        <h3 style={{ fontSize: "13px", fontWeight: "700", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "4px" }}>
                            Booking Details
                        </h3>
                        <InfoRow label="Booking ID" value={`#${bookingId?.slice(-8).toUpperCase()}`} />
                        <InfoRow label="Service" value={bookingData.services?.map((s) => s.name).join(", ")} />
                        <InfoRow label="Date" value={bookingData.preferredDate} />
                        <InfoRow label="Time" value={bookingData.preferredTime} />
                        <InfoRow label="Amount" value={`₹${bookingData.estimatedTotal}`} />
                    </div>
                )}

                {paymentData && (
                    <div style={{ marginBottom: "24px" }}>
                        <h3 style={{ fontSize: "13px", fontWeight: "700", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "4px" }}>
                            Payment Details
                        </h3>
                        <InfoRow
                            label="Status"
                            value={
                                isSuccess ? "✓ Paid" :
                                isFailed ? "✗ Failed" :
                                isCancelled ? "Cancelled" :
                                "Processing..."
                            }
                        />
                        {paymentData.razorpayPaymentId && (
                            <InfoRow label="Payment ID" value={paymentData.razorpayPaymentId} mono />
                        )}
                        {paymentData.razorpayOrderId && (
                            <InfoRow label="Order ID" value={paymentData.razorpayOrderId} mono />
                        )}
                        {paymentData.paidAt && (
                            <InfoRow label="Paid At" value={formatDate(paymentData.paidAt)} />
                        )}
                        {paymentData.paymentFailureReason && (
                            <InfoRow label="Reason" value={paymentData.paymentFailureReason} />
                        )}
                    </div>
                )}

                {/* Pending polling note */}
                {isPending && (
                    <div style={{
                        background: "#f0f4ff", border: "1px solid #c7d2fe",
                        borderRadius: "10px", padding: "14px 16px",
                        marginBottom: "20px", fontSize: "13.5px", color: "#4338ca",
                        display: "flex", gap: "10px", alignItems: "flex-start"
                    }}>
                        <span style={{
                            width: "16px", height: "16px", flexShrink: 0, marginTop: "1px",
                            border: "2px solid #c7d2fe", borderTopColor: "#4338ca",
                            borderRadius: "50%", display: "inline-block",
                            animation: "psr-spin 0.7s linear infinite",
                        }} />
                        <span>
                            Payment verification is in progress. This page will update automatically.
                            If this takes too long, check your <strong>My Bookings</strong> section.
                        </span>
                    </div>
                )}

                {/* Actions */}
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    {isSuccess && (
                        <Link href="/Dashboard" style={{ ...btnPrimary, textAlign: "center", textDecoration: "none" }}>
                            View My Bookings
                        </Link>
                    )}
                    {(isFailed || isCancelled) && bookingId && (
                        <button
                            onClick={() => router.push(`/Dashboard`)}
                            style={btnPrimary}
                        >
                            Try Payment Again
                        </button>
                    )}
                    {isPending && (
                        <button onClick={fetchStatus} style={{ ...btnSecondary, textAlign: "center" }}>
                            Refresh Status
                        </button>
                    )}
                    <Link href="/Dashboard" style={{ ...btnSecondary, textAlign: "center", textDecoration: "none" }}>
                        Go to Dashboard
                    </Link>
                </div>

                {/* Powered by */}
                <div style={{
                    marginTop: "24px", paddingTop: "16px",
                    borderTop: "1px solid #f1f5f9",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    gap: "6px", color: "#94a3b8", fontSize: "12px"
                }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                    Secured by Razorpay
                </div>
            </div>
            <style>{`@keyframes psr-spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );
}

const pageStyle = {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "linear-gradient(135deg, #f0fdf4 0%, #f8fafc 50%, #f0f4ff 100%)",
    padding: "20px",
    fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
};

const cardStyle = {
    background: "#ffffff",
    borderRadius: "20px",
    padding: "36px 32px",
    width: "100%",
    maxWidth: "480px",
    boxShadow: "0 20px 60px rgba(0,0,0,0.1), 0 4px 16px rgba(0,0,0,0.06)",
};

const btnPrimary = {
    background: "linear-gradient(135deg, #1e9e5a 0%, #15803d 100%)",
    color: "#ffffff",
    border: "none",
    borderRadius: "10px",
    padding: "12px 24px",
    fontSize: "14px",
    fontWeight: "700",
    cursor: "pointer",
    display: "block",
    width: "100%",
    textDecoration: "none",
    boxShadow: "0 2px 8px rgba(30,158,90,0.3)",
};

const btnSecondary = {
    background: "none",
    color: "#64748b",
    border: "1px solid #e2e8f0",
    borderRadius: "10px",
    padding: "12px 24px",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
    display: "block",
    width: "100%",
    textDecoration: "none",
};
