import { NextResponse } from "next/server";

export async function GET(request) {

    try {

        const { searchParams } = new URL(request.url);

        const lat = searchParams.get("lat");
        const lon = searchParams.get("lon");

        if (!lat || !lon) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Latitude and longitude are required.",
                },
                { status: 400 }
            );
        }

        const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`,
            {
                headers: {
                    "User-Agent": "SmartServe/1.0",
                },
            }
        );

        if (!response.ok) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Unable to contact location service.",
                },
                { status: 500 }
            );
        }

        const data = await response.json();

        if (!data.display_name) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Address not found.",
                },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            address: data.display_name,
        });

    } catch (error) {

        console.error("Reverse geocoding error:", error);

        return NextResponse.json(
            {
                success: false,
                message: "Unable to find your address.",
            },
            { status: 500 }
        );
    }
}