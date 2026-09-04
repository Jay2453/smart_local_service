import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySession } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import Provider from "@/models/Provider";
import ProviderVerification from "@/models/ProviderVerification";

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
                { success: false, message: "Only service providers have verification status" },
                { status: 403 }
            );
        }

        await connectDB();

        const provider = await Provider.findById(session.id).select("verificationStatus isOnline Proffesion");
        if (!provider) {
            return NextResponse.json(
                { success: false, message: "Provider not found" },
                { status: 404 }
            );
        }

        const verification = await ProviderVerification.findOne({ providerId: session.id });

        return NextResponse.json({
            success: true,
            verificationStatus: provider.verificationStatus || "pending",
            isOnline: provider.isOnline,
            profession: provider.Proffesion,
            verification: verification || null,
        });

    } catch (error) {
        console.error("Fetch verification status error:", error);
        return NextResponse.json(
            { success: false, message: "Unable to retrieve verification status" },
            { status: 500 }
        );
    }
}
