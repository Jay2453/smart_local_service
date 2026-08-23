import {SignJWT, jwtVerify} from 'jose';
const secret = new TextEncoder().encode(
    process.env.SESSION_SECRET
);

export async function createSession(user){
    return await new SignJWT({
        id: user.id.toString(),
        name: user.name,
        phone: user.phone,
        role: user.role,
    })
    .setProtectedHeader({ alg: "HS256"})
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret);
}

export async function verifySession(token){
    try{
        const {payload} = await jwtVerify(token , secret);
        return payload;
    } catch {
        return null;
    }
}