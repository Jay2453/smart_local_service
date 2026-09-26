import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
    {
        recipientId: {
            type: mongoose.Schema.Types.ObjectId,
            default: null,
        },
        recipientRole: {
            type: String,
            enum: ["customer", "serviceprovider", "admin", "all"],
            required: true,
        },
        title: {
            type: String,
            required: true,
            trim: true,
        },
        message: {
            type: String,
            required: true,
            trim: true,
        },
        type: {
            type: String,
            enum: ["booking", "verification", "system", "announcement", "alert"],
            default: "system",
        },
        read: {
            type: Boolean,
            default: false,
        },
        link: {
            type: String,
            default: "",
        },
        isBroadcast: {
            type: Boolean,
            default: false,
        },
        broadcastTarget: {
            type: String,
            enum: ["all", "customers", "providers", "none"],
            default: "none",
        },
        sentByAdminId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

notificationSchema.index({ recipientId: 1, read: 1, createdAt: -1 });
notificationSchema.index({ isBroadcast: 1, broadcastTarget: 1 });
notificationSchema.index({ createdAt: -1 });

const Notification =
    mongoose.models.Notification ||
    mongoose.model("Notification", notificationSchema);

export default Notification;

