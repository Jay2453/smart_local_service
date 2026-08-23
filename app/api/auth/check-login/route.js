import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { createSession } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import Provider from "@/models/Provider";

export async function POST(request) {
    try {
        const { phone, password } = await request.json();

        // Validate login fields
        if (!phone || !password) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Phone number and password are required",
                },
                { status: 400 }
            );
        }

        if (phone.length !== 10) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Invalid phone number",
                },
                { status: 400 }
            );
        }

        await connectDB();

        const user = await User.findOne({ phone });
        const provider = await Provider.findOne({ phone });

        if (!user && !provider) {
            return NextResponse.json(
                {
                    success: false,
                    message: "No account found with this mobile number",
                },
                { status: 404 }
            );
        }

        let account;
        let role;

        if (provider) {
            account = provider;
            role = "serviceprovider";
        } else {
            account = user;
            role = "customer";
        }

        const passwordMatch = await bcrypt.compare(
            password,
            account.password
        );

        if (!passwordMatch) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Invalid phone number or password",
                },
                { status: 401 }
            );
        }

        // Create login session
        const token = await createSession({
            id: account._id,
            name: account.name,
            phone: account.phone,
            role,
        });

        const response = NextResponse.json(
            {
                success: true,
                message: "Login successful",
                user: {
                    id: account._id,
                    name: account.name,
                    phone: account.phone,
                    email: account.email,
                    role,
                },
            },
            { status: 200 }
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
        console.error("Login error:", error);

        return NextResponse.json(
            {
                success: false,
                message: "Something went wrong. Please try again.",
            },
            { status: 500 }
        );
    }
}