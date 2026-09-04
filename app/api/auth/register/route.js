import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { createSession } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import Provider from "@/models/Provider";
export async function POST(request) {
    try {
        const { 
            name,
            phone,
            email,
            password,
            role,
            address,
            Proffesion,
            Experience,
            ServiceRadius,
            latitude,
            longitude,
        } = await request.json();

        if (
            !name ||
            !email ||
            !phone ||
            !password ||
            !role
        ) {
            return NextResponse.json(
                {
                    success: false,
                    message: "All fields are required",
                },
                { status: 400 }
            );
        }

        if (!["customer", "serviceprovider"].includes(role)) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Invalid role",
                },
                { status: 400 }
            );
        }

        await connectDB();

        const hashedPassword = await bcrypt.hash(password, 12);
        let createdUser;
        if (role === "serviceprovider") {
            createdUser = await Provider.create({
                name,
                phone,
                email: email.toLowerCase(),
                password: hashedPassword,
                address,
                Proffesion,
                Experience,
                ServiceRadius,
                latitude: latitude ? Number(latitude) : null,
                longitude: longitude ? Number(longitude) : null,
                role,
            });

        } else {
            createdUser = await User.create({
                name,
                phone,
                email: email.toLowerCase(),
                password: hashedPassword,
                role,
            });
        }

        const token = await createSession({
            id: createdUser._id,
            name: createdUser.name,
            phone: createdUser.phone,
            role: createdUser.role,
        });

        const response = NextResponse.json(
            {
                success: true,
                message: "Registration successful",
                user: {
                    id: createdUser._id,
                    name: createdUser.name,
                    email: createdUser.email,
                    role: createdUser.role,
                },
            },
            { status: 201 }
        );

        response.cookies.set({
            name: "smartserve_session",
            value: token,
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 60 * 60 * 24 * 7,
            path: "/",
        });

        return response;

    } catch (error) {
        console.error("Registration error:", error);
        return NextResponse.json(
            {
                success: false,
                message: "Something went wrong",
            },
            { status: 500 }
        );
    }
}