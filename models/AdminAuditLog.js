import mongoose from "mongoose";

const adminAuditLogSchema = new mongoose.Schema(
    {
        adminId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },
        adminEmail: {
            type: String,
            default: "system",
            trim: true,
            lowercase: true,
        },
        adminName: {
            type: String,
            default: "System",
            trim: true,
        },
        action: {
            type: String,
            required: true,
            trim: true,
        },
        targetType: {
            type: String,
            enum: [
                "user",
                "customer",
                "provider",
                "booking",
                "service",
                "review",
                "verification",
                "notification",
                "support",
                "setting",
                "payment",
                "auth",
                "system",
            ],
            required: true,
        },
        targetId: {
            type: String,
            default: null,
        },
        description: {
            type: String,
            required: true,
        },
        ipAddress: {
            type: String,
            default: "",
        },
        userAgent: {
            type: String,
            default: "",
        },
        metadata: {
            type: mongoose.Schema.Types.Mixed,
            default: {},
        },
    },
    {
        timestamps: true,
    }
);

adminAuditLogSchema.index({ createdAt: -1 });
adminAuditLogSchema.index({ action: 1, createdAt: -1 });
adminAuditLogSchema.index({ adminId: 1, createdAt: -1 });
adminAuditLogSchema.index({ targetType: 1, targetId: 1 });

const AdminAuditLog =
    mongoose.models.AdminAuditLog ||
    mongoose.model("AdminAuditLog", adminAuditLogSchema);

export default AdminAuditLog;
