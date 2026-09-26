import { NextResponse } from "next/server";
import { requireAdmin, logAdminAction } from "@/lib/adminAuth";
import connectDB from "@/lib/mongodb";
import SupportTicket from "@/models/SupportTicket";
import Notification from "@/models/Notification";

export async function GET(request, { params }) {
    try {
        const { error } = await requireAdmin(request);
        if (error) return error;

        const { id } = await params;
        await connectDB();

        const ticket = await SupportTicket.findById(id)
            .populate("assignedAdminId", "name email")
            .populate("bookingId")
            .lean();

        if (!ticket) {
            return NextResponse.json(
                { success: false, message: "Support ticket not found." },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            ticket,
        });
    } catch (error) {
        console.error("Admin get support ticket error:", error);
        return NextResponse.json(
            { success: false, message: "Failed to fetch support ticket" },
            { status: 500 }
        );
    }
}

export async function PATCH(request, { params }) {
    try {
        const { error, admin } = await requireAdmin(request);
        if (error) return error;

        const { id } = await params;
        const body = await request.json().catch(() => ({}));
        const { status, priority, assignedAdminId } = body;

        await connectDB();

        const ticket = await SupportTicket.findById(id);
        if (!ticket) {
            return NextResponse.json(
                { success: false, message: "Support ticket not found." },
                { status: 404 }
            );
        }

        const oldStatus = ticket.status;

        if (status) {
            ticket.status = status;
            if (status === "resolved") {
                ticket.resolvedAt = new Date();
            } else if (status === "closed") {
                ticket.closedAt = new Date();
            }
        }

        if (priority) {
            ticket.priority = priority;
        }

        if (assignedAdminId !== undefined) {
            ticket.assignedAdminId = assignedAdminId || null;
        }

        await ticket.save();

        if (status && status !== oldStatus) {
            // Notify the user if ticket was resolved or updated
            await Notification.create({
                recipientId: ticket.userId,
                recipientRole: ticket.userRole,
                title: "Support Ticket Updated",
                message: `Support ticket #${ticket.ticketNumber} status changed to: ${status.replace("_", " ")}.`,
                type: "system",
                link: ticket.userRole === "customer" ? "/Dashboard" : "/Serviceprovider",
            });
        }

        await logAdminAction({
            admin,
            action: "support_ticket_updated",
            targetType: "support",
            targetId: ticket._id.toString(),
            description: `Admin updated support ticket #${ticket.ticketNumber}: status changed from '${oldStatus}' to '${status || oldStatus}'`,
            req: request,
            metadata: { ticketNumber: ticket.ticketNumber, oldStatus, newStatus: status, priority },
        });

        return NextResponse.json({
            success: true,
            message: "Support ticket updated successfully.",
            ticket,
        });
    } catch (error) {
        console.error("Admin update support ticket error:", error);
        return NextResponse.json(
            { success: false, message: "Failed to update support ticket" },
            { status: 500 }
        );
    }
}

export async function POST(request, { params }) {
    try {
        const { error, admin } = await requireAdmin(request);
        if (error) return error;

        const { id } = await params;
        const body = await request.json().catch(() => ({}));
        const { message, isInternalNote = false } = body;

        if (!message || !message.trim()) {
            return NextResponse.json(
                { success: false, message: "Message text is required." },
                { status: 400 }
            );
        }

        await connectDB();

        const ticket = await SupportTicket.findById(id);
        if (!ticket) {
            return NextResponse.json(
                { success: false, message: "Support ticket not found." },
                { status: 404 }
            );
        }

        if (isInternalNote) {
            ticket.internalNotes.push({
                adminId: admin.id,
                adminName: admin.name,
                note: message.trim(),
                createdAt: new Date(),
            });
        } else {
            ticket.messages.push({
                senderRole: "admin",
                senderId: admin.id,
                senderName: admin.name,
                message: message.trim(),
                isInternalNote: false,
                createdAt: new Date(),
            });

            // Notify user of new support reply
            await Notification.create({
                recipientId: ticket.userId,
                recipientRole: ticket.userRole,
                title: "Support Response",
                message: `New message on ticket #${ticket.ticketNumber}: ${message.trim().slice(0, 60)}...`,
                type: "system",
                link: ticket.userRole === "customer" ? "/Dashboard" : "/Serviceprovider",
            });
        }

        await ticket.save();

        await logAdminAction({
            admin,
            action: isInternalNote ? "support_internal_note_added" : "support_reply_sent",
            targetType: "support",
            targetId: ticket._id.toString(),
            description: `Admin added ${isInternalNote ? "internal note" : "public reply"} to ticket #${ticket.ticketNumber}`,
            req: request,
            metadata: { ticketNumber: ticket.ticketNumber, isInternalNote },
        });

        return NextResponse.json({
            success: true,
            message: isInternalNote ? "Internal note added." : "Reply dispatched to user.",
            ticket,
        });
    } catch (error) {
        console.error("Admin append support message error:", error);
        return NextResponse.json(
            { success: false, message: "Failed to post message" },
            { status: 500 }
        );
    }
}
