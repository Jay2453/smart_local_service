import { NextResponse } from "next/server";
import { requireAdmin, logAdminAction } from "@/lib/adminAuth";
import connectDB from "@/lib/mongodb";
import Payment from "@/models/Payment";
import Notification from "@/models/Notification";

export async function GET(request) {
    try {
        const { error } = await requireAdmin(request);
        if (error) return error;

        const { searchParams } = new URL(request.url);
        const status = searchParams.get("status") || "all";
        const payoutStatus = searchParams.get("payoutStatus") || "all";
        const refundStatus = searchParams.get("refundStatus") || "all";
        const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
        const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "15", 10)));
        const skip = (page - 1) * limit;

        await connectDB();

        const query = {};

        if (status !== "all") {
            query.status = status;
        }

        if (payoutStatus !== "all") {
            query.payoutStatus = payoutStatus;
        }

        if (refundStatus !== "all") {
            query.refundStatus = refundStatus;
        }

        const [total, payments, allCompletedPayments] = await Promise.all([
            Payment.countDocuments(query),
            Payment.find(query)
                .populate("customerId", "name email phone")
                .populate("providerId", "name phone Proffesion")
                .populate("bookingId")
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            Payment.find({ status: "completed" }).lean(),
        ]);

        // Calculate summary finances strictly on the server
        const totalGrossRevenue = allCompletedPayments.reduce((acc, p) => acc + (p.amount || 0), 0);
        const totalCommissionEarned = allCompletedPayments.reduce(
            (acc, p) => acc + (p.commissionAmount || Math.round(p.amount * ((p.commissionPercent || 10) / 100))),
            0
        );
        const totalProviderPayouts = allCompletedPayments.reduce(
            (acc, p) => acc + (p.providerPayoutAmount || (p.amount - Math.round(p.amount * ((p.commissionPercent || 10) / 100)))),
            0
        );
        const pendingPayoutAmount = allCompletedPayments
            .filter((p) => p.payoutStatus === "pending")
            .reduce(
                (acc, p) => acc + (p.providerPayoutAmount || (p.amount - Math.round(p.amount * ((p.commissionPercent || 10) / 100)))),
                0
            );

        return NextResponse.json({
            success: true,
            summary: {
                totalGrossRevenue,
                totalCommissionEarned,
                totalProviderPayouts,
                pendingPayoutAmount,
                totalTransactions: allCompletedPayments.length,
            },
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
            payments,
        });
    } catch (error) {
        console.error("Admin list payments error:", error);
        return NextResponse.json(
            { success: false, message: "Failed to retrieve financial transactions" },
            { status: 500 }
        );
    }
}

export async function PATCH(request) {
    try {
        const { error, admin } = await requireAdmin(request);
        if (error) return error;

        const body = await request.json().catch(() => ({}));
        const { paymentId, action, refundAmount, refundReason = "", payoutStatus } = body;

        if (!paymentId || !action) {
            return NextResponse.json(
                { success: false, message: "paymentId and action ('refund' or 'payout') are required." },
                { status: 400 }
            );
        }

        await connectDB();

        const payment = await Payment.findById(paymentId);
        if (!payment) {
            return NextResponse.json(
                { success: false, message: "Payment record not found." },
                { status: 404 }
            );
        }

        if (action === "refund") {
            const amountToRefund = Number(refundAmount) || payment.amount;
            if (amountToRefund <= 0 || amountToRefund > payment.amount) {
                return NextResponse.json(
                    { success: false, message: `Invalid refund amount. Must be between 1 and ₹${payment.amount}.` },
                    { status: 400 }
                );
            }

            payment.refundStatus = "processed";
            payment.refundAmount = amountToRefund;
            payment.refundReason = refundReason.trim() || "Refund approved by administrator";
            payment.refundedAt = new Date();
            payment.status = "refunded";

            await payment.save();

            // Notify customer
            await Notification.create({
                recipientId: payment.customerId,
                recipientRole: "customer",
                title: "Refund Processed",
                message: `A refund of ₹${amountToRefund} has been processed for booking #${payment.bookingId.toString().slice(-6)}. Reason: ${payment.refundReason}`,
                type: "system",
                link: "/Dashboard",
            });

            await logAdminAction({
                admin,
                action: "payment_refunded",
                targetType: "payment",
                targetId: payment._id.toString(),
                description: `Admin processed refund of ₹${amountToRefund} for payment #${payment._id.toString().slice(-6)} (Booking #${payment.bookingId.toString().slice(-6)})`,
                req: request,
                metadata: { paymentId: payment._id, amountToRefund, refundReason },
            });

            return NextResponse.json({
                success: true,
                message: `Refund of ₹${amountToRefund} processed successfully.`,
                payment,
            });
        } else if (action === "payout") {
            const validPayoutStatuses = ["pending", "processed", "failed", "na"];
            if (!validPayoutStatuses.includes(payoutStatus)) {
                return NextResponse.json(
                    { success: false, message: `Invalid payout status. Must be one of: ${validPayoutStatuses.join(", ")}` },
                    { status: 400 }
                );
            }

            payment.payoutStatus = payoutStatus;
            if (payoutStatus === "processed") {
                payment.payoutProcessedAt = new Date();
            }

            await payment.save();

            // Notify provider if payout was marked processed
            if (payoutStatus === "processed") {
                await Notification.create({
                    recipientId: payment.providerId,
                    recipientRole: "serviceprovider",
                    title: "Payout Released",
                    message: `Platform payout of ₹${payment.providerPayoutAmount || Math.round(payment.amount * 0.9)} has been processed for booking #${payment.bookingId.toString().slice(-6)}.`,
                    type: "system",
                    link: "/Serviceprovider",
                });
            }

            await logAdminAction({
                admin,
                action: "payout_updated",
                targetType: "payment",
                targetId: payment._id.toString(),
                description: `Admin updated provider payout status to '${payoutStatus}' for payment #${payment._id.toString().slice(-6)}`,
                req: request,
                metadata: { paymentId: payment._id, payoutStatus },
            });

            return NextResponse.json({
                success: true,
                message: `Payout status updated to '${payoutStatus}'.`,
                payment,
            });
        }

        return NextResponse.json(
            { success: false, message: "Invalid action. Supported: 'refund', 'payout'." },
            { status: 400 }
        );
    } catch (error) {
        console.error("Admin process financial action error:", error);
        return NextResponse.json(
            { success: false, message: "Failed to process payment action" },
            { status: 500 }
        );
    }
}
