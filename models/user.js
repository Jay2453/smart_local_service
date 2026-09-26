import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
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

        role: {
            type: String,
            enum: ["customer", "serviceprovider", "admin"],
            required: true,
        },

        isActive: {
            type: Boolean,
            default: true,
        },

        status: {
            type: String,
            enum: ["active", "suspended", "deactivated"],
            default: "active",
        },

        deactivatedReason: {
            type: String,
            default: "",
        },

        deactivatedAt: {
            type: Date,
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

userSchema.index({ email: 1, role: 1 });
userSchema.index({ phone: 1 });
userSchema.index({ role: 1, isActive: 1 });

const User =
    mongoose.models.User ||
    mongoose.model("User", userSchema);

export default User;