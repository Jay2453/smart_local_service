import mongoose from "mongoose";

/**
 * SmartServe Payment Model
 *
 * Extended to support full Razorpay payment lifecycle:
 * PENDING → CREATED → PAID | FAILED | CANCELLED
 * PAID → REFUNDED
 *
 * Payment state is ONLY updated server-side after cryptographic verification.
 * The frontend can NEVER directly set status to "completed"/"PAID".
 */

const paymentSchema = new mongoose.Schema(
    {
        bookingId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Booking",
            required: true,
            unique: true,   // one payment record per booking
            index: true,
        },
        customerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        providerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Provider",
            default: null,
        },

        // ── Monetary fields ──────────────────────────────────────────────
        // amount is always in RUPEES (human-readable). Paise conversions
        // happen only at the Razorpay API boundary.
        amount: {
            type: Number,
            required: true,
            min: 0,
        },
        currency: {
            type: String,
            default: "INR",
        },

        // ── Payment method / provider ────────────────────────────────────
        method: {
            type: String,
            enum: ["cash", "online", "razorpay"],
            default: "razorpay",
        },

        // ── Razorpay gateway fields ──────────────────────────────────────
        // These are set by the server ONLY after verified interactions with Razorpay.
        paymentProvider: {
            type: String,
            enum: ["razorpay", "cash", null],
            default: null,
        },
        razorpayOrderId: {
            type: String,
            default: null,
            index: true,
            sparse: true,
        },
        razorpayPaymentId: {
            type: String,
            default: null,
            index: true,
            sparse: true,
        },
        razorpaySignature: {
            type: String,
            default: null,
        },

        // ── Payment status state machine ─────────────────────────────────
        // Allowed transitions:
        //   pending → created → paid | failed | cancelled
        //   paid → refunded
        //
        // Legacy values "completed" / "refunded" are kept in enum for
        // backward compatibility with existing cash payments.
        status: {
            type: String,
            enum: [
                "pending",      // order not yet created at Razorpay
                "created",      // Razorpay order created, awaiting payment
                "paid",         // signature verified & Razorpay confirms payment captured
                "failed",       // payment attempt failed at gateway
                "cancelled",    // customer closed checkout / request cancelled
                "refunded",     // fully or partially refunded
                "completed",    // (legacy) cash payment completed
            ],
            default: "pending",
        },

        // Failure reason (from Razorpay error description, if available)
        paymentFailureReason: {
            type: String,
            default: "",
        },

        // ── Timestamps ───────────────────────────────────────────────────
        paidAt: {
            type: Date,
            default: null,
        },

        // ── Platform commission / payout ─────────────────────────────────
        commissionPercent: {
            type: Number,
            default: 10,
            min: 0,
            max: 100,
        },
        commissionAmount: {
            type: Number,
            default: 0,
            min: 0,
        },
        providerPayoutAmount: {
            type: Number,
            default: 0,
            min: 0,
        },
        payoutStatus: {
            type: String,
            enum: ["pending", "processed", "failed", "na"],
            default: "pending",
        },
        payoutProcessedAt: {
            type: Date,
            default: null,
        },

        // ── Refund tracking ──────────────────────────────────────────────
        refundStatus: {
            type: String,
            enum: ["none", "requested", "approved", "processed", "rejected"],
            default: "none",
        },
        refundAmount: {
            type: Number,
            default: 0,
            min: 0,
        },
        refundReason: {
            type: String,
            default: "",
        },
        refundedAt: {
            type: Date,
            default: null,
        },

        // ── Legacy / misc ────────────────────────────────────────────────
        transactionId: {
            type: String,
            default: "",
            trim: true,
        },

        // Webhook idempotency: track processed webhook event IDs
        processedWebhookEvents: {
            type: [String],
            default: [],
        },
    },
    {
        timestamps: true,
    }
);

// ── Indexes ──────────────────────────────────────────────────────────────────
paymentSchema.index({ status: 1, createdAt: -1 });
paymentSchema.index({ payoutStatus: 1 });
paymentSchema.index({ refundStatus: 1 });
paymentSchema.index({ providerId: 1 });
paymentSchema.index({ customerId: 1 });

// ── Singleton model pattern (Next.js hot-reload safe) ─────────────────────────
const Payment =
    mongoose.models.Payment ||
    mongoose.model("Payment", paymentSchema);

export default Payment;
