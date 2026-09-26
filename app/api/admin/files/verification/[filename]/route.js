import { NextResponse } from "next/server";
import path from "path";
import fs from "fs/promises";
import { getAdminSession } from "@/lib/adminAuth";
import { cookies } from "next/headers";
import { verifySession, USER_COOKIE_NAME } from "@/lib/auth";

export async function GET(request, { params }) {
    try {
        const { filename } = await params;

        // Verify that the request is made by an admin or authorized user
        const adminResult = await getAdminSession(request);
        let isAuthorized = !!adminResult?.admin;

        if (!isAuthorized) {
            const cookieStore = await cookies();
            const token = cookieStore.get(USER_COOKIE_NAME)?.value;
            const session = await verifySession(token);
            // Service provider can only view their own document files prefixed with their ID
            if (session && session.role === "serviceprovider" && filename.startsWith(session.id)) {
                isAuthorized = true;
            }
        }

        if (!isAuthorized) {
            return NextResponse.json(
                { success: false, message: "Unauthorized file access." },
                { status: 403 }
            );
        }

        // Sanitize filename to prevent path traversal attacks
        const sanitizedFilename = path.basename(filename);
        const filePath = path.join(process.cwd(), "public", "uploads", "verification", sanitizedFilename);

        try {
            const fileBuffer = await fs.readFile(filePath);
            const ext = path.extname(sanitizedFilename).toLowerCase();
            let contentType = "application/octet-stream";

            if (ext === ".jpg" || ext === ".jpeg") contentType = "image/jpeg";
            else if (ext === ".png") contentType = "image/png";
            else if (ext === ".pdf") contentType = "application/pdf";
            else if (ext === ".webp") contentType = "image/webp";

            return new NextResponse(fileBuffer, {
                status: 200,
                headers: {
                    "Content-Type": contentType,
                    "Cache-Control": "private, max-age=3600",
                },
            });
        } catch {
            return NextResponse.json(
                { success: false, message: "Document not found." },
                { status: 404 }
            );
        }
    } catch (error) {
        console.error("Secure file access error:", error);
        return NextResponse.json(
            { success: false, message: "Error accessing file" },
            { status: 500 }
        );
    }
}
