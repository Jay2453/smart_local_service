import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { createAdminSession, ADMIN_COOKIE_NAME, USER_COOKIE_NAME } from "@/lib/auth";
import { logAdminAction } from "@/lib/adminAuth";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";

// Simple in-memory rate limiter for admin login attempts: max 10 attempts per 5 minutes per IP
const loginAttempts = new Map();

function checkRateLimit(ip) {
    const now = Date.now();
    const windowMs = 5 * 60 * 1000;
    const maxAttempts = 10;

    const record = loginAttempts.get(ip) || { count: 0, resetAt: now + windowMs };

    if (now > record.resetAt) {
        record.count = 0;
        record.resetAt = now + windowMs;
    }

    record.count += 1;
    loginAttempts.set(ip, record);

    return record.count <= maxAttempts;
}

export async function POST(request) {
    let clientIp = "";
    try {
        clientIp = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || 
                   request.headers.get("x-real-ip") || "unknown";

        if (!checkRateLimit(clientIp)) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Too many login attempts. Please try again after 5 minutes.",
                },
                { status: 429 }
            );
        }

        const body = await request.json().catch(() => ({}));
        const { email, password } = body;

        // Generic error message to prevent account enumeration
        const GENERIC_AUTH_ERROR = "Invalid email or password.";

        if (!email || !password || typeof email !== "string" || typeof password !== "string") {
            return NextResponse.json(
                {
                    success: false,
                    message: "Email and password are required.",
                },
                { status: 400 }
            );
        }

        const normalizedEmail = email.toLowerCase().trim();

        await connectDB();

        // Query only accounts with role="admin"
        const adminUser = await User.findOne({
            email: normalizedEmail,
            role: "admin",
        });

        // Do not reveal if email exists or if role was not admin
        if (!adminUser) {
            await logAdminAction({
                admin: null,
                action: "failed_admin_login",
                targetType: "auth",
                targetId: normalizedEmail,
                description: `Failed admin login attempt for email: ${normalizedEmail} (account not found or not admin)`,
                req: request,
                metadata: { email: normalizedEmail, reason: "Account not found or not admin role" },
            });

            return NextResponse.json(
                {
                    success: false,
                    message: GENERIC_AUTH_ERROR,
                },
                { status: 401 }
            );
        }

        // Verify account is active
        if (adminUser.isActive === false || adminUser.status === "deactivated" || adminUser.status === "suspended") {
            await logAdminAction({
                admin: { id: adminUser._id, name: adminUser.name, email: adminUser.email },
                action: "failed_admin_login",
                targetType: "auth",
                targetId: adminUser._id.toString(),
                description: `Blocked login attempt for deactivated/suspended admin: ${normalizedEmail}`,
                req: request,
                metadata: { email: normalizedEmail, status: adminUser.status },
            });

            return NextResponse.json(
                {
                    success: false,
                    message: "This administrator account has been disabled. Contact system support.",
                },
                { status: 403 }
            );
        }

        // Compare password hash
        const isMatch = await bcrypt.compare(password, adminUser.password);

        if (!isMatch) {
            await logAdminAction({
                admin: { id: adminUser._id, name: adminUser.name, email: adminUser.email },
                action: "failed_admin_login",
                targetType: "auth",
                targetId: adminUser._id.toString(),
                description: `Failed admin login attempt: invalid password for ${normalizedEmail}`,
                req: request,
                metadata: { email: normalizedEmail, reason: "Invalid password" },
            });

            return NextResponse.json(
                {
                    success: false,
                    message: GENERIC_AUTH_ERROR,
                },
                { status: 401 }
            );
        }

        // Create secure JWT admin session
        const token = await createAdminSession({
            id: adminUser._id,
            name: adminUser.name,
            email: adminUser.email,
        });

        const isProduction = process.env.NODE_ENV === "production";

        const response = NextResponse.json(
            {
                success: true,
                message: "Admin authentication successful",
                admin: {
                    id: adminUser._id.toString(),
                    name: adminUser.name,
                    email: adminUser.email,
                    role: "admin",
                },
            },
            { status: 200 }
        );

        // Set secure HTTP-only cookie
        response.cookies.set({
            name: ADMIN_COOKIE_NAME,
            value: token,
            httpOnly: true,
            secure: isProduction,
            sameSite: "lax",
            maxAge: 60 * 60 * 24, // 24 hours
            path: "/",
        });

        // Also set smartserve_session for unified session readers if configured
        response.cookies.set({
            name: USER_COOKIE_NAME,
            value: token,
            httpOnly: true,
            secure: isProduction,
            sameSite: "lax",
            maxAge: 60 * 60 * 24,
            path: "/",
        });

        await logAdminAction({
            admin: { id: adminUser._id, name: adminUser.name, email: adminUser.email },
            action: "admin_login",
            targetType: "auth",
            targetId: adminUser._id.toString(),
            description: `Admin logged in: ${adminUser.name} (${adminUser.email})`,
            req: request,
        });

        return response;
    } catch (error) {
        console.error("Admin login error:", error);
        return NextResponse.json(
            {
                success: false,
                message: "Internal server error during authentication.",
            },
            { status: 500 }
        );
    }
}
