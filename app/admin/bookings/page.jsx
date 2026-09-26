"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
    Calendar,
    Search,
    RefreshCw,
    Eye,
    AlertTriangle,
    X,
    ChevronLeft,
    ChevronRight,
    Edit3,
} from "lucide-react";

export default function AdminBookingsPage() {
    const [bookings, setBookings] = useState([]);
    const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [professionFilter, setProfessionFilter] = useState("all");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // Details Modal
    const [selectedBooking, setSelectedBooking] = useState(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const [bookingDetails, setBookingDetails] = useState(null);

    // Intervention Modal
    const [interventionTarget, setInterventionTarget] = useState(null);
    const [newStatus, setNewStatus] = useState("");
    const [cancellationReason, setCancellationReason] = useState("");
    const [submittingIntervention, setSubmittingIntervention] = useState(false);
    const [interventionError, setInterventionError] = useState("");

    const fetchBookings = useCallback(async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams({
                page: pagination.page.toString(),
                limit: pagination.limit.toString(),
                status: statusFilter,
                profession: professionFilter,
                search: search.trim(),
            });

            const res = await fetch(`/api/admin/bookings?${params.toString()}`);
            const data = await res.json();

            if (data.success) {
                setBookings(data.bookings || []);
                setPagination(data.pagination || { page: 1, limit: 10, total: 0, totalPages: 1 });
                setError("");
            } else {
                setError(data.message || "Failed to load bookings.");
            }
        } catch (err) {
            console.error("Fetch bookings error:", err);
            setError("Network error fetching bookings data.");
        } finally {
            setLoading(false);
        }
    }, [pagination.page, pagination.limit, statusFilter, professionFilter, search]);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        fetchBookings();
    }, [fetchBookings]);

    const handleViewDetails = async (booking) => {
        setSelectedBooking(booking);
        setDetailLoading(true);
        try {
            const res = await fetch(`/api/admin/bookings/${booking._id}`);
            const data = await res.json();
            if (data.success) {
                setBookingDetails(data);
            }
        } catch (err) {
            console.error("Error loading booking details:", err);
        } finally {
            setDetailLoading(false);
        }
    };

    const handleOpenIntervention = (booking) => {
        setInterventionTarget(booking);
        setNewStatus(booking.status);
        setCancellationReason(booking.cancellationReason || "");
        setInterventionError("");
    };

    const handleInterventionSubmit = async (e) => {
        e.preventDefault();
        if (!interventionTarget) return;

        setSubmittingIntervention(true);
        setInterventionError("");

        try {
            const res = await fetch(`/api/admin/bookings/${interventionTarget._id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    status: newStatus,
                    cancellationReason: newStatus === "cancelled" ? cancellationReason.trim() : "",
                }),
            });

            const data = await res.json();

            if (!res.ok || !data.success) {
                setInterventionError(data.message || "Failed to update booking status.");
                setSubmittingIntervention(false);
                return;
            }

            setInterventionTarget(null);
            fetchBookings();
        } catch (err) {
            console.error("Intervention submit error:", err);
            setInterventionError("Failed to update booking.");
        } finally {
            setSubmittingIntervention(false);
        }
    };

    return (
        <div>
            {/* Header */}
            <div className="page-header">
                <div className="page-header-info">
                    <h1>Service Booking Operations</h1>
                    <p>Track live customer requests, dispatched jobs, assigned providers, and lifecycle overrides.</p>
                </div>
                <div className="page-header-actions">
                    <button className="btn-secondary" onClick={fetchBookings}>
                        <RefreshCw size={15} className={loading ? "spin" : ""} />
                        <span>Refresh</span>
                    </button>
                </div>
            </div>

            {/* Filter Controls */}
            <div className="admin-card" style={{ padding: "16px 20px", marginBottom: "20px" }}>
                <div className="filter-bar" style={{ margin: 0 }}>
                    <div className="search-input-wrapper">
                        <Search size={16} className="search-icon" />
                        <input
                            type="text"
                            placeholder="Search by address, description, customer or provider..."
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
                            <option value="all">All Booking Statuses</option>
                            <option value="pending">Pending Dispatch</option>
                            <option value="accepted">Accepted / Assigned</option>
                            <option value="in_progress">In Progress</option>
                            <option value="completed">Completed</option>
                            <option value="cancelled">Cancelled</option>
                        </select>

                        <select
                            className="admin-select"
                            value={professionFilter}
                            onChange={(e) => {
                                setProfessionFilter(e.target.value);
                                setPagination((prev) => ({ ...prev, page: 1 }));
                            }}
                        >
                            <option value="all">All Services</option>
                            <option value="plumbing">Plumbing</option>
                            <option value="electrical">Electrical</option>
                            <option value="carpentry">Carpentry</option>
                            <option value="painting">Painting</option>
                            <option value="appliance">Appliance</option>
                            <option value="pest">Pest Control</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Bookings Table */}
            <div className="admin-card">
                {loading ? (
                    <div className="loading-skeleton">
                        <div className="skeleton-row" />
                        <div className="skeleton-row" />
                        <div className="skeleton-row" />
                    </div>
                ) : error ? (
                    <div className="empty-state">
                        <AlertTriangle size={32} color="#ef4444" style={{ marginBottom: "12px" }} />
                        <p style={{ color: "#fca5a5" }}>{error}</p>
                        <button className="btn-primary" onClick={fetchBookings} style={{ marginTop: "12px" }}>
                            Retry
                        </button>
                    </div>
                ) : bookings.length === 0 ? (
                    <div className="empty-state">
                        <Calendar size={36} color="var(--admin-text-sub)" style={{ marginBottom: "12px" }} />
                        <h3>No Bookings Found</h3>
                        <p>No service orders matched your current search filters.</p>
                    </div>
                ) : (
                    <div>
                        <div className="table-responsive">
                            <table className="admin-table">
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Customer</th>
                                        <th>Provider</th>
                                        <th>Services</th>
                                        <th>Scheduled For</th>
                                        <th>Amount</th>
                                        <th>Status</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {bookings.map((b) => (
                                        <tr key={b._id}>
                                            <td style={{ fontFamily: "monospace", color: "var(--admin-text-sub)" }}>
                                                #{b._id.toString().slice(-6)}
                                            </td>
                                            <td>
                                                <div style={{ fontWeight: "600", color: "#ffffff" }}>
                                                    {b.customerId?.name || "Customer"}
                                                </div>
                                                <div style={{ fontSize: "0.75rem", color: "var(--admin-text-sub)" }}>
                                                    {b.customerId?.phone}
                                                </div>
                                            </td>
                                            <td>
                                                {b.assignedProviderId ? (
                                                    <div>
                                                        <div style={{ fontWeight: "600", color: "#86efac" }}>
                                                            {b.assignedProviderId.name}
                                                        </div>
                                                        <div style={{ fontSize: "0.75rem", color: "var(--admin-text-sub)" }}>
                                                            {b.assignedProviderId.Proffesion}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <span style={{ color: "#f59e0b", fontSize: "0.8rem", fontWeight: "600" }}>
                                                        Awaiting Provider
                                                    </span>
                                                )}
                                            </td>
                                            <td>
                                                <div style={{ fontWeight: "500" }}>
                                                    {b.services?.map((s) => s.name).join(", ") || "Service"}
                                                </div>
                                                <div style={{ fontSize: "0.75rem", color: "var(--admin-text-sub)" }}>
                                                    {b.services?.[0]?.problem}
                                                </div>
                                            </td>
                                            <td>
                                                <div style={{ fontSize: "0.85rem" }}>{b.preferredDate}</div>
                                                <div style={{ fontSize: "0.75rem", color: "var(--admin-text-sub)" }}>{b.preferredTime}</div>
                                            </td>
                                            <td style={{ fontWeight: "700", color: "#ffffff" }}>
                                                ₹{b.estimatedTotal}
                                            </td>
                                            <td>
                                                <span className={`status-pill ${b.status}`}>{b.status.replace("_", " ")}</span>
                                            </td>
                                            <td>
                                                <div style={{ display: "flex", gap: "6px" }}>
                                                    <button
                                                        className="btn-secondary"
                                                        style={{ padding: "6px 10px", fontSize: "0.75rem" }}
                                                        onClick={() => handleViewDetails(b)}
                                                    >
                                                        <Eye size={14} /> Details
                                                    </button>
                                                    <button
                                                        className="btn-primary"
                                                        style={{ padding: "6px 10px", fontSize: "0.75rem" }}
                                                        onClick={() => handleOpenIntervention(b)}
                                                    >
                                                        <Edit3 size={14} /> Manage
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        <div className="pagination-bar">
                            <div className="pagination-info">
                                Page {pagination.page} of {pagination.totalPages} ({pagination.total} total bookings)
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

            {/* Booking Details Modal */}
            {selectedBooking && (
                <div className="modal-overlay" onClick={() => setSelectedBooking(null)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "760px" }}>
                        <div className="modal-header">
                            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                <Calendar size={22} color="#04b204" />
                                <h2>Booking #{selectedBooking._id.toString().slice(-6)} Details</h2>
                            </div>
                            <button className="modal-close-btn" onClick={() => setSelectedBooking(null)}>
                                <X size={20} />
                            </button>
                        </div>

                        <div className="modal-body">
                            {detailLoading ? (
                                <div className="loading-skeleton">
                                    <div className="skeleton-row" />
                                    <div className="skeleton-row" />
                                </div>
                            ) : (
                                <div>
                                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", background: "rgba(255,255,255,0.03)", padding: "16px", borderRadius: "var(--admin-radius-md)", marginBottom: "18px" }}>
                                        <div>
                                            <div style={{ fontSize: "0.75rem", color: "var(--admin-text-sub)" }}>Customer</div>
                                            <div style={{ fontWeight: "700", color: "#ffffff" }}>{selectedBooking.customerId?.name}</div>
                                            <div style={{ fontSize: "0.8rem", color: "#cbd5e1" }}>{selectedBooking.customerId?.phone} • {selectedBooking.customerId?.email}</div>
                                        </div>
                                        <div>
                                            <div style={{ fontSize: "0.75rem", color: "var(--admin-text-sub)" }}>Assigned Service Provider</div>
                                            <div style={{ fontWeight: "700", color: selectedBooking.assignedProviderId ? "#86efac" : "#f59e0b" }}>
                                                {selectedBooking.assignedProviderId?.name || "Unassigned / Pending"}
                                            </div>
                                            {selectedBooking.assignedProviderId && (
                                                <div style={{ fontSize: "0.8rem", color: "#cbd5e1" }}>
                                                    {selectedBooking.assignedProviderId.phone} • {selectedBooking.assignedProviderId.Proffesion}
                                                </div>
                                            )}
                                        </div>
                                        <div>
                                            <div style={{ fontSize: "0.75rem", color: "var(--admin-text-sub)" }}>Service Address</div>
                                            <div style={{ color: "#cbd5e1", fontSize: "0.85rem" }}>{selectedBooking.address}</div>
                                        </div>
                                        <div>
                                            <div style={{ fontSize: "0.75rem", color: "var(--admin-text-sub)" }}>Schedule & Total</div>
                                            <div style={{ color: "#cbd5e1", fontSize: "0.85rem", fontWeight: "600" }}>
                                                {selectedBooking.preferredDate} at {selectedBooking.preferredTime} • ₹{selectedBooking.estimatedTotal}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Description and services */}
                                    <div style={{ marginBottom: "16px" }}>
                                        <h4 style={{ margin: "0 0 6px 0", color: "#ffffff", fontSize: "0.9rem" }}>Problem Description</h4>
                                        <p style={{ margin: 0, fontSize: "0.85rem", color: "#cbd5e1", background: "rgba(0,0,0,0.3)", padding: "10px 12px", borderRadius: "8px" }}>
                                            {selectedBooking.description || "No description provided."}
                                        </p>
                                    </div>

                                    {/* Dispatched Requests */}
                                    {bookingDetails?.requests?.length > 0 && (
                                        <div>
                                            <h4 style={{ margin: "0 0 8px 0", color: "#ffffff", fontSize: "0.9rem" }}>
                                                Dispatched Provider Requests ({bookingDetails.requests.length})
                                            </h4>
                                            <div style={{ display: "flex", flexDirection: "column", gap: "6px", maxHeight: "140px", overflowY: "auto" }}>
                                                {bookingDetails.requests.map((r) => (
                                                    <div
                                                        key={r._id}
                                                        style={{
                                                            display: "flex",
                                                            justifyContent: "space-between",
                                                            alignItems: "center",
                                                            padding: "8px 12px",
                                                            background: "rgba(255,255,255,0.02)",
                                                            border: "1px solid var(--admin-border)",
                                                            borderRadius: "6px",
                                                            fontSize: "0.8rem",
                                                        }}
                                                    >
                                                        <span>{r.providerId?.name} ({r.distanceKm?.toFixed(1) || 0} km away)</span>
                                                        <span className={`status-pill ${r.status}`}>{r.status}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="modal-footer">
                            <button className="btn-secondary" onClick={() => setSelectedBooking(null)}>
                                Close
                            </button>
                            <button
                                className="btn-primary"
                                onClick={() => {
                                    const b = selectedBooking;
                                    setSelectedBooking(null);
                                    handleOpenIntervention(b);
                                }}
                            >
                                <Edit3 size={14} /> Update Booking Status
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Admin Intervention Modal */}
            {interventionTarget && (
                <div className="modal-overlay" onClick={() => setInterventionTarget(null)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "500px" }}>
                        <div className="modal-header">
                            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                <Edit3 size={20} color="#04b204" />
                                <h2>Administrative Booking Intervention</h2>
                            </div>
                            <button className="modal-close-btn" onClick={() => setInterventionTarget(null)}>
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleInterventionSubmit}>
                            <div className="modal-body" style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                                {interventionError && (
                                    <div className="status-pill rejected" style={{ width: "100%", padding: "10px", borderRadius: "8px" }}>
                                        {interventionError}
                                    </div>
                                )}

                                <p style={{ margin: 0, fontSize: "0.875rem", color: "#cbd5e1" }}>
                                    Updating status for Booking <strong>#{interventionTarget._id.toString().slice(-6)}</strong> ({interventionTarget.services?.[0]?.name}).
                                </p>

                                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                                    <label style={{ fontSize: "0.825rem", color: "var(--admin-text-muted)", fontWeight: "600" }}>
                                        Target Booking Status
                                    </label>
                                    <select
                                        className="admin-select"
                                        value={newStatus}
                                        onChange={(e) => setNewStatus(e.target.value)}
                                    >
                                        <option value="pending">Pending</option>
                                        <option value="accepted">Accepted</option>
                                        <option value="in_progress">In Progress</option>
                                        <option value="completed">Completed</option>
                                        <option value="cancelled">Cancelled</option>
                                    </select>
                                </div>

                                {newStatus === "cancelled" && (
                                    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                                        <label style={{ fontSize: "0.8rem", color: "#fca5a5", fontWeight: "600" }}>
                                            Cancellation Reason:
                                        </label>
                                        <textarea
                                            rows={3}
                                            required
                                            value={cancellationReason}
                                            onChange={(e) => setCancellationReason(e.target.value)}
                                            className="search-input"
                                            style={{ height: "auto", padding: "10px" }}
                                            placeholder="Reason for administrative cancellation..."
                                        />
                                    </div>
                                )}
                            </div>

                            <div className="modal-footer">
                                <button type="button" className="btn-secondary" onClick={() => setInterventionTarget(null)}>
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="btn-primary"
                                    disabled={submittingIntervention}
                                >
                                    {submittingIntervention ? "Applying Changes..." : "Apply Status Override"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
