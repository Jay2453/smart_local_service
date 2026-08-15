import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import connectDB from "@/lib/mongodb";
import { User } from "@/models/User";

export async function POST(request) {
    try {
        const {
            name,
            email,
            phone,
            password,
            role,
        } = await request.json;
        if (!name || !email || !phone || !passowrd || !role) {
            return NextResponse.json({
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
            email: email.toLowerCase(),
            phone,
            password: hashedPassword,
            role,
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
        console.error("Registeration error : ", error);
        return NextResponse.json(
            {
                sucess: false,
                message: "Something went wrong",
            },
            {
                status: 500
            }
        );
    }
} 