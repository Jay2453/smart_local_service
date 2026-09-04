import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySession } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import Booking from "@/models/Booking";

export async function GET(request, { params }) {
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

        await connectDB();

        const booking = await Booking.findById(id)
            .populate({
                path: "assignedProviderId",
                select: "name phone rating reviewCount Proffesion address",
            })
            .populate({
                path: "customerId",
                select: "name phone email",
            });

        if (!booking) {
            return NextResponse.json(
                { success: false, message: "Booking not found" },
                { status: 404 }
            );
        }

        // Authorization check: User must be customer or assigned provider
        const isCustomer = booking.customerId?._id?.toString() === session.id;
        const isProvider = booking.assignedProviderId?._id?.toString() === session.id;

        if (!isCustomer && !isProvider) {
            return NextResponse.json(
                { success: false, message: "Access denied" },
                { status: 403 }
            );
        }

        return NextResponse.json({
            success: true,
            booking,
        });

    } catch (error) {
        console.error("Get booking by ID error:", error);
        return NextResponse.json(
            { success: false, message: "Error retrieving booking" },
            { status: 500 }
        );
    }
}
