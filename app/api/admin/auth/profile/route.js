import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { requireAdmin, logAdminAction } from "@/lib/adminAuth";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";

export async function GET(request) {
    try {
        const { error, admin } = await requireAdmin(request);
        if (error) return error;

        await connectDB();
        const user = await User.findById(admin.id).select("-password").lean();

        if (!user) {
            return NextResponse.json(
                { success: false, message: "Admin account not found" },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            admin: user,
        });
    } catch (error) {
        console.error("Get admin profile error:", error);
        return NextResponse.json(
            { success: false, message: "Error fetching admin profile" },
            { status: 500 }
        );
    }
}

export async function PATCH(request) {
    try {
        const { error, admin } = await requireAdmin(request);
        if (error) return error;

        const body = await request.json().catch(() => ({}));
        const { name, currentPassword, newPassword } = body;

        await connectDB();
        const user = await User.findById(admin.id);

        if (!user) {
            return NextResponse.json(
                { success: false, message: "Admin account not found" },
                { status: 404 }
            );
        }

        const updates = {};
        const changedFields = [];

        if (name && typeof name === "string" && name.trim()) {
            user.name = name.trim();
            updates.name = user.name;
            changedFields.push("name");
        }

        if (newPassword) {
            if (!currentPassword) {
                return NextResponse.json(
                    { success: false, message: "Current password is required to change password." },
                    { status: 400 }
                );
            }

            if (typeof newPassword !== "string" || newPassword.length < 8) {
                return NextResponse.json(
                    { success: false, message: "New password must be at least 8 characters long." },
                    { status: 400 }
                );
            }

            const isMatch = await bcrypt.compare(currentPassword, user.password);
            if (!isMatch) {
                await logAdminAction({
                    admin,
                    action: "admin_password_change_failed",
                    targetType: "auth",
                    targetId: user._id.toString(),
                    description: `Admin password change failed: incorrect current password for ${user.email}`,
                    req: request,
                });

                return NextResponse.json(
                    { success: false, message: "Current password does not match." },
                    { status: 400 }
                );
            }

            user.password = await bcrypt.hash(newPassword, 12);
            changedFields.push("password");
        }

        if (changedFields.length === 0) {
            return NextResponse.json(
                { success: false, message: "No valid changes provided." },
                { status: 400 }
            );
        }

        await user.save();

        await logAdminAction({
            admin,
            action: "admin_profile_updated",
            targetType: "auth",
            targetId: user._id.toString(),
            description: `Admin updated profile: ${changedFields.join(", ")} for ${user.email}`,
            req: request,
            metadata: { changedFields },
        });

        return NextResponse.json({
            success: true,
            message: `Admin profile successfully updated (${changedFields.join(", ")}).`,
            admin: {
                id: user._id.toString(),
                name: user.name,
                email: user.email,
                role: user.role,
            },
        });
    } catch (error) {
        console.error("Update admin profile error:", error);
        return NextResponse.json(
            { success: false, message: "Failed to update admin profile" },
            { status: 500 }
        );
    }
}
