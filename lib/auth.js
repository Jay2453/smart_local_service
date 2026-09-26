import { SignJWT, jwtVerify } from "jose";

function getSecret() {
    const rawSecret = process.env.SESSION_SECRET || "smartserve_secure_default_fallback_session_secret_2026";
    return new TextEncoder().encode(rawSecret);
}

export const USER_COOKIE_NAME = "smartserve_session";
export const ADMIN_COOKIE_NAME = "smartserve_admin_session";

export async function createSession(user) {
    const payload = {
        id: (user.id || user._id).toString(),
        name: user.name,
        role: user.role,
    };
    if (user.phone) payload.phone = user.phone;
    if (user.email) payload.email = user.email;

    return await new SignJWT(payload)
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime("7d")
        .sign(getSecret());
}

export async function createAdminSession(admin) {
    return await new SignJWT({
        id: (admin.id || admin._id).toString(),
        name: admin.name,
        email: admin.email,
        role: "admin",
    })
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime("1d") // Admin sessions default to 24h
        .sign(getSecret());
}

export async function verifySession(token) {
    if (!token) return null;
    try {
        const { payload } = await jwtVerify(token, getSecret());
        return payload;
    } catch {
        return null;
    }
}