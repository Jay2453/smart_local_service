import { NextResponse } from "next/server";
import { requireAdmin, logAdminAction } from "@/lib/adminAuth";
import connectDB from "@/lib/mongodb";
import Provider from "@/models/Provider";
import ProviderVerification from "@/models/ProviderVerification";
import Notification from "@/models/Notification";

export async function GET(request) {
    try {
        const { error } = await requireAdmin(request);
        if (error) return error;

        const { searchParams } = new URL(request.url);
        const status = searchParams.get("status") || "all";
        const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
        const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "15", 10)));
        const skip = (page - 1) * limit;

        await connectDB();

        const query = {};
        if (status !== "all") {
            query.status = status;
        }

        const [total, verifications] = await Promise.all([
            ProviderVerification.countDocuments(query),
            ProviderVerification.find(query)
                .populate("providerId", "name email phone Proffesion address Experience ServiceRadius verificationStatus")
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
        ]);

        return NextResponse.json({
            success: true,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
            verifications,
        });
    } catch (error) {
        console.error("Admin list verifications error:", error);
        return NextResponse.json(
            { success: false, message: "Failed to retrieve verifications" },
            { status: 500 }
        );
    }
}

export async function POST(request) {
    try {
        const { error, admin } = await requireAdmin(request);
        if (error) return error;

        const body = await request.json().catch(() => ({}));
        const { providerId, decision, rejectionReason = "" } = body;

        if (!providerId || !["verified", "rejected"].includes(decision)) {
            return NextResponse.json(
                { success: false, message: "providerId and valid decision ('verified' or 'rejected') are required." },
                { status: 400 }
            );
        }

        if (decision === "rejected" && !rejectionReason.trim()) {
            return NextResponse.json(
                { success: false, message: "Rejection reason is required when rejecting verification." },
                { status: 400 }
            );
        }

        await connectDB();

        const provider = await Provider.findById(providerId);
        if (!provider) {
            return NextResponse.json(
                { success: false, message: "Service provider not found." },
                { status: 404 }
            );
        }

        const isApproved = decision === "verified";

        const verification = await ProviderVerification.findOneAndUpdate(
            { providerId },
            {
                status: decision,
                rejectionReason: isApproved ? "" : rejectionReason.trim(),
                verifiedAt: isApproved ? new Date() : null,
            },
            { upsert: true, new: true }
        );

        provider.verificationStatus = decision;
        await provider.save();

        // Send notification to the provider
        await Notification.create({
            recipientId: provider._id,
            recipientRole: "serviceprovider",
            title: isApproved ? "Identity Verification Approved! 🎉" : "Verification Update Required ⚠️",
            message: isApproved
                ? "Congratulations! Your profile has been verified by the SmartServe team. You are now eligible for instant customer service requests."
                : `Your document verification was rejected: ${rejectionReason.trim()}. Please re-submit your documents in your provider dashboard.`,
            type: "verification",
            link: "/Serviceprovider",
        });

        await logAdminAction({
            admin,
            action: isApproved ? "provider_verified" : "provider_rejected",
            targetType: "verification",
            targetId: provider._id.toString(),
            description: `${isApproved ? "Approved" : "Rejected"} verification for provider: ${provider.name} (${provider.email}). Reason: ${rejectionReason || "Approved by admin"}`,
            req: request,
            metadata: { providerId: provider._id, decision, rejectionReason },
        });

        return NextResponse.json({
            success: true,
            message: `Provider verification ${isApproved ? "approved" : "rejected"} successfully.`,
            verification,
            provider: {
                id: provider._id,
                name: provider.name,
                verificationStatus: provider.verificationStatus,
            },
        });
    } catch (error) {
        console.error("Admin verify provider error:", error);
        return NextResponse.json(
            { success: false, message: "Failed to process verification decision" },
            { status: 500 }
        );
    }
}
