import { NextResponse } from "next/server";
import { requireAdmin, logAdminAction } from "@/lib/adminAuth";
import connectDB from "@/lib/mongodb";
import PlatformSetting from "@/models/PlatformSetting";

// Allowed platform setting keys and their validation constraints
const ALLOWED_SETTINGS_WHITELIST = {
    platform_name: { type: "string", minLen: 2, maxLen: 50 },
    support_email: { type: "string", minLen: 5, maxLen: 100 },
    support_phone: { type: "string", minLen: 8, maxLen: 20 },
    default_commission_percent: { type: "number", min: 0, max: 100 },
    cancellation_window_hours: { type: "number", min: 0, max: 72 },
    cancellation_fee: { type: "number", min: 0, max: 5000 },
    require_provider_verification: { type: "boolean" },
    maintenance_mode: { type: "boolean" },
    broadcast_notifications_enabled: { type: "boolean" },
};

export async function GET(request) {
    try {
        const { error } = await requireAdmin(request);
        if (error) return error;

        await connectDB();

        const settings = await PlatformSetting.find({}).sort({ category: 1, key: 1 }).lean();

        // Convert to key-value dictionary and list
        const settingsDict = {};
        settings.forEach((s) => {
            settingsDict[s.key] = s.value;
        });

        return NextResponse.json({
            success: true,
            settings,
            settingsMap: settingsDict,
        });
    } catch (error) {
        console.error("Admin get settings error:", error);
        return NextResponse.json(
            { success: false, message: "Failed to retrieve platform settings" },
            { status: 500 }
        );
    }
}

export async function PUT(request) {
    try {
        const { error, admin } = await requireAdmin(request);
        if (error) return error;

        const body = await request.json().catch(() => ({}));
        const { settings } = body; // Expected format: { key: value, ... } or [{ key, value }]

        if (!settings || typeof settings !== "object") {
            return NextResponse.json(
                { success: false, message: "Invalid payload format. Expected settings object." },
                { status: 400 }
            );
        }

        const entriesToUpdate = Array.isArray(settings)
            ? settings.map((s) => ({ key: s.key, value: s.value }))
            : Object.entries(settings).map(([key, value]) => ({ key, value }));

        await connectDB();

        const updatedResults = [];
        const rejectedKeys = [];

        for (const { key, value } of entriesToUpdate) {
            // Strict security whitelist check to prevent secret injection or tampering
            const spec = ALLOWED_SETTINGS_WHITELIST[key];
            if (!spec) {
                rejectedKeys.push(key);
                continue;
            }

            // Value type validation
            if (spec.type === "number") {
                const num = Number(value);
                if (isNaN(num) || num < spec.min || num > spec.max) {
                    rejectedKeys.push(key);
                    continue;
                }
            } else if (spec.type === "boolean") {
                if (typeof value !== "boolean") {
                    rejectedKeys.push(key);
                    continue;
                }
            } else if (spec.type === "string") {
                if (typeof value !== "string" || value.length < spec.minLen || value.length > spec.maxLen) {
                    rejectedKeys.push(key);
                    continue;
                }
            }

            const updated = await PlatformSetting.findOneAndUpdate(
                { key },
                {
                    value,
                    updatedBy: admin.id,
                },
                { new: true, upsert: true }
            );

            updatedResults.push(updated);
        }

        await logAdminAction({
            admin,
            action: "settings_updated",
            targetType: "setting",
            targetId: null,
            description: `Admin updated platform configuration settings: ${updatedResults.map((s) => s.key).join(", ")}`,
            req: request,
            metadata: { updatedKeys: updatedResults.map((s) => s.key), rejectedKeys },
        });

        return NextResponse.json({
            success: true,
            message: "Platform settings updated successfully.",
            updated: updatedResults,
            rejectedKeys: rejectedKeys.length > 0 ? rejectedKeys : undefined,
        });
    } catch (error) {
        console.error("Admin update settings error:", error);
        return NextResponse.json(
            { success: false, message: "Failed to update platform settings" },
            { status: 500 }
        );
    }
}
