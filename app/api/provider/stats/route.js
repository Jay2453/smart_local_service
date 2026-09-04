import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySession } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import Booking from "@/models/Booking";
import BookingRequest from "@/models/BookingRequest";
import Review from "@/models/Review";
import Provider from "@/models/Provider";

export async function GET() {
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
                { success: false, message: "Unauthorized" },
                { status: 403 }
            );
        }

        await connectDB();

        const provider = await Provider.findById(session.id);
        if (!provider) {
            return NextResponse.json(
                { success: false, message: "Provider not found" },
                { status: 404 }
            );
        }

        // Count new pending requests sent to this provider
        const requestsCount = await BookingRequest.countDocuments({
            providerId: session.id,
            status: "sent",
        });

        // Active jobs (accepted or in_progress)
        const activeJobs = await Booking.find({
            assignedProviderId: session.id,
            status: { $in: ["accepted", "in_progress"] },
        })
            .populate("customerId", "name phone")
            .sort({ preferredDate: 1, preferredTime: 1 });

        const acceptedCount = activeJobs.length;

        // Today's jobs
        const todayStr = new Date().toISOString().split("T")[0];
        const todayJobs = await Booking.find({
            assignedProviderId: session.id,
            preferredDate: todayStr,
            status: { $in: ["accepted", "in_progress", "completed"] },
        }).countDocuments();

        // Monthly earnings calculation
        const now = new Date();
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const completedThisMonth = await Booking.find({
            assignedProviderId: session.id,
            status: "completed",
            completedAt: { $gte: firstDayOfMonth },
        });

        const monthlyEarnings = completedThisMonth.reduce(
            (acc, b) => acc + (b.estimatedTotal || 0),
            0
        );

        // Recent reviews for this provider
        const reviews = await Review.find({ providerId: session.id })
            .populate("customerId", "name")
            .sort({ createdAt: -1 })
            .limit(10);

        return NextResponse.json({
            success: true,
            provider: {
                name: provider.name,
                phone: provider.phone,
                email: provider.email,
                isOnline: provider.isOnline,
                verificationStatus: provider.verificationStatus,
                rating: provider.rating,
                reviewCount: provider.reviewCount,
            },
            stats: {
                requestsCount,
                acceptedCount,
                todayCount: todayJobs,
                monthlyEarnings,
            },
            schedule: activeJobs,
            reviews,
        });

    } catch (error) {
        console.error("Fetch provider stats error:", error);
        return NextResponse.json(
            { success: false, message: "Failed to load provider statistics" },
            { status: 500 }
        );
    }
}
