import { NextResponse } from "next/server";
import { requireAdmin, logAdminAction } from "@/lib/adminAuth";
import connectDB from "@/lib/mongodb";
import Provider from "@/models/Provider";
import ProviderVerification from "@/models/ProviderVerification";
import Booking from "@/models/Booking";
import Review from "@/models/Review";

export async function GET(request, { params }) {
    try {
        const { error } = await requireAdmin(request);
        if (error) return error;

        const { id } = await params;
        await connectDB();

        const provider = await Provider.findById(id).select("-password").lean();
        if (!provider) {
            return NextResponse.json(
                { success: false, message: "Service provider not found." },
                { status: 404 }
            );
        }

        const [verification, bookings, reviews] = await Promise.all([
            ProviderVerification.findOne({ providerId: id }).lean(),
            Booking.find({ assignedProviderId: id })
                .populate("customerId", "name phone email")
                .sort({ createdAt: -1 })
                .lean(),
            Review.find({ providerId: id })
                .populate("customerId", "name")
                .sort({ createdAt: -1 })
                .lean(),
        ]);

        return NextResponse.json({
            success: true,
            provider,
            verification: verification || null,
            bookings,
            reviews,
        });
    } catch (error) {
        console.error("Admin get provider error:", error);
        return NextResponse.json(
            { success: false, message: "Failed to fetch provider details" },
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
        const { action, reason = "" } = body;

        if (!["suspend", "reactivate"].includes(action)) {
            return NextResponse.json(
                { success: false, message: "Invalid action. Use 'suspend' or 'reactivate'." },
                { status: 400 }
            );
        }

        await connectDB();

        const provider = await Provider.findById(id);
        if (!provider) {
            return NextResponse.json(
                { success: false, message: "Service provider not found." },
                { status: 404 }
            );
        }

        const isSuspend = action === "suspend";
        provider.isSuspended = isSuspend;
        provider.isActive = !isSuspend;
        provider.status = isSuspend ? "suspended" : "active";
        provider.suspensionReason = isSuspend ? reason : "";
        provider.suspendedAt = isSuspend ? new Date() : null;

        await provider.save();

        await logAdminAction({
            admin,
            action: isSuspend ? "provider_suspended" : "provider_reactivated",
            targetType: "provider",
            targetId: provider._id.toString(),
            description: `${isSuspend ? "Suspended" : "Reactivated"} provider: ${provider.name} (${provider.email}). Reason: ${reason || "Admin update"}`,
            req: request,
            metadata: { providerId: provider._id, reason, action },
        });

        return NextResponse.json({
            success: true,
            message: `Provider successfully ${isSuspend ? "suspended" : "reactivated"}.`,
            provider: {
                id: provider._id,
                name: provider.name,
                isSuspended: provider.isSuspended,
                status: provider.status,
                suspensionReason: provider.suspensionReason,
            },
        });
    } catch (error) {
        console.error("Admin update provider suspension error:", error);
        return NextResponse.json(
            { success: false, message: "Failed to update provider status" },
            { status: 500 }
        );
    }
}
