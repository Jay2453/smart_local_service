import mongoose from "mongoose";

const bookingRequestSchema = new mongoose.Schema(
    {
        bookingId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Booking",
            required: true,
        },
        providerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Provider",
            required: true,
        },
        status: {
            type: String,
            enum: ["sent", "viewed", "accepted", "rejected", "expired"],
            default: "sent",
        },
        distanceKm: {
            type: Number,
            default: 0,
        },
        sentAt: {
            type: Date,
            default: Date.now,
        },
        respondedAt: {
            type: Date,
            default: null,
        },
        expiresAt: {
            type: Date,
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

bookingRequestSchema.index({ bookingId: 1, providerId: 1 }, { unique: true });

const BookingRequest =
    mongoose.models.BookingRequest ||
    mongoose.model("BookingRequest", bookingRequestSchema);

export default BookingRequest;
