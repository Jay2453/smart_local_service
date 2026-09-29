"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
    LifeBuoy,
    Search,
    RefreshCw,
    AlertTriangle,
    CheckCircle2,
    Send,
    Lock,
    X,
    ChevronLeft,
    ChevronRight,
    MessageSquare,
} from "lucide-react";

export default function AdminSupportPage() {
    const [tickets, setTickets] = useState([]);
    const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0, totalPages: 1 });
    const [statusFilter, setStatusFilter] = useState("all");
    const [priorityFilter, setPriorityFilter] = useState("all");
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // Ticket Conversation Modal
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [ticketDetail, setTicketDetail] = useState(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const [replyMessage, setReplyMessage] = useState("");
    const [isInternalNote, setIsInternalNote] = useState(false);
    const [replySubmitting, setReplySubmitting] = useState(false);
    const [replyError, setReplyError] = useState("");

    const fetchTickets = useCallback(async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams({
                page: pagination.page.toString(),
                limit: pagination.limit.toString(),
                status: statusFilter,
                priority: priorityFilter,
                search: search.trim(),
            });

            const res = await fetch(`/api/admin/support?${params.toString()}`);
            const data = await res.json();

            if (data.success) {
                setTickets(data.tickets || []);
                setPagination(data.pagination || { page: 1, limit: 15, total: 0, totalPages: 1 });
                setError("");
            } else {
                setError(data.message || "Failed to load support tickets.");
            }
        } catch (err) {
            console.error("Fetch tickets error:", err);
            setError("Network error connecting to support desk.");
        } finally {
            setLoading(false);
        }
    }, [pagination.page, pagination.limit, statusFilter, priorityFilter, search]);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        fetchTickets();
    }, [fetchTickets]);

    const handleOpenTicket = async (ticket) => {
        setSelectedTicket(ticket);
        setDetailLoading(true);
        setReplyError("");
        try {
            const res = await fetch(`/api/admin/support/${ticket._id}`);
            const data = await res.json();
            if (data.success) {
                setTicketDetail(data.ticket);
            }
        } catch (err) {
            console.error("Error fetching ticket details:", err);
        } finally {
            setDetailLoading(false);
        }
    };

    const handlePostMessage = async (e) => {
        e.preventDefault();
        if (!ticketDetail || !replyMessage.trim()) return;

        setReplySubmitting(true);
        setReplyError("");

        try {
            const res = await fetch(`/api/admin/support/${ticketDetail._id}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    message: replyMessage.trim(),
                    isInternalNote,
                }),
            });

            const data = await res.json();

            if (!res.ok || !data.success) {
                setReplyError(data.message || "Failed to post message.");
                setReplySubmitting(false);
                return;
            }

            setTicketDetail(data.ticket);
            setReplyMessage("");
            setIsInternalNote(false);
            fetchTickets();
        } catch (err) {
            console.error("Post reply error:", err);
            setReplyError("Communication error.");
        } finally {
            setReplySubmitting(false);
        }
    };

    const handleUpdateStatus = async (status) => {
        if (!ticketDetail) return;
        try {
            const res = await fetch(`/api/admin/support/${ticketDetail._id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status }),
            });
            const data = await res.json();
            if (data.success) {
                setTicketDetail(data.ticket);
                fetchTickets();
            }
        } catch (err) {
            console.error("Update ticket status error:", err);
        }
    };

    return (
        <div>
            {/* Header */}
            <div className="page-header">
                <div className="page-header-info">
                    <h1>Support & Dispute Resolution Desk</h1>
                    <p>Manage customer inquiries, service disputes, provider escalations, and internal notes.</p>
                </div>
                <div className="page-header-actions">
                    <button className="btn-secondary" onClick={fetchTickets}>
                        <RefreshCw size={15} className={loading ? "spin" : ""} />
                        <span>Refresh</span>
                    </button>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="admin-card" style={{ padding: "16px 20px", marginBottom: "20px" }}>
                <div className="filter-bar" style={{ margin: 0 }}>
                    <div className="search-input-wrapper">
                        <Search size={16} className="search-icon" />
                        <input
                            type="text"
                            placeholder="Search ticket #, subject, or user email..."
                            value={search}
                            onChange={(e) => {
                                setSearch(e.target.value);
                                setPagination((prev) => ({ ...prev, page: 1 }));
                            }}
                            className="search-input"
                        />
                    </div>

                    <div className="filter-selects">
                        <select
                            className="admin-select"
                            value={statusFilter}
                            onChange={(e) => {
                                setStatusFilter(e.target.value);
                                setPagination((prev) => ({ ...prev, page: 1 }));
                            }}
                        >
                            <option value="all">All Ticket Statuses</option>
                            <option value="open">Open</option>
                            <option value="in_progress">In Progress</option>
                            <option value="waiting_for_user">Waiting on User</option>
                            <option value="resolved">Resolved</option>
                            <option value="closed">Closed</option>
                        </select>

                        <select
                            className="admin-select"
                            value={priorityFilter}
                            onChange={(e) => {
                                setPriorityFilter(e.target.value);
                                setPagination((prev) => ({ ...prev, page: 1 }));
                            }}
                        >
                            <option value="all">All Priorities</option>
                            <option value="urgent">Urgent</option>
                            <option value="high">High</option>
                            <option value="medium">Medium</option>
                            <option value="low">Low</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Tickets Table */}
            <div className="admin-card">
                {loading ? (
                    <div className="loading-skeleton">
                        <div className="skeleton-row" />
                        <div className="skeleton-row" />
                    </div>
                ) : error ? (
                    <div className="empty-state">
                        <AlertTriangle size={32} color="#ef4444" />
                        <p style={{ color: "#fca5a5" }}>{error}</p>
                    </div>
                ) : tickets.length === 0 ? (
                    <div className="empty-state">
                        <LifeBuoy size={36} color="var(--admin-text-sub)" />
                        <h3>No Support Tickets Found</h3>
                        <p>No tickets matched your filter criteria.</p>
                    </div>
                ) : (
                    <div>
                        <div className="table-responsive">
                            <table className="admin-table">
                                <thead>
                                    <tr>
                                        <th>Ticket ID</th>
                                        <th>Subject</th>
                                        <th>User</th>
                                        <th>Role</th>
                                        <th>Category</th>
                                        <th>Priority</th>
                                        <th>Status</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {tickets.map((t) => (
                                        <tr key={t._id}>
                                            <td style={{ fontFamily: "monospace", color: "var(--admin-primary-darker)", fontWeight: "600" }}>
                                                {t.ticketNumber}
                                            </td>
                                            <td style={{ fontWeight: "600", color: "var(--admin-text-main)", maxWidth: "240px" }}>
                                                <div style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                                    {t.subject}
                                                </div>
                                            </td>
                                            <td>
                                                <div>{t.userName}</div>
                                                <div style={{ fontSize: "0.75rem", color: "var(--admin-text-sub)" }}>{t.userEmail}</div>
                                            </td>
                                            <td style={{ textTransform: "capitalize", fontSize: "0.75rem" }}>
                                                {t.userRole}
                                            </td>
                                            <td style={{ textTransform: "capitalize", color: "var(--admin-text-muted)" }}>
                                                {t.category?.replace("_", " ")}
                                            </td>
                                            <td>
                                                <span
                                                    className="status-pill"
                                                    style={{
                                                        background: t.priority === "urgent" ? "var(--admin-danger-bg)" : "var(--admin-border-light)",
                                                        color: t.priority === "urgent" ? "var(--admin-danger)" : "var(--admin-text-body)",
                                                        border: `1px solid ${t.priority === "urgent" ? "var(--admin-danger-border)" : "var(--admin-border)"}`,
                                                    }}
                                                >
                                                    {t.priority}
                                                </span>
                                            </td>
                                            <td>
                                                <span className={`status-pill ${t.status}`}>
                                                    {t.status?.replace("_", " ")}
                                                </span>
                                            </td>
                                            <td>
                                                <button
                                                    className="btn-primary"
                                                    style={{ padding: "6px 12px", fontSize: "0.75rem" }}
                                                    onClick={() => handleOpenTicket(t)}
                                                >
                                                    <MessageSquare size={14} /> View & Reply
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        <div className="pagination-bar">
                            <div className="pagination-info">
                                Page {pagination.page} of {pagination.totalPages} ({pagination.total} total tickets)
                            </div>
                            <div className="pagination-controls">
                                <button
                                    className="pagination-btn"
                                    disabled={pagination.page <= 1}
                                    onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))}
                                >
                                    <ChevronLeft size={16} /> Previous
                                </button>
                                <button
                                    className="pagination-btn"
                                    disabled={pagination.page >= pagination.totalPages}
                                    onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}
                                >
                                    Next <ChevronRight size={16} />
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Ticket Detail & Conversation Modal */}
            {selectedTicket && (
                <div className="modal-overlay" onClick={() => setSelectedTicket(null)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "780px" }}>
                        <div className="modal-header">
                            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                <LifeBuoy size={20} color="#04b204" />
                                <h2>{selectedTicket.ticketNumber}: {selectedTicket.subject}</h2>
                            </div>
                            <button className="modal-close-btn" onClick={() => setSelectedTicket(null)}>
                                <X size={20} />
                            </button>
                        </div>

                        <div className="modal-body">
                            {detailLoading || !ticketDetail ? (
                                <div className="loading-skeleton">
                                    <div className="skeleton-row" />
                                    <div className="skeleton-row" />
                                </div>
                            ) : (
                                <div>
                                    {/* Ticket Meta & Quick Actions */}
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--admin-card-inner)", border: "1px solid var(--admin-border)", padding: "12px 16px", borderRadius: "var(--admin-radius-md)", marginBottom: "16px", flexWrap: "wrap", gap: "10px" }}>
                                        <div>
                                            <div style={{ fontSize: "0.85rem", color: "var(--admin-text-main)", fontWeight: "700" }}>
                                                {ticketDetail.userName} ({ticketDetail.userEmail}) • {ticketDetail.userRole}
                                            </div>
                                            <div style={{ fontSize: "0.75rem", color: "var(--admin-text-sub)" }}>
                                                Category: {ticketDetail.category} • Priority: {ticketDetail.priority}
                                            </div>
                                        </div>

                                        <div style={{ display: "flex", gap: "8px" }}>
                                            {ticketDetail.status !== "resolved" && (
                                                <button
                                                    className="btn-success"
                                                    style={{ padding: "6px 12px", fontSize: "0.75rem" }}
                                                    onClick={() => handleUpdateStatus("resolved")}
                                                >
                                                    <CheckCircle2 size={14} /> Mark Resolved
                                                </button>
                                            )}
                                            {ticketDetail.status !== "closed" && (
                                                <button
                                                    className="btn-secondary"
                                                    style={{ padding: "6px 12px", fontSize: "0.75rem" }}
                                                    onClick={() => handleUpdateStatus("closed")}
                                                >
                                                    Close Ticket
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    {/* Conversation Stream */}
                                    <h4 style={{ margin: "0 0 10px 0", color: "var(--admin-text-main)", fontSize: "0.9rem" }}>
                                        Message Stream ({ticketDetail.messages?.length || 0})
                                    </h4>

                                    <div style={{ display: "flex", flexDirection: "column", gap: "10px", maxHeight: "240px", overflowY: "auto", marginBottom: "16px", paddingRight: "4px" }}>
                                        {ticketDetail.messages?.map((msg, idx) => {
                                            const isAdmin = msg.senderRole === "admin";
                                            return (
                                                <div
                                                    key={idx}
                                                    style={{
                                                        padding: "10px 14px",
                                                        borderRadius: "8px",
                                                        background: isAdmin ? "var(--admin-primary-light)" : "var(--admin-card-inner)",
                                                        border: `1px solid ${isAdmin ? "var(--admin-border-subtle)" : "var(--admin-border)"}`,
                                                        alignSelf: isAdmin ? "flex-end" : "flex-start",
                                                        maxWidth: "85%",
                                                    }}
                                                >
                                                    <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", fontSize: "0.75rem", color: "var(--admin-text-sub)", marginBottom: "4px" }}>
                                                        <span style={{ fontWeight: "700", color: isAdmin ? "var(--admin-primary-darker)" : "var(--admin-info)" }}>
                                                            {msg.senderName} ({msg.senderRole})
                                                        </span>
                                                        <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                                                    </div>
                                                    <div style={{ fontSize: "0.85rem", color: "var(--admin-text-main)", lineHeight: "1.4" }}>
                                                        {msg.message}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {/* Internal Notes Section (Isolated) */}
                                    {ticketDetail.internalNotes?.length > 0 && (
                                        <div style={{ background: "var(--admin-warning-bg)", border: "1px dashed var(--admin-warning-border)", borderRadius: "8px", padding: "12px", marginBottom: "16px" }}>
                                            <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.8rem", color: "var(--admin-warning)", fontWeight: "700", marginBottom: "8px" }}>
                                                <Lock size={14} /> Confidential Internal Staff Notes (Hidden from User)
                                            </div>
                                            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                                                {ticketDetail.internalNotes.map((note, idx) => (
                                                    <div key={idx} style={{ fontSize: "0.8rem", color: "var(--admin-text-body)" }}>
                                                        <strong>{note.adminName}:</strong> {note.note}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Reply Form */}
                                    <form onSubmit={handlePostMessage} style={{ borderTop: "1px solid var(--admin-border)", paddingTop: "14px" }}>
                                        {replyError && (
                                            <div className="status-pill rejected" style={{ width: "100%", padding: "8px", borderRadius: "8px", marginBottom: "10px" }}>
                                                {replyError}
                                            </div>
                                        )}

                                        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                                            <textarea
                                                rows={3}
                                                required
                                                placeholder={isInternalNote ? "Add a confidential internal administrative note..." : "Write a public response to the user..."}
                                                value={replyMessage}
                                                onChange={(e) => setReplyMessage(e.target.value)}
                                                className="search-input"
                                                style={{ height: "auto", padding: "10px" }}
                                            />

                                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                                <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.8rem", color: isInternalNote ? "#fde68a" : "var(--admin-text-muted)", cursor: "pointer" }}>
                                                    <input
                                                        type="checkbox"
                                                        checked={isInternalNote}
                                                        onChange={(e) => setIsInternalNote(e.target.checked)}
                                                    />
                                                    <Lock size={13} /> Save as Internal Note (Staff Only)
                                                </label>

                                                <button
                                                    type="submit"
                                                    className={isInternalNote ? "btn-secondary" : "btn-primary"}
                                                    disabled={replySubmitting}
                                                >
                                                    <Send size={14} />
                                                    {replySubmitting ? "Posting..." : isInternalNote ? "Save Internal Note" : "Send Response"}
                                                </button>
                                            </div>
                                        </div>
                                    </form>
                                </div>
                            )}
                        </div>

                        <div className="modal-footer">
                            <button className="btn-secondary" onClick={() => setSelectedTicket(null)}>
                                Close Desk
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
