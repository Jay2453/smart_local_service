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
            city,
            state,
            pincode,
            Proffesion,
            Experience,
            ServiceRadius,
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
            $or: [
                { email: email.toLowerCase() },
                { phone: phone }
            ]
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

        if (role == "serviceprovider") {
            const provider = await Provider.create({
                name,
                phone,
                email: email.toLowerCase(),
                password: hashedPassword,
                role,
                address,
                city,
                state,
                pincode,
                Proffesion,
                Experience,
                ServiceRadius,
            });
        }
        else {
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
        }

        return NextResponse.json(
            {
                success: true,
                message: "Registration successful",
                user: {
                    id: User._id,
                    name: User.name,
                    email: User.email,
                    role: User.role,
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