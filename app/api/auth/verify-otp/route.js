import { NextResponse } from "next/server";
import otpStore from "@/lib/otpStore";

export async function POST(request) {
    try {
        const { phone, otp } = await request.json();

        if (!phone || !otp) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Phone number and OTP are required",
                },
                { status: 400 }
            );
        }

        const storedData = otpStore.get(phone);

        if (!storedData) {
            return NextResponse.json(
                {
                    success: false,
                    message: "OTP not found. Please request a new OTP.",
                },
                { status: 404 }
            );
        }

        if (Date.now() > storedData.expiresAt) {
            otpStore.delete(phone);

            return NextResponse.json(
                {
                    success: false,
                    message: "OTP has expired. Please request a new one.",
                },
                { status: 401 }
            );
        }

        if (storedData.otp !== otp) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Invalid OTP.",
                },
                { status: 401 }
            );
        }

        otpStore.delete(phone);

        return NextResponse.json({
            success: true,
            message: "OTP verified successfully",
        });

    } catch (error) {
        console.error("VERIFY OTP ERROR:", error);

        return NextResponse.json(
            {
                success: false,
                message: "OTP verification failed",
            },
            { status: 500 }
        );
    }
}