import mongoose from "mongoose";

const ticketMessageSchema = new mongoose.Schema(
    {
        senderRole: {
            type: String,
            enum: ["customer", "serviceprovider", "admin", "system"],
            required: true,
        },
        senderId: {
            type: mongoose.Schema.Types.ObjectId,
            default: null,
        },
        senderName: {
            type: String,
            required: true,
        },
        message: {
            type: String,
            required: true,
            trim: true,
        },
        isInternalNote: {
            type: Boolean,
            default: false,
        },
        createdAt: {
            type: Date,
            default: Date.now,
        },
    },
    { _id: true }
);

const internalNoteSchema = new mongoose.Schema(
    {
        adminId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        adminName: {
            type: String,
            required: true,
        },
        note: {
            type: String,
            required: true,
            trim: true,
        },
        createdAt: {
            type: Date,
            default: Date.now,
        },
    },
    { _id: true }
);

const supportTicketSchema = new mongoose.Schema(
    {
        ticketNumber: {
            type: String,
            required: true,
            unique: true,
            trim: true,
        },
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
        },
        userRole: {
            type: String,
            enum: ["customer", "serviceprovider"],
            required: true,
        },
        userName: {
            type: String,
            required: true,
            trim: true,
        },
        userEmail: {
            type: String,
            required: true,
            trim: true,
            lowercase: true,
        },
        userPhone: {
            type: String,
            default: "",
            trim: true,
        },
        subject: {
            type: String,
            required: true,
            trim: true,
        },
        category: {
            type: String,
            enum: [
                "booking",
                "payment",
                "provider_issue",
                "customer_issue",
                "service_quality",
                "account",
                "technical",
                "dispute",
                "other",
            ],
            default: "other",
        },
        bookingId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Booking",
            default: null,
        },
        priority: {
            type: String,
            enum: ["low", "medium", "high", "urgent"],
            default: "medium",
        },
        status: {
            type: String,
            enum: ["open", "in_progress", "waiting_for_user", "resolved", "closed"],
            default: "open",
        },
        assignedAdminId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },
        messages: {
            type: [ticketMessageSchema],
            default: [],
        },
        internalNotes: {
            type: [internalNoteSchema],
            default: [],
        },
        resolvedAt: {
            type: Date,
            default: null,
        },
        closedAt: {
            type: Date,
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

supportTicketSchema.index({ status: 1, priority: 1, createdAt: -1 });
supportTicketSchema.index({ userId: 1, userRole: 1 });
supportTicketSchema.index({ bookingId: 1 });

const SupportTicket =
    mongoose.models.SupportTicket ||
    mongoose.model("SupportTicket", supportTicketSchema);

export default SupportTicket;
