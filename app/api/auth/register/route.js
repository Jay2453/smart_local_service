import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
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

        return NextResponse.json(
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