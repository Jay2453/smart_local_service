import mongoose from "mongoose";

const serviceItemSchema = new mongoose.Schema(
    {
        serviceId: {
            type: String,
            required: true,
        },
        name: {
            type: String,
            required: true,
        },
        problem: {
            type: String,
            required: true,
        },
        price: {
            type: Number,
            required: true,
        },
    },
    { _id: false }
);

const bookingSchema = new mongoose.Schema(
    {
        customerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        services: {
            type: [serviceItemSchema],
            required: true,
            validate: [
                (val) => val.length > 0,
                "At least one service must be selected",
            ],
        },
        description: {
            type: String,
            required: true,
            trim: true,
        },
        photos: {
            type: [String],
            default: [],
        },
        address: {
            type: String,
            required: true,
            trim: true,
        },
        location: {
            latitude: {
                type: Number,
                default: null,
            },
            longitude: {
                type: Number,
                default: null,
            },
        },
        preferredDate: {
            type: String,
            required: true,
        },
        preferredTime: {
            type: String,
            required: true,
        },
        estimatedTotal: {
            type: Number,
            required: true,
            min: 0,
        },
        status: {
            type: String,
            enum: ["pending", "accepted", "in_progress", "completed", "cancelled"],
            default: "pending",
        },
        assignedProviderId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Provider",
            default: null,
        },
        completedAt: {
            type: Date,
            default: null,
        },
        cancelledAt: {
            type: Date,
            default: null,
        },
        cancellationReason: {
            type: String,
            default: "",
        },
    },
    {
        timestamps: true,
    }
);

const Booking =
    mongoose.models.Booking ||
    mongoose.model("Booking", bookingSchema);

export default Booking;
