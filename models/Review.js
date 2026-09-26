import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
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
        rating: {
            type: Number,
            required: true,
            min: 1,
            max: 5,
        },
        comment: {
            type: String,
            default: "",
            trim: true,
        },
        status: {
            type: String,
            enum: ["visible", "hidden", "flagged"],
            default: "visible",
        },
        moderatedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },
        moderatedAt: {
            type: Date,
            default: null,
        },
        moderationReason: {
            type: String,
            default: "",
        },
    },
    {
        timestamps: true,
    }
);

reviewSchema.index({ providerId: 1, status: 1 });
reviewSchema.index({ customerId: 1 });
reviewSchema.index({ status: 1, createdAt: -1 });

const Review =
    mongoose.models.Review ||
    mongoose.model("Review", reviewSchema);

export default Review;

