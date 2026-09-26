import { NextResponse } from "next/server";
import { requireAdmin, logAdminAction } from "@/lib/adminAuth";
import connectDB from "@/lib/mongodb";
import Service from "@/models/Service";

export async function GET(request) {
    try {
        const { error } = await requireAdmin(request);
        if (error) return error;

        await connectDB();

        const services = await Service.find({}).sort({ displayOrder: 1, name: 1 }).lean();

        return NextResponse.json({
            success: true,
            services,
        });
    } catch (error) {
        console.error("Admin list services error:", error);
        return NextResponse.json(
            { success: false, message: "Failed to retrieve services" },
            { status: 500 }
        );
    }
}

export async function POST(request) {
    try {
        const { error, admin } = await requireAdmin(request);
        if (error) return error;

        const body = await request.json().catch(() => ({}));
        const {
            serviceId,
            name,
            category = "Home Services",
            description,
            icon = "Wrench",
            image = "/images/plumber.png",
            alt = "",
            basePrice = 499,
            tasks = [],
            isActive = true,
            displayOrder = 0,
        } = body;

        if (!serviceId || !name || !description) {
            return NextResponse.json(
                { success: false, message: "serviceId, name, and description are required." },
                { status: 400 }
            );
        }

        const normalizedServiceId = serviceId.toLowerCase().trim().replace(/\s+/g, "-");

        await connectDB();

        const existing = await Service.findOne({ serviceId: normalizedServiceId });
        if (existing) {
            return NextResponse.json(
                { success: false, message: `A service with ID '${normalizedServiceId}' already exists.` },
                { status: 409 }
            );
        }

        const newService = await Service.create({
            serviceId: normalizedServiceId,
            name: name.trim(),
            category: category.trim(),
            description: description.trim(),
            icon,
            image,
            alt: alt || `${name} services`,
            basePrice: Number(basePrice) || 499,
            tasks: Array.isArray(tasks) ? tasks : [],
            isActive: Boolean(isActive),
            displayOrder: Number(displayOrder) || 0,
        });

        await logAdminAction({
            admin,
            action: "service_created",
            targetType: "service",
            targetId: newService._id.toString(),
            description: `Admin created service: ${newService.name} (${newService.serviceId})`,
            req: request,
            metadata: { serviceId: newService.serviceId, name: newService.name, basePrice: newService.basePrice },
        });

        return NextResponse.json(
            {
                success: true,
                message: "Service created successfully.",
                service: newService,
            },
            { status: 201 }
        );
    } catch (error) {
        console.error("Admin create service error:", error);
        return NextResponse.json(
            { success: false, message: "Failed to create service" },
            { status: 500 }
        );
    }
}
