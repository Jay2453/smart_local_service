import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import Provider from "@/models/Provider";

// Verify user if customer, else verify serviceProvider...

export async function POST(request) {
    try {
        const { email, phone } = await request.json();

        if (!email || !phone) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Email and phone number are required",
                },
                { status: 400 }
            );
        }

        await connectDB();

        const existingEmail = await User.findOne({
            email: email.toLowerCase(),
        });

        if (existingEmail) {
            return NextResponse.json(
                {
                    success: false,
                    field: "email",
                    message: "This email is already registered",
                },
                { status: 409 }
            );
        }

        const existingPhone = await User.findOne({
            phone: phone,
        });

        if (existingPhone) {
            return NextResponse.json(
                {
                    success: false,
                    field: "phone",
                    message: "This phone number is already registered",
                },
                { status: 409 }
            );
        }

        return NextResponse.json(
            {
                success: true,
                message: "Email and phone are available",
            },
            { status: 200 }
        );

    } catch (error) {
        console.error("Check registration error:", error);

        return NextResponse.json(
            {
                success: false,
                message: "Something went wrong",
            },
            { status: 500 }
        );
    }
}