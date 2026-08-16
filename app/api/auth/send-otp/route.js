import { NextResponse } from "next/server";
import otpStore from "@/lib/otpStore";

export async function POST(request) {
    console.log("SEND OTP API CALLED");

    try {
        const { phone } = await request.json();

        console.log("Phone received:", phone);

        if (!phone) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Phone number is required",
                },
                { status: 400 }
            );
        }

        const otp = Math.floor(
            100000 + Math.random() * 900000
        ).toString();

        const expiresAt = Date.now() + 5 * 60 * 1000;

        otpStore.set(phone, {
            otp,
            expiresAt,
        });

        console.log("================================");
        console.log("OTP GENERATED:", otp);
        console.log("PHONE:", phone);
        console.log("================================");

        return NextResponse.json({
            success: true,
            message: "OTP generated successfully",
        });

    } catch (error) {
        console.error("SEND OTP ERROR:", error);

        return NextResponse.json(
            {
                success: false,
                message: "Could not generate OTP",
            },
            { status: 500 }
        );
    }
}