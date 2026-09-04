import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySession } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import Booking from "@/models/Booking";
import Payment from "@/models/Payment";
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
        if (!session) {
            return NextResponse.json(
                { success: false, message: "Invalid session" },
                { status: 401 }
            );
        }

        const body = await request.json().catch(() => ({}));
        const { method = "cash" } = body;

        await connectDB();

        const booking = await Booking.findById(id);
        if (!booking) {
            return NextResponse.json(
                { success: false, message: "Booking not found" },
                { status: 404 }
            );
        }

        if (booking.customerId.toString() !== session.id && booking.assignedProviderId?.toString() !== session.id) {
            return NextResponse.json(
                { success: false, message: "Unauthorized payment action" },
                { status: 403 }
            );
        }

        const payment = await Payment.findOneAndUpdate(
            { bookingId: booking._id },
            {
                bookingId: booking._id,
                customerId: booking.customerId,
                providerId: booking.assignedProviderId,
                amount: booking.estimatedTotal,
                method: ["cash", "online"].includes(method) ? method : "cash",
                status: "completed",
                paidAt: new Date(),
            },
            { upsert: true, new: true }
        );

        // Notify both parties
        await Notification.create({
            recipientId: booking.customerId,
            recipientRole: "customer",
            title: "Payment Received",
            message: `Payment of ₹${booking.estimatedTotal} confirmed for booking #${booking._id.toString().slice(-6)}.`,
            type: "system",
            link: "/Dashboard",
        });

        if (booking.assignedProviderId) {
            await Notification.create({
                recipientId: booking.assignedProviderId,
                recipientRole: "serviceprovider",
                title: "Payment Collected",
                message: `Payment of ₹${booking.estimatedTotal} recorded for booking #${booking._id.toString().slice(-6)}.`,
                type: "system",
                link: "/Serviceprovider",
            });
        }

        return NextResponse.json({
            success: true,
            message: "Payment successfully recorded.",
            payment,
        });

    } catch (error) {
        console.error("Payment error:", error);
        return NextResponse.json(
            { success: false, message: "Failed to process payment." },
            { status: 500 }
        );
    }
}
