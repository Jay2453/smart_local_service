import mongoose from "mongoose";

const serviceTaskSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        problem: {
            type: String,
            required: true,
            trim: true,
        },
        price: {
            type: Number,
            required: true,
            min: 0,
            default: 499,
        },
        description: {
            type: String,
            default: "",
            trim: true,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    { _id: true }
);

const serviceSchema = new mongoose.Schema(
    {
        serviceId: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            lowercase: true,
        },
        name: {
            type: String,
            required: true,
            trim: true,
        },
        category: {
            type: String,
            required: true,
            trim: true,
            default: "Home Services",
        },
        description: {
            type: String,
            required: true,
            trim: true,
        },
        icon: {
            type: String,
            default: "Wrench",
        },
        image: {
            type: String,
            default: "/images/plumber.png",
        },
        alt: {
            type: String,
            default: "",
        },
        basePrice: {
            type: Number,
            required: true,
            min: 0,
            default: 499,
        },
        tasks: {
            type: [serviceTaskSchema],
            default: [],
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        displayOrder: {
            type: Number,
            default: 0,
        },
    },
    {
        timestamps: true,
    }
);

serviceSchema.index({ category: 1, isActive: 1 });
serviceSchema.index({ displayOrder: 1 });

const Service =
    mongoose.models.Service ||
    mongoose.model("Service", serviceSchema);

export default Service;
