"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
    Bell,
    Send,
    RefreshCw,
    AlertTriangle,
    X,
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
} from "lucide-react";

export default function AdminNotificationsPage() {
    const [notifications, setNotifications] = useState([]);
    const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0, totalPages: 1 });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // Compose Modal
    const [composeOpen, setComposeOpen] = useState(false);
    const [target, setTarget] = useState("all"); // "all" | "customers" | "providers" | "individual"
    const [recipientId, setRecipientId] = useState("");
    const [recipientRole, setRecipientRole] = useState("customer");
    const [title, setTitle] = useState("");
    const [message, setMessage] = useState("");
    const [link, setLink] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [composeError, setComposeError] = useState("");
    const [composeSuccess, setComposeSuccess] = useState("");

    const fetchNotifications = useCallback(async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams({
                page: pagination.page.toString(),
                limit: pagination.limit.toString(),
            });

            const res = await fetch(`/api/admin/notifications?${params.toString()}`);
            const data = await res.json();

            if (data.success) {
                setNotifications(data.notifications || []);
                setPagination(data.pagination || { page: 1, limit: 15, total: 0, totalPages: 1 });
                setError("");
            } else {
                setError(data.message || "Failed to load notifications history.");
            }
        } catch (err) {
            console.error("Fetch notifications error:", err);
            setError("Network error fetching notifications.");
        } finally {
            setLoading(false);
        }
    }, [pagination.page, pagination.limit]);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        fetchNotifications();
    }, [fetchNotifications]);

    const handleComposeSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setComposeError("");
        setComposeSuccess("");

        try {
            const res = await fetch("/api/admin/notifications", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    target,
                    recipientId: target === "individual" ? recipientId.trim() : null,
                    recipientRole: target === "individual" ? recipientRole : target === "providers" ? "serviceprovider" : "customer",
                    title: title.trim(),
                    message: message.trim(),
                    link: link.trim(),
                }),
            });

            const data = await res.json();

            if (!res.ok || !data.success) {
                setComposeError(data.message || "Failed to dispatch announcement.");
                setSubmitting(false);
                return;
            }

            setComposeSuccess(`Broadcast dispatched successfully to ${data.recipientCount} recipient(s)!`);
            setTitle("");
            setMessage("");
            setLink("");
            setRecipientId("");
            setTimeout(() => {
                setComposeOpen(false);
                setComposeSuccess("");
                fetchNotifications();
            }, 1200);
        } catch (err) {
            console.error("Compose announcement error:", err);
            setComposeError("Failed to communicate with server.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div>
            {/* Header */}
            <div className="page-header">
                <div className="page-header-info">
                    <h1>Broadcast Announcements</h1>
                    <p>Dispatch real-time announcements, alerts, and system notices to platform users.</p>
                </div>
                <div className="page-header-actions">
                    <button className="btn-primary" onClick={() => setComposeOpen(true)}>
                        <Send size={16} /> Broadcast New Announcement
                    </button>
                    <button className="btn-secondary" onClick={fetchNotifications}>
                        <RefreshCw size={15} className={loading ? "spin" : ""} />
                        <span>Refresh</span>
                    </button>
                </div>
            </div>

            {/* Notifications Table */}
            <div className="admin-card">
                <div className="card-title-bar">
                    <h3>Dispatched Notification Stream</h3>
                </div>

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
                ) : notifications.length === 0 ? (
                    <div className="empty-state">
                        <Bell size={36} color="var(--admin-text-sub)" />
                        <h3>No Notifications on Record</h3>
                        <p>No announcements or system notifications found in the database.</p>
                    </div>
                ) : (
                    <div>
                        <div className="table-responsive">
                            <table className="admin-table">
                                <thead>
                                    <tr>
                                        <th>Title</th>
                                        <th>Target Role</th>
                                        <th>Type</th>
                                        <th>Sender</th>
                                        <th>Message Preview</th>
                                        <th>Timestamp</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {notifications.map((n) => (
                                        <tr key={n._id}>
                                            <td style={{ fontWeight: "600", color: "var(--admin-text-main)" }}>
                                                {n.title}
                                            </td>
                                            <td>
                                                <span className={`status-pill ${n.isBroadcast ? "open" : "active"}`}>
                                                    {n.isBroadcast ? `Broadcast (${n.broadcastTarget || "all"})` : n.recipientRole}
                                                </span>
                                            </td>
                                            <td style={{ textTransform: "capitalize", color: "var(--admin-text-muted)" }}>
                                                {n.type}
                                            </td>
                                            <td style={{ fontSize: "0.8rem", color: "var(--admin-primary-darker)", fontWeight: "600" }}>
                                                {n.sentByAdminId?.name || "System"}
                                            </td>
                                            <td style={{ maxWidth: "300px" }}>
                                                <div style={{ fontSize: "0.85rem", color: "var(--admin-text-body)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                                    {n.message}
                                                </div>
                                            </td>
                                            <td style={{ fontSize: "0.8rem", color: "var(--admin-text-sub)" }}>
                                                {new Date(n.createdAt).toLocaleString()}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        <div className="pagination-bar">
                            <div className="pagination-info">
                                Page {pagination.page} of {pagination.totalPages} ({pagination.total} total notifications)
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

            {/* Compose Broadcast Modal */}
            {composeOpen && (
                <div className="modal-overlay" onClick={() => setComposeOpen(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "580px" }}>
                        <div className="modal-header">
                            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                <Send size={20} color="#04b204" />
                                <h2>Compose System Announcement</h2>
                            </div>
                            <button className="modal-close-btn" onClick={() => setComposeOpen(false)}>
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleComposeSubmit}>
                            <div className="modal-body" style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                                {composeError && (
                                    <div className="status-pill rejected" style={{ width: "100%", padding: "10px", borderRadius: "8px" }}>
                                        {composeError}
                                    </div>
                                )}
                                {composeSuccess && (
                                    <div className="status-pill active" style={{ width: "100%", padding: "10px", borderRadius: "8px" }}>
                                        <CheckCircle2 size={16} /> {composeSuccess}
                                    </div>
                                )}

                                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                                    <label style={{ fontSize: "0.825rem", color: "var(--admin-text-muted)", fontWeight: "600" }}>
                                        Target Audience
                                    </label>
                                    <select
                                        className="admin-select"
                                        value={target}
                                        onChange={(e) => setTarget(e.target.value)}
                                    >
                                        <option value="all">Entire Platform (All Active Customers & Providers)</option>
                                        <option value="customers">Customers Only</option>
                                        <option value="providers">Service Providers Only</option>
                                        <option value="individual">Specific User (By User ID)</option>
                                    </select>
                                </div>

                                {target === "individual" && (
                                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                                        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                                            <label style={{ fontSize: "0.8rem", color: "var(--admin-text-muted)" }}>Target User ID</label>
                                            <input
                                                type="text"
                                                required
                                                placeholder="MongoDB Object ID"
                                                value={recipientId}
                                                onChange={(e) => setRecipientId(e.target.value)}
                                                className="search-input"
                                            />
                                        </div>
                                        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                                            <label style={{ fontSize: "0.8rem", color: "var(--admin-text-muted)" }}>Target Role</label>
                                            <select
                                                className="admin-select"
                                                value={recipientRole}
                                                onChange={(e) => setRecipientRole(e.target.value)}
                                            >
                                                <option value="customer">Customer</option>
                                                <option value="serviceprovider">Service Provider</option>
                                            </select>
                                        </div>
                                    </div>
                                )}

                                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                                    <label style={{ fontSize: "0.825rem", color: "var(--admin-text-muted)", fontWeight: "600" }}>
                                        Announcement Title
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="e.g. Scheduled System Maintenance Tonight"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        className="search-input"
                                    />
                                </div>

                                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                                    <label style={{ fontSize: "0.825rem", color: "var(--admin-text-muted)", fontWeight: "600" }}>
                                        Message Body
                                    </label>
                                    <textarea
                                        rows={4}
                                        required
                                        placeholder="Announcement details to be displayed in user notification feed..."
                                        value={message}
                                        onChange={(e) => setMessage(e.target.value)}
                                        className="search-input"
                                        style={{ height: "auto", padding: "10px" }}
                                    />
                                </div>

                                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                                    <label style={{ fontSize: "0.825rem", color: "var(--admin-text-muted)" }}>
                                        Action Link (Optional)
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="e.g. /Dashboard or /Services"
                                        value={link}
                                        onChange={(e) => setLink(e.target.value)}
                                        className="search-input"
                                    />
                                </div>
                            </div>

                            <div className="modal-footer">
                                <button type="button" className="btn-secondary" onClick={() => setComposeOpen(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn-primary" disabled={submitting}>
                                    {submitting ? "Dispatching..." : "Send Announcement"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
