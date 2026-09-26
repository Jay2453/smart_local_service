import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { verifySession, ADMIN_COOKIE_NAME, USER_COOKIE_NAME } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import AdminAuditLog from "@/models/AdminAuditLog";

/**
 * Extracts and verifies the admin identity from incoming cookies or NextRequest headers
 * Checks the DB to guarantee the account is active, exists, and possesses role='admin'.
 */
export async function getAdminSession(request = null) {
    try {
        let token = null;

        // Try getting token from request cookies if provided
        if (request && typeof request.cookies?.get === "function") {
            token = request.cookies.get(ADMIN_COOKIE_NAME)?.value ||
                    request.cookies.get(USER_COOKIE_NAME)?.value;
        }

        // Try Bearer token in Authorization header
        if (!token && request && request.headers) {
            const authHeader = typeof request.headers.get === "function" 
                ? request.headers.get("authorization") 
                : request.headers["authorization"];
            if (authHeader && authHeader.startsWith("Bearer ")) {
                token = authHeader.substring(7).trim();
            }
        }

        // Fallback to Next.js cookies() store
        if (!token) {
            try {
                const cookieStore = await cookies();
                token = cookieStore.get(ADMIN_COOKIE_NAME)?.value ||
                        cookieStore.get(USER_COOKIE_NAME)?.value;
            } catch {
                // Ignore cookies() error when not in request context
            }
        }

        if (!token) {
            return null;
        }

        const session = await verifySession(token);
        if (!session || session.role !== "admin") {
            return null;
        }

        await connectDB();

        const admin = await User.findOne({
            _id: session.id,
            role: "admin",
            isActive: { $ne: false },
            status: { $nin: ["deactivated", "suspended"] },
        }).select("-password");

        if (!admin) {
            return null;
        }

        return {
            session,
            admin: {
                id: admin._id.toString(),
                _id: admin._id,
                name: admin.name,
                email: admin.email,
                phone: admin.phone,
                role: admin.role,
                isActive: admin.isActive,
                status: admin.status,
            },
        };
    } catch (error) {
        console.error("getAdminSession error:", error);
        return null;
    }
}

/**
 * Enforces admin authorization on an API route.
 * Returns { error: NextResponse, admin: null } on failure,
 * or { error: null, admin, session } on success.
 */
export async function requireAdmin(request = null) {
    const authResult = await getAdminSession(request);

    if (!authResult) {
        return {
            error: NextResponse.json(
                {
                    success: false,
                    message: "Access denied. Valid admin authentication required.",
                },
                { status: 401 }
            ),
            admin: null,
            session: null,
        };
    }

    return {
        error: null,
        admin: authResult.admin,
        session: authResult.session,
    };
}

/**
 * Record an entry into AdminAuditLog securely
 */
export async function logAdminAction({
    admin = null,
    action,
    targetType,
    targetId = null,
    description,
    req = null,
    metadata = {},
}) {
    try {
        await connectDB();

        let ipAddress = "";
        let userAgent = "";

        if (req) {
            if (typeof req.headers?.get === "function") {
                ipAddress = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || 
                            req.headers.get("x-real-ip") || "";
                userAgent = req.headers.get("user-agent") || "";
            } else if (req.headers) {
                ipAddress = req.headers["x-forwarded-for"]?.split(",")[0]?.trim() || 
                            req.headers["x-real-ip"] || "";
                userAgent = req.headers["user-agent"] || "";
            }
        }

        // Strip sensitive fields if present in metadata
        const safeMetadata = { ...metadata };
        delete safeMetadata.password;
        delete safeMetadata.token;
        delete safeMetadata.otp;
        delete safeMetadata.secret;

        await AdminAuditLog.create({
            adminId: admin?.id || admin?._id || null,
            adminEmail: admin?.email || "system",
            adminName: admin?.name || "System Administrator",
            action,
            targetType,
            targetId: targetId ? targetId.toString() : null,
            description,
            ipAddress,
            userAgent,
            metadata: safeMetadata,
        });
    } catch (err) {
        console.error("Failed to write admin audit log:", err);
    }
}
