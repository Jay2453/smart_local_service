import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/adminAuth";

export async function GET(request) {
    try {
        const authResult = await getAdminSession(request);

        if (!authResult || !authResult.admin) {
            return NextResponse.json(
                {
                    success: false,
                    message: "No active admin session.",
                },
                { status: 401 }
            );
        }

        return NextResponse.json({
            success: true,
            admin: authResult.admin,
        });
    } catch (error) {
        console.error("Admin session check error:", error);
        return NextResponse.json(
            {
                success: false,
                message: "Unable to verify admin session.",
            },
            { status: 500 }
        );
    }
}
