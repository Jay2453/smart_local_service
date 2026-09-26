import { NextResponse } from "next/server";
import { requireAdmin, logAdminAction } from "@/lib/adminAuth";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import Booking from "@/models/Booking";
import SupportTicket from "@/models/SupportTicket";
import Review from "@/models/Review";

export async function GET(request, { params }) {
    try {
        const { error } = await requireAdmin(request);
        if (error) return error;

        const { id } = await params;
        await connectDB();

        const user = await User.findOne({ _id: id, role: "customer" }).select("-password").lean();

        if (!user) {
            return NextResponse.json(
                { success: false, message: "Customer not found." },
                { status: 404 }
            );
        }

        // Fetch customer's booking history
        const bookings = await Booking.find({ customerId: id })
            .populate("assignedProviderId", "name phone Proffesion rating")
            .sort({ createdAt: -1 })
            .lean();

        // Fetch reviews written by customer
        const reviews = await Review.find({ customerId: id })
            .populate("providerId", "name Proffesion")
            .sort({ createdAt: -1 })
            .lean();

        // Fetch support tickets opened by customer
        const supportTickets = await SupportTicket.find({ userId: id })
            .sort({ createdAt: -1 })
            .lean();

        return NextResponse.json({
            success: true,
            customer: user,
            bookings,
            reviews,
            supportTickets,
        });
    } catch (error) {
        console.error("Admin get customer error:", error);
        return NextResponse.json(
            { success: false, message: "Failed to fetch customer details" },
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

        if (!["deactivate", "reactivate"].includes(action)) {
            return NextResponse.json(
                { success: false, message: "Invalid action. Use 'deactivate' or 'reactivate'." },
                { status: 400 }
            );
        }

        await connectDB();

        const user = await User.findOne({ _id: id, role: "customer" });
        if (!user) {
            return NextResponse.json(
                { success: false, message: "Customer not found." },
                { status: 404 }
            );
        }

        const isDeactivate = action === "deactivate";
        user.isActive = !isDeactivate;
        user.status = isDeactivate ? "deactivated" : "active";
        user.deactivatedReason = isDeactivate ? reason : "";
        user.deactivatedAt = isDeactivate ? new Date() : null;

        await user.save();

        await logAdminAction({
            admin,
            action: isDeactivate ? "customer_deactivated" : "customer_reactivated",
            targetType: "customer",
            targetId: user._id.toString(),
            description: `${isDeactivate ? "Deactivated" : "Reactivated"} customer: ${user.name} (${user.email}). Reason: ${reason || "Admin update"}`,
            req: request,
            metadata: { customerId: user._id, reason, action },
        });

        return NextResponse.json({
            success: true,
            message: `Customer successfully ${isDeactivate ? "deactivated" : "reactivated"}.`,
            customer: {
                id: user._id,
                name: user.name,
                email: user.email,
                isActive: user.isActive,
                status: user.status,
                deactivatedReason: user.deactivatedReason,
            },
        });
    } catch (error) {
        console.error("Admin update customer status error:", error);
        return NextResponse.json(
            { success: false, message: "Failed to update customer status" },
            { status: 500 }
        );
    }
}
