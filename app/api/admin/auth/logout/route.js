import { NextResponse } from "next/server";
import { ADMIN_COOKIE_NAME, USER_COOKIE_NAME } from "@/lib/auth";
import { getAdminSession, logAdminAction } from "@/lib/adminAuth";

export async function POST(request) {
    try {
        const authResult = await getAdminSession(request);

        if (authResult?.admin) {
            await logAdminAction({
                admin: authResult.admin,
                action: "admin_logout",
                targetType: "auth",
                targetId: authResult.admin.id,
                description: `Admin logged out: ${authResult.admin.name} (${authResult.admin.email})`,
                req: request,
            });
        }

        const response = NextResponse.json(
            {
                success: true,
                message: "Admin logged out successfully.",
            },
            { status: 200 }
        );

        // Clear admin cookies
        response.cookies.set({
            name: ADMIN_COOKIE_NAME,
            value: "",
            httpOnly: true,
            expires: new Date(0),
            path: "/",
        });

        response.cookies.set({
            name: USER_COOKIE_NAME,
            value: "",
            httpOnly: true,
            expires: new Date(0),
            path: "/",
        });

        return response;
    } catch (error) {
        console.error("Admin logout error:", error);
        return NextResponse.json(
            {
                success: false,
                message: "Error during logout.",
            },
            { status: 500 }
        );
    }
}
