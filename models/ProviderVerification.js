import mongoose from "mongoose";

const providerVerificationSchema = new mongoose.Schema(
    {
        providerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Provider",
            required: true,
            unique: true,
        },
        documentType: {
            type: String,
            enum: ["aadhar", "pan", "driving-license", "passport"],
            required: true,
        },
        documentPath: {
            type: String,
            required: true,
        },
        selfiePath: {
            type: String,
            required: true,
        },
        status: {
            type: String,
            enum: ["pending", "verified", "rejected"],
            default: "pending",
        },
        rejectionReason: {
            type: String,
            default: "",
        },
        verifiedAt: {
            type: Date,
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

const ProviderVerification =
    mongoose.models.ProviderVerification ||
    mongoose.model("ProviderVerification", providerVerificationSchema);

export default ProviderVerification;
