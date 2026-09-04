import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySession } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import Booking from "@/models/Booking";
import Notification from "@/models/Notification";

export async function POST(request, { params }) {
    try {
        const { id } = await params;

        const cookieStore = await cookies();
        const token = cookieStore.get("smartserve_session")?.value;

        if (!token) {
            return NextResponse.json(
                { success: false, message: "Authentication required" },
                { status: 401 }
            );
        }

        const session = await verifySession(token);
        if (!session || session.role !== "serviceprovider") {
            return NextResponse.json(
                { success: false, message: "Only service providers can update job status" },
                { status: 403 }
            );
        }

        const body = await request.json();
        const { newStatus } = body;

        if (!["in_progress", "completed"].includes(newStatus)) {
            return NextResponse.json(
                { success: false, message: "Invalid status transition" },
                { status: 400 }
            );
        }

        await connectDB();

        const booking = await Booking.findById(id);
        if (!booking) {
            return NextResponse.json(
                { success: false, message: "Booking not found" },
                { status: 404 }
            );
        }

        if (booking.assignedProviderId?.toString() !== session.id) {
            return NextResponse.json(
                { success: false, message: "You are not the assigned provider for this booking" },
                { status: 403 }
            );
        }

        if (newStatus === "in_progress" && booking.status !== "accepted") {
            return NextResponse.json(
                { success: false, message: "Job must be in accepted status to start" },
                { status: 400 }
            );
        }

        if (newStatus === "completed" && booking.status !== "in_progress" && booking.status !== "accepted") {
            return NextResponse.json(
                { success: false, message: "Job cannot be marked completed directly" },
                { status: 400 }
            );
        }

        booking.status = newStatus;
        if (newStatus === "completed") {
            booking.completedAt = new Date();
        }
        await booking.save();

        // Notify customer
        if (newStatus === "in_progress") {
            await Notification.create({
                recipientId: booking.customerId,
                recipientRole: "customer",
                title: "Service In Progress",
                message: "Your service provider has started work on your request.",
                type: "booking",
                link: "/Dashboard",
            });
        } else if (newStatus === "completed") {
            await Notification.create({
                recipientId: booking.customerId,
                recipientRole: "customer",
                title: "Service Completed!",
                message: "Your service has been marked complete. Please confirm payment and leave a review!",
                type: "booking",
                link: "/Dashboard",
            });
        }

        return NextResponse.json({
            success: true,
            message: `Job marked as ${newStatus === "in_progress" ? "In Progress" : "Completed"}.`,
            booking,
        });

    } catch (error) {
        console.error("Update job status error:", error);
        return NextResponse.json(
            { success: false, message: "Failed to update job status" },
            { status: 500 }
        );
    }
}
