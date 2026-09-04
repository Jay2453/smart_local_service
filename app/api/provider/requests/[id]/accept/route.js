import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySession } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import Booking from "@/models/Booking";
import BookingRequest from "@/models/BookingRequest";
import Provider from "@/models/Provider";
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
                { success: false, message: "Only service providers can accept requests" },
                { status: 403 }
            );
        }

        await connectDB();

        // Check if provider already has an ongoing job (Plan.txt Rule #5: no two requests in same time duration until finished)
        const activeJob = await Booking.findOne({
            assignedProviderId: session.id,
            status: { $in: ["accepted", "in_progress"] },
        });

        if (activeJob) {
            return NextResponse.json(
                {
                    success: false,
                    message: "You already have an active job in progress. Please complete it before accepting another.",
                },
                { status: 409 }
            );
        }

        const bookingReq = await BookingRequest.findById(id);
        if (!bookingReq) {
            return NextResponse.json(
                { success: false, message: "Request not found" },
                { status: 404 }
            );
        }

        if (bookingReq.providerId.toString() !== session.id) {
            return NextResponse.json(
                { success: false, message: "This request was not assigned to you" },
                { status: 403 }
            );
        }

        // Check booking availability atomically
        const booking = await Booking.findOneAndUpdate(
            { _id: bookingReq.bookingId, status: "pending" },
            {
                status: "accepted",
                assignedProviderId: session.id,
            },
            { new: true }
        );

        if (!booking) {
            bookingReq.status = "expired";
            await bookingReq.save();
            return NextResponse.json(
                { success: false, message: "This service request was already accepted by another provider or cancelled." },
                { status: 409 }
            );
        }

        // Update current request
        bookingReq.status = "accepted";
        bookingReq.respondedAt = new Date();
        await bookingReq.save();

        // Expire all competing requests for this booking
        await BookingRequest.updateMany(
            { bookingId: booking._id, _id: { $ne: bookingReq._id } },
            { status: "expired" }
        );

        const provider = await Provider.findById(session.id).select("name phone");

        // Notify customer
        await Notification.create({
            recipientId: booking.customerId,
            recipientRole: "customer",
            title: "Service Request Accepted!",
            message: `${provider?.name || "A service provider"} has accepted your request and is assigned to your booking.`,
            type: "booking",
            link: "/Dashboard",
        });

        return NextResponse.json({
            success: true,
            message: "Request accepted successfully! Added to your schedule.",
            booking,
        });

    } catch (error) {
        console.error("Accept request error:", error);
        return NextResponse.json(
            { success: false, message: "Failed to accept request" },
            { status: 500 }
        );
    }
}
