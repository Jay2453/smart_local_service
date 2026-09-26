import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import Provider from "@/models/Provider";
import Booking from "@/models/Booking";
import Payment from "@/models/Payment";
import SupportTicket from "@/models/SupportTicket";
import AdminAuditLog from "@/models/AdminAuditLog";

export async function GET(request) {
    try {
        const { error } = await requireAdmin(request);
        if (error) return error;

        await connectDB();

        // 1. Customer statistics
        const [totalCustomers, activeCustomers, deactivatedCustomers] = await Promise.all([
            User.countDocuments({ role: "customer" }),
            User.countDocuments({ role: "customer", isActive: { $ne: false }, status: { $ne: "deactivated" } }),
            User.countDocuments({ role: "customer", $or: [{ isActive: false }, { status: "deactivated" }] }),
        ]);

        // 2. Provider statistics
        const [
            totalProviders,
            verifiedProviders,
            pendingProviders,
            rejectedProviders,
            suspendedProviders,
            onlineProviders,
        ] = await Promise.all([
            Provider.countDocuments({}),
            Provider.countDocuments({ verificationStatus: "verified" }),
            Provider.countDocuments({ verificationStatus: "pending" }),
            Provider.countDocuments({ verificationStatus: "rejected" }),
            Provider.countDocuments({ $or: [{ isSuspended: true }, { status: "suspended" }] }),
            Provider.countDocuments({ isOnline: true }),
        ]);

        // 3. Booking statistics
        const [
            totalBookings,
            pendingBookings,
            acceptedBookings,
            inProgressBookings,
            completedBookings,
            cancelledBookings,
        ] = await Promise.all([
            Booking.countDocuments({}),
            Booking.countDocuments({ status: "pending" }),
            Booking.countDocuments({ status: "accepted" }),
            Booking.countDocuments({ status: "in_progress" }),
            Booking.countDocuments({ status: "completed" }),
            Booking.countDocuments({ status: "cancelled" }),
        ]);

        // 4. Financial statistics (computed from completed bookings and payments)
        const completedBookingsList = await Booking.find({ status: "completed" }).select("estimatedTotal");
        const totalRevenue = completedBookingsList.reduce((acc, b) => acc + (b.estimatedTotal || 0), 0);
        
        // Calculate platform commission (10% default)
        const paymentsList = await Payment.find({ status: "completed" });
        let commissionEarned = 0;
        let pendingPayouts = 0;

        if (paymentsList.length > 0) {
            commissionEarned = paymentsList.reduce((acc, p) => acc + (p.commissionAmount || (p.amount * 0.1)), 0);
            pendingPayouts = paymentsList
                .filter(p => p.payoutStatus === "pending")
                .reduce((acc, p) => acc + (p.providerPayoutAmount || (p.amount * 0.9)), 0);
        } else {
            commissionEarned = Math.round(totalRevenue * 0.1);
            pendingPayouts = Math.round(totalRevenue * 0.9);
        }

        // 5. Support tickets
        const [openTickets, inProgressTickets, resolvedTickets] = await Promise.all([
            SupportTicket.countDocuments({ status: "open" }),
            SupportTicket.countDocuments({ status: "in_progress" }),
            SupportTicket.countDocuments({ status: "resolved" }),
        ]);

        // 6. Recent Audit Logs
        const recentLogs = await AdminAuditLog.find({})
            .sort({ createdAt: -1 })
            .limit(10)
            .lean();

        // 7. Recent Bookings
        const recentBookings = await Booking.find({})
            .populate("customerId", "name phone email")
            .populate("assignedProviderId", "name phone Proffesion")
            .sort({ createdAt: -1 })
            .limit(5)
            .lean();

        // 8. Recent Provider Registrations
        const recentProviders = await Provider.find({})
            .select("name phone email Proffesion verificationStatus isOnline createdAt")
            .sort({ createdAt: -1 })
            .limit(5)
            .lean();

        return NextResponse.json({
            success: true,
            stats: {
                customers: {
                    total: totalCustomers,
                    active: activeCustomers,
                    deactivated: deactivatedCustomers,
                },
                providers: {
                    total: totalProviders,
                    verified: verifiedProviders,
                    pending: pendingProviders,
                    rejected: rejectedProviders,
                    suspended: suspendedProviders,
                    online: onlineProviders,
                },
                bookings: {
                    total: totalBookings,
                    pending: pendingBookings,
                    accepted: acceptedBookings,
                    active: inProgressBookings,
                    completed: completedBookings,
                    cancelled: cancelledBookings,
                },
                finances: {
                    totalRevenue,
                    commissionEarned,
                    pendingPayouts,
                },
                support: {
                    open: openTickets,
                    inProgress: inProgressTickets,
                    resolved: resolvedTickets,
                },
            },
            recentActivity: {
                auditLogs: recentLogs,
                bookings: recentBookings,
                providers: recentProviders,
            },
        });
    } catch (error) {
        console.error("Admin dashboard API error:", error);
        return NextResponse.json(
            { success: false, message: "Error loading dashboard metrics" },
            { status: 500 }
        );
    }
}
