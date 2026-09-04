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
        method: {
            type: String,
            enum: ["cash", "online"],
            default: "cash",
        },
        status: {
            type: String,
            enum: ["pending", "completed"],
            default: "pending",
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

const Payment =
    mongoose.models.Payment ||
    mongoose.model("Payment", paymentSchema);

export default Payment;
