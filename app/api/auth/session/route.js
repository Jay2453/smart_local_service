import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySession } from "@/lib/auth";
export async function GET() {
    try {
        const cookieStore = await cookies();

        const token = cookieStore.get(
            "smartserve_session"
        )?.value;

        if (!token) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Not logged in",
                },
                { status: 401 }
            );
        }

        const session = await verifySession(token);

        if (!session) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Session expired",
                },
                { status: 401 }
            );
        }

        return NextResponse.json({
            success: true,
            user: {
                id: session.id,
                name: session.name,
                phone: session.phone,
                role: session.role,
            },
        });

    } catch (error) {
        console.error("Session error:", error);

        return NextResponse.json(
            {
                success: false,
                message: "Unable to verify session",
            },
            { status: 500 }
        );
    }
}