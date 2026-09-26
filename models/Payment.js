import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
    {
        bookingId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Booking",
            required: true,
            unique: true,
        },
        customerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        providerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Provider",
            required: true,
        },
        amount: {
            type: Number,
            required: true,
            min: 0,
        },
        currency: {
            type: String,
            default: "INR",
        },
        method: {
            type: String,
            enum: ["cash", "online"],
            default: "cash",
        },
        status: {
            type: String,
            enum: ["pending", "completed", "refunded", "failed"],
            default: "pending",
        },
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
        transactionId: {
            type: String,
            default: "",
            trim: true,
        },
        paidAt: {
            type: Date,
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

paymentSchema.index({ status: 1, createdAt: -1 });
paymentSchema.index({ payoutStatus: 1 });
paymentSchema.index({ refundStatus: 1 });
paymentSchema.index({ providerId: 1 });
paymentSchema.index({ customerId: 1 });

const Payment =
    mongoose.models.Payment ||
    mongoose.model("Payment", paymentSchema);

export default Payment;

