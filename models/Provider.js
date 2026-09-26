import mongoose from "mongoose";

const ProviderSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        phone: {
            type: String,
            required: true,
            trim: true,
        },
        email: {
            type: String,
            required: true,
            trim: true,
            unique: true,
            lowercase: true,
        },
        password: {
            type: String,
            required: true,
        },        
        address: {
            type: String,
            required: true,
        },
        Proffesion: {
            type: String,
            required: true,
        },
        Experience: {
            type: String,
            required: true,
        },
        ServiceRadius: {
            type: String,
            required: true,
        },
        role: {
            type: String,
            enum: ["customer", "serviceprovider"],
            required: true,
        },
        latitude: {
            type: Number,
            default: null,
        },
        longitude: {
            type: Number,
            default: null,
        },
        isOnline: {
            type: Boolean,
            default: true,
        },
        verificationStatus: {
            type: String,
            enum: ["pending", "verified", "rejected"],
            default: "pending",
        },
        rating: {
            type: Number,
            default: 5.0,
        },
        reviewCount: {
            type: Number,
            default: 0,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        isSuspended: {
            type: Boolean,
            default: false,
        },
        status: {
            type: String,
            enum: ["active", "suspended", "inactive"],
            default: "active",
        },
        suspensionReason: {
            type: String,
            default: "",
        },
        suspendedAt: {
            type: Date,
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

ProviderSchema.index({ phone: 1 });
ProviderSchema.index({ Proffesion: 1, verificationStatus: 1, isOnline: 1, isSuspended: 1 });
ProviderSchema.index({ verificationStatus: 1 });

const Provider =
    mongoose.models.Provider ||
    mongoose.model("Provider", ProviderSchema);

export default Provider;