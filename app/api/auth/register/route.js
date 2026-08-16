import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";

export async function POST(request) {
    try {
        const {
            name,
            phone,
            email,
            password,
            role,
            address,
            city,
            state,
            pincode,
        } = await request.json();

        if (
            !name ||
            !email ||
            !phone ||
            !password ||
            !city ||
            !state ||
            !address ||
            !pincode ||
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

        const existingUser = await User.findOne({
            email: email.toLowerCase(),
        });

        if (existingUser) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Email already registered",
                },
                { status: 409 }
            );
        }

        const hashedPassword = await bcrypt.hash(password, 12);

        const user = await User.create({
            name,
            phone,
            email: email.toLowerCase(),
            password: hashedPassword,
            role,
            address,
            city,
            state,
            pincode,
        });

        return NextResponse.json(
            {
                success: true,
                message: "Registration successful",
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                },
            },
            { status: 201 }
        );

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