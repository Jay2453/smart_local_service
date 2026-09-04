import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySession } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import Provider from "@/models/Provider";

export async function POST(request) {
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

        const body = await request.json().catch(() => ({}));
        const provider = await Provider.findById(session.id);

        if (!provider) {
            return NextResponse.json(
                { success: false, message: "Provider not found" },
                { status: 404 }
            );
        }

        const newOnline = typeof body.online === "boolean" ? body.online : !provider.isOnline;
        provider.isOnline = newOnline;
        await provider.save();

        return NextResponse.json({
            success: true,
            isOnline: provider.isOnline,
            message: `You are now ${provider.isOnline ? "Online" : "Offline"}`,
        });

    } catch (error) {
        console.error("Toggle online status error:", error);
        return NextResponse.json(
            { success: false, message: "Failed to update online status" },
            { status: 500 }
        );
    }
}
