import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySession } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import Booking from "@/models/Booking";
import Provider from "@/models/Provider";
import BookingRequest from "@/models/BookingRequest";
import Notification from "@/models/Notification";
import { calculateDistanceKm, parseRadiusKm } from "@/lib/geo";

export async function POST(request) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get("smartserve_session")?.value;

        if (!token) {
            return NextResponse.json(
                { success: false, message: "Please log in to book a service." },
                { status: 401 }
            );
        }

        const session = await verifySession(token);
        if (!session || session.role !== "customer") {
            return NextResponse.json(
                { success: false, message: "Only registered customers can book services." },
                { status: 403 }
            );
        }

        const body = await request.json();
        const {
            address,
            latitude,
            longitude,
            preferredDate,
            preferredTime,
            selectedServices,
            problemChoice,
            description,
            photos,
        } = body;

        if (!address || !address.trim()) {
            return NextResponse.json(
                { success: false, message: "Service address is required." },
                { status: 400 }
            );
        }

        if (!preferredDate || !preferredTime) {
            return NextResponse.json(
                { success: false, message: "Preferred date and time are required." },
                { status: 400 }
            );
        }

        if (!selectedServices || !Array.isArray(selectedServices) || selectedServices.length === 0) {
            return NextResponse.json(
                { success: false, message: "Please select at least one service." },
                { status: 400 }
            );
        }

        if (!description || !description.trim()) {
            return NextResponse.json(
                { success: false, message: "Please describe your issue." },
                { status: 400 }
            );
        }

        await connectDB();

        // Formulate services array
        const formattedServices = selectedServices.map((svc) => ({
            serviceId: svc.id,
            name: svc.name,
            problem: (problemChoice && problemChoice[svc.id]) || "General Maintenance",
            price: Number(svc.price) || 499,
        }));

        const estimatedTotal = formattedServices.reduce((acc, s) => acc + s.price, 0);

        const newBooking = await Booking.create({
            customerId: session.id,
            services: formattedServices,
            description: description.trim(),
            photos: Array.isArray(photos) ? photos : [],
            address: address.trim(),
            location: {
                latitude: latitude ? Number(latitude) : null,
                longitude: longitude ? Number(longitude) : null,
            },
            preferredDate,
            preferredTime,
            estimatedTotal,
            status: "pending",
        });

        // DISPATCH ENGINE: Match eligible providers
        // Find providers matching any of the requested service professions
        const requestedProfessions = formattedServices.map((s) => s.serviceId.toLowerCase());
        
        // Find matching providers
        const matchingProviders = await Provider.find({
            Proffesion: {
                $in: requestedProfessions.map((p) => new RegExp(`^${p}$`, "i")),
            },
        });

        const createdRequests = [];

        for (const provider of matchingProviders) {
            // Distance check
            const dist = calculateDistanceKm(
                latitude,
                longitude,
                provider.latitude,
                provider.longitude
            );
            const maxRadius = parseRadiusKm(provider.ServiceRadius);

            // In development or if radius permits, send the request
            if (dist <= maxRadius || process.env.NODE_ENV !== "production") {
                const req = await BookingRequest.create({
                    bookingId: newBooking._id,
                    providerId: provider._id,
                    status: "sent",
                    distanceKm: dist,
                    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24h validity
                });
                createdRequests.push(req);

                // Create provider notification
                await Notification.create({
                    recipientId: provider._id,
                    recipientRole: "serviceprovider",
                    title: "New Service Request",
                    message: `New request for ${formattedServices[0].name} near ${address.slice(0, 30)}...`,
                    type: "booking",
                    link: "/Serviceprovider",
                });
            }
        }

        // Create customer notification
        await Notification.create({
            recipientId: session.id,
            recipientRole: "customer",
            title: "Booking Requested",
            message: `Your booking for ${formattedServices.map((s) => s.name).join(", ")} has been submitted.`,
            type: "booking",
            link: "/Dashboard",
        });

        return NextResponse.json(
            {
                success: true,
                message: createdRequests.length > 0
                    ? `Booking created! Dispatched to ${createdRequests.length} nearby provider(s).`
                    : "Booking created! We are searching for available providers.",
                booking: newBooking,
                dispatchCount: createdRequests.length,
            },
            { status: 201 }
        );

    } catch (error) {
        console.error("Create booking error:", error);
        return NextResponse.json(
            { success: false, message: "Unable to process booking request. Please try again." },
            { status: 500 }
        );
    }
}

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
        if (!session) {
            return NextResponse.json(
                { success: false, message: "Session invalid or expired" },
                { status: 401 }
            );
        }

        await connectDB();

        let bookings = [];

        if (session.role === "customer") {
            bookings = await Booking.find({ customerId: session.id })
                .populate({
                    path: "assignedProviderId",
                    select: "name phone rating reviewCount Proffesion address",
                })
                .sort({ createdAt: -1 });
        } else if (session.role === "serviceprovider") {
            bookings = await Booking.find({ assignedProviderId: session.id })
                .populate({
                    path: "customerId",
                    select: "name phone email",
                })
                .sort({ createdAt: -1 });
        }

        return NextResponse.json({
            success: true,
            bookings,
        });

    } catch (error) {
        console.error("Fetch bookings error:", error);
        return NextResponse.json(
            { success: false, message: "Unable to retrieve bookings." },
            { status: 500 }
        );
    }
}
