import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
    {
        recipientId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
        },
        recipientRole: {
            type: String,
            enum: ["customer", "serviceprovider"],
            required: true,
        },
        title: {
            type: String,
            required: true,
        },
        message: {
            type: String,
            required: true,
        },
        type: {
            type: String,
            enum: ["booking", "verification", "system"],
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
    },
    {
        timestamps: true,
    }
);

const Notification =
    mongoose.models.Notification ||
    mongoose.model("Notification", notificationSchema);

export default Notification;
