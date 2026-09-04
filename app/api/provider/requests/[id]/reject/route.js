import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySession } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import BookingRequest from "@/models/BookingRequest";

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
                { success: false, message: "Only service providers can reject requests" },
                { status: 403 }
            );
        }

        await connectDB();

        const bookingReq = await BookingRequest.findById(id);
        if (!bookingReq) {
            return NextResponse.json(
                { success: false, message: "Request not found" },
                { status: 404 }
            );
        }

        if (bookingReq.providerId.toString() !== session.id) {
            return NextResponse.json(
                { success: false, message: "Unauthorized" },
                { status: 403 }
            );
        }

        bookingReq.status = "rejected";
        bookingReq.respondedAt = new Date();
        await bookingReq.save();

        return NextResponse.json({
            success: true,
            message: "Request declined.",
        });

    } catch (error) {
        console.error("Reject request error:", error);
        return NextResponse.json(
            { success: false, message: "Failed to decline request" },
            { status: 500 }
        );
    }
}
