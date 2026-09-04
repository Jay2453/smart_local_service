import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySession } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import BookingRequest from "@/models/BookingRequest";
import Booking from "@/models/Booking";

export async function GET() {
    void Booking; // Ensure Mongoose model registration for populate
    try {
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
                { success: false, message: "Only service providers can view requests" },
                { status: 403 }
            );
        }

        await connectDB();

        // Fetch requests sent to this provider that are still pending/sent
        const requests = await BookingRequest.find({
            providerId: session.id,
            status: "sent",
        })
            .populate({
                path: "bookingId",
                populate: {
                    path: "customerId",
                    select: "name phone email",
                },
            })
            .sort({ sentAt: -1 });

        // Filter out any where the underlying booking is no longer pending
        const validRequests = requests.filter(
            (r) => r.bookingId && r.bookingId.status === "pending"
        );

        return NextResponse.json({
            success: true,
            requests: validRequests,
        });

    } catch (error) {
        console.error("Fetch provider requests error:", error);
        return NextResponse.json(
            { success: false, message: "Failed to fetch service requests" },
            { status: 500 }
        );
    }
}
