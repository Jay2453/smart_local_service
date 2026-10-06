import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySession } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import Booking from "@/models/Booking";
import Payment from "@/models/Payment";
import { getRazorpay, rupeesToPaise } from "@/lib/razorpay";

/**
 * POST /api/payment/create-order
 *
 * Creates a Razorpay order for an existing booking.
 *
 * Security:
 *  - Requires authenticated customer session.
 *  - Amount is calculated SERVER-SIDE from the booking record.
 *  - Never accepts amount from request body.
 *  - Verifies booking belongs to the authenticated user.
 *  - Prevents duplicate orders for already-paid bookings.
 */
export async function POST(request) {
    try {
        // ── 1. Authenticate ──────────────────────────────────────────────
        const cookieStore = await cookies();
        const token = cookieStore.get("smartserve_session")?.value;

        if (!token) {
            return NextResponse.json(
                { success: false, message: "Authentication required." },
                { status: 401 }
            );
        }

        const session = await verifySession(token);
        if (!session || session.role !== "customer") {
            return NextResponse.json(
                { success: false, message: "Only customers can initiate payments." },
                { status: 403 }
            );
        }

        // ── 2. Parse & validate input ────────────────────────────────────
        let body;
        try {
            body = await request.json();
        } catch {
            return NextResponse.json(
                { success: false, message: "Invalid request body." },
                { status: 400 }
            );
        }

        const { bookingId } = body;

        if (!bookingId || typeof bookingId !== "string" || bookingId.trim().length === 0) {
            return NextResponse.json(
                { success: false, message: "bookingId is required." },
                { status: 400 }
            );
        }

        await connectDB();

        // ── 3. Fetch booking & verify ownership ──────────────────────────
        const booking = await Booking.findById(bookingId.trim());

        if (!booking) {
            return NextResponse.json(
                { success: false, message: "Booking not found." },
                { status: 404 }
            );
        }

        if (booking.customerId.toString() !== session.id) {
            return NextResponse.json(
                { success: false, message: "You are not authorised to pay for this booking." },
                { status: 403 }
            );
        }

        // ── 4. Validate booking state ────────────────────────────────────
        if (booking.status === "cancelled") {
            return NextResponse.json(
                { success: false, message: "Cannot pay for a cancelled booking." },
                { status: 400 }
            );
        }

        // ── 5. Prevent duplicate payment for already-paid booking ────────
        const existingPayment = await Payment.findOne({ bookingId: booking._id });

        if (existingPayment) {
            // If already paid, return success with existing info
            if (existingPayment.status === "paid" || existingPayment.status === "completed") {
                return NextResponse.json(
                    {
                        success: false,
                        message: "This booking has already been paid.",
                        alreadyPaid: true,
                        paymentId: existingPayment._id,
                    },
                    { status: 409 }
                );
            }

            // If a Razorpay order was already created and is still pending/created,
            // return it so the frontend can resume checkout
            if (
                existingPayment.status === "created" &&
                existingPayment.razorpayOrderId
            ) {
                return NextResponse.json({
                    success: true,
                    resuming: true,
                    orderId: existingPayment.razorpayOrderId,
                    amount: existingPayment.amount,
                    amountPaise: rupeesToPaise(existingPayment.amount),
                    currency: existingPayment.currency || "INR",
                    bookingId: booking._id,
                    keyId: process.env.RAZORPAY_KEY_ID,
                });
            }
        }

        // ── 6. Calculate amount SERVER-SIDE ──────────────────────────────
        // NEVER trust req.body.amount. Always derive from the booking record.
        const amountRupees = booking.estimatedTotal;

        if (!amountRupees || amountRupees <= 0) {
            return NextResponse.json(
                { success: false, message: "Invalid booking amount." },
                { status: 400 }
            );
        }

        const amountPaise = rupeesToPaise(amountRupees);

        // ── 7. Create Razorpay order ─────────────────────────────────────
        const razorpay = getRazorpay();

        const razorpayOrder = await razorpay.orders.create({
            amount: amountPaise,          // Razorpay requires paise
            currency: "INR",
            receipt: `bk_${booking._id.toString().slice(-10)}`,
            notes: {
                bookingId: booking._id.toString(),
                customerId: session.id,
                customerName: session.name || "",
                services: booking.services.map((s) => s.name).join(", ").slice(0, 255),
            },
        });

        // ── 8. Persist Razorpay order ID in payment record ───────────────
        const paymentData = {
            bookingId: booking._id,
            customerId: booking.customerId,
            providerId: booking.assignedProviderId || null,
            amount: amountRupees,
            currency: "INR",
            method: "razorpay",
            paymentProvider: "razorpay",
            razorpayOrderId: razorpayOrder.id,
            status: "created",
            commissionPercent: 10,
            commissionAmount: Math.round(amountRupees * 0.1),
            providerPayoutAmount: Math.round(amountRupees * 0.9),
        };

        if (existingPayment) {
            // Update existing failed/cancelled payment record
            Object.assign(existingPayment, paymentData);
            await existingPayment.save();
        } else {
            await Payment.create(paymentData);
        }

        // ── 9. Return public info only — NEVER return KEY_SECRET ─────────
        return NextResponse.json({
            success: true,
            orderId: razorpayOrder.id,
            amount: amountRupees,
            amountPaise,
            currency: "INR",
            bookingId: booking._id,
            keyId: process.env.RAZORPAY_KEY_ID,  // Public key only
        });

    } catch (error) {
        // Safe error logging — never log secrets
        console.error("create-order error:", error.message || error);
        return NextResponse.json(
            { success: false, message: "Unable to create payment order. Please try again." },
            { status: 500 }
        );
    }
}
