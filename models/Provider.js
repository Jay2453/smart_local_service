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
    },
    {
        timestamps: true,
    }
);

const Provider =
    mongoose.models.Provider ||
    mongoose.model("Provider", ProviderSchema);

export default Provider;