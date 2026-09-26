import { NextResponse } from "next/server";
import { requireAdmin, logAdminAction } from "@/lib/adminAuth";
import connectDB from "@/lib/mongodb";
import Service from "@/models/Service";
import Booking from "@/models/Booking";

export async function GET(request, { params }) {
    try {
        const { error } = await requireAdmin(request);
        if (error) return error;

        const { id } = await params;
        await connectDB();

        const service = await Service.findById(id).lean();
        if (!service) {
            return NextResponse.json(
                { success: false, message: "Service not found." },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            service,
        });
    } catch (error) {
        console.error("Admin get service error:", error);
        return NextResponse.json(
            { success: false, message: "Failed to fetch service" },
            { status: 500 }
        );
    }
}

export async function PATCH(request, { params }) {
    try {
        const { error, admin } = await requireAdmin(request);
        if (error) return error;

        const { id } = await params;
        const body = await request.json().catch(() => ({}));

        await connectDB();

        const service = await Service.findById(id);
        if (!service) {
            return NextResponse.json(
                { success: false, message: "Service not found." },
                { status: 404 }
            );
        }

        const allowedFields = ["name", "category", "description", "icon", "image", "alt", "basePrice", "tasks", "isActive", "displayOrder"];
        allowedFields.forEach((field) => {
            if (body[field] !== undefined) {
                service[field] = body[field];
            }
        });

        await service.save();

        await logAdminAction({
            admin,
            action: "service_updated",
            targetType: "service",
            targetId: service._id.toString(),
            description: `Admin updated service: ${service.name} (${service.serviceId})`,
            req: request,
            metadata: { serviceId: service.serviceId, updates: body },
        });

        return NextResponse.json({
            success: true,
            message: "Service updated successfully.",
            service,
        });
    } catch (error) {
        console.error("Admin update service error:", error);
        return NextResponse.json(
            { success: false, message: "Failed to update service" },
            { status: 500 }
        );
    }
}

export async function DELETE(request, { params }) {
    try {
        const { error, admin } = await requireAdmin(request);
        if (error) return error;

        const { id } = await params;
        await connectDB();

        const service = await Service.findById(id);
        if (!service) {
            return NextResponse.json(
                { success: false, message: "Service not found." },
                { status: 404 }
            );
        }

        // Check if any bookings reference this service
        const bookingCount = await Booking.countDocuments({ "services.serviceId": service.serviceId });

        if (bookingCount > 0) {
            // Soft-deactivate instead of destructive deletion
            service.isActive = false;
            await service.save();

            await logAdminAction({
                admin,
                action: "service_status_changed",
                targetType: "service",
                targetId: service._id.toString(),
                description: `Admin soft-deactivated service '${service.name}' due to ${bookingCount} existing booking references.`,
                req: request,
                metadata: { serviceId: service.serviceId, bookingCount },
            });

            return NextResponse.json({
                success: true,
                message: `Service has existing bookings (${bookingCount}). It was deactivated rather than deleted to protect historical records.`,
                service,
            });
        }

        // Safe hard delete if no historical bookings exist
        await Service.findByIdAndDelete(id);

        await logAdminAction({
            admin,
            action: "service_deleted",
            targetType: "service",
            targetId: id,
            description: `Admin permanently deleted unused service: ${service.name} (${service.serviceId})`,
            req: request,
            metadata: { serviceId: service.serviceId },
        });

        return NextResponse.json({
            success: true,
            message: "Service removed successfully.",
        });
    } catch (error) {
        console.error("Admin delete service error:", error);
        return NextResponse.json(
            { success: false, message: "Failed to delete service" },
            { status: 500 }
        );
    }
}
