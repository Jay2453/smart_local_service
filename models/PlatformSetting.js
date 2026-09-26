import mongoose from "mongoose";

const platformSettingSchema = new mongoose.Schema(
    {
        key: {
            type: String,
            required: true,
            unique: true,
            trim: true,
        },
        value: {
            type: mongoose.Schema.Types.Mixed,
            required: true,
        },
        category: {
            type: String,
            enum: ["general", "booking", "provider", "finance", "security", "notifications"],
            default: "general",
        },
        label: {
            type: String,
            default: "",
        },
        description: {
            type: String,
            default: "",
        },
        isPublic: {
            type: Boolean,
            default: false,
        },
        updatedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

platformSettingSchema.index({ category: 1 });

const PlatformSetting =
    mongoose.models.PlatformSetting ||
    mongoose.model("PlatformSetting", platformSettingSchema);

export default PlatformSetting;
