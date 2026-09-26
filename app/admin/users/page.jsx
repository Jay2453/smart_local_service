"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
    Users,
    Search,
    RefreshCw,
    Eye,
    UserX,
    UserCheck,
    AlertTriangle,
    X,
    ChevronLeft,
    ChevronRight,
} from "lucide-react";

export default function AdminUsersPage() {
    const [customers, setCustomers] = useState([]);
    const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // Modal state
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const [customerDetails, setCustomerDetails] = useState(null);

    // Confirmation dialog state for deactivation/reactivation
    const [actionTarget, setActionTarget] = useState(null); // { customer, action: 'deactivate' | 'reactivate' }
    const [actionReason, setActionReason] = useState("");
    const [actionSubmitting, setActionSubmitting] = useState(false);
    const [actionError, setActionError] = useState("");

    const fetchCustomers = useCallback(async (showLoading = false) => {
        if (showLoading) setLoading(true);
        try {
            const params = new URLSearchParams({
                page: pagination.page.toString(),
                limit: pagination.limit.toString(),
                status: statusFilter,
                search: search.trim(),
            });

            const res = await fetch(`/api/admin/users?${params.toString()}`);
            const data = await res.json();

            if (data.success) {
                setCustomers(data.customers || []);
                setPagination(data.pagination || { page: 1, limit: 10, total: 0, totalPages: 1 });
                setError("");
            } else {
                setError(data.message || "Failed to load customers.");
            }
        } catch (err) {
            console.error("Fetch customers error:", err);
            setError("Network error fetching customer records.");
        } finally {
            setLoading(false);
        }
    }, [pagination.page, pagination.limit, statusFilter, search]);

    useEffect(() => {
        let isMounted = true;
        const params = new URLSearchParams({
            page: pagination.page.toString(),
            limit: pagination.limit.toString(),
            status: statusFilter,
            search: search.trim(),
        });

        fetch(`/api/admin/users?${params.toString()}`)
            .then((res) => res.json())
            .then((data) => {
                if (isMounted) {
                    if (data.success) {
                        setCustomers(data.customers || []);
                        setPagination(data.pagination || { page: 1, limit: 10, total: 0, totalPages: 1 });
                        setError("");
                    } else {
                        setError(data.message || "Failed to load customers.");
                    }
                }
            })
            .catch((err) => {
                console.error("Fetch customers error:", err);
                if (isMounted) setError("Network error fetching customer records.");
            })
            .finally(() => {
                if (isMounted) setLoading(false);
            });

        return () => {
            isMounted = false;
        };
    }, [pagination.page, pagination.limit, statusFilter, search]);

    // View customer details modal
    const handleViewDetails = async (customer) => {
        setSelectedCustomer(customer);
        setDetailLoading(true);
        try {
            const res = await fetch(`/api/admin/users/${customer._id}`);
            const data = await res.json();
            if (data.success) {
                setCustomerDetails(data);
            }
        } catch (err) {
            console.error("Error fetching customer details:", err);
        } finally {
            setDetailLoading(false);
        }
    };

    // Execute status change
    const handleConfirmStatusChange = async (e) => {
        e.preventDefault();
        if (!actionTarget) return;

        setActionSubmitting(true);
        setActionError("");

        try {
            const res = await fetch(`/api/admin/users/${actionTarget.customer._id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action: actionTarget.action,
                    reason: actionReason.trim(),
                }),
            });

            const data = await res.json();

            if (!res.ok || !data.success) {
                setActionError(data.message || "Failed to update status.");
                setActionSubmitting(false);
                return;
            }

            // Success: update list and close modal
            setActionTarget(null);
            setActionReason("");
            fetchCustomers();
        } catch (err) {
            console.error("Status update error:", err);
            setActionError("Failed to communicate with server.");
        } finally {
            setActionSubmitting(false);
        }
    };

    return (
        <div>
            {/* Page Header */}
            <div className="page-header">
                <div className="page-header-info">
                    <h1>Customer Management</h1>
                    <p>Search, filter, inspect profiles, and manage customer account permissions.</p>
                </div>
                <div className="page-header-actions">
                    <button className="btn-secondary" onClick={fetchCustomers}>
                        <RefreshCw size={15} className={loading ? "spin" : ""} />
                        <span>Refresh</span>
                    </button>
                </div>
            </div>

            {/* Filter and Search Bar */}
            <div className="admin-card" style={{ padding: "16px 20px", marginBottom: "20px" }}>
                <div className="filter-bar" style={{ margin: 0 }}>
                    <div className="search-input-wrapper">
                        <Search size={16} className="search-icon" />
                        <input
                            type="text"
                            placeholder="Search by customer name, email, or mobile..."
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
                            <option value="all">All Customer Statuses</option>
                            <option value="active">Active Only</option>
                            <option value="deactivated">Deactivated Only</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Customers Data Table */}
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
                        <button className="btn-primary" onClick={fetchCustomers} style={{ marginTop: "12px" }}>
                            Try Again
                        </button>
                    </div>
                ) : customers.length === 0 ? (
                    <div className="empty-state">
                        <Users size={36} color="var(--admin-text-sub)" style={{ marginBottom: "12px" }} />
                        <h3>No Customers Found</h3>
                        <p>No customer accounts match your current filter and search query.</p>
                    </div>
                ) : (
                    <div>
                        <div className="table-responsive">
                            <table className="admin-table">
                                <thead>
                                    <tr>
                                        <th>Name</th>
                                        <th>Email</th>
                                        <th>Phone</th>
                                        <th>Status</th>
                                        <th>Bookings</th>
                                        <th>Joined Date</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {customers.map((customer) => {
                                        const isActive = customer.isActive !== false && customer.status !== "deactivated";
                                        return (
                                            <tr key={customer._id}>
                                                <td style={{ fontWeight: "600", color: "#ffffff" }}>
                                                    {customer.name}
                                                </td>
                                                <td>{customer.email}</td>
                                                <td style={{ fontFamily: "monospace" }}>{customer.phone}</td>
                                                <td>
                                                    <span className={`status-pill ${isActive ? "active" : "deactivated"}`}>
                                                        {isActive ? "Active" : "Deactivated"}
                                                    </span>
                                                </td>
                                                <td style={{ fontWeight: "600" }}>{customer.bookingCount || 0}</td>
                                                <td style={{ color: "var(--admin-text-sub)", fontSize: "0.8rem" }}>
                                                    {new Date(customer.createdAt).toLocaleDateString()}
                                                </td>
                                                <td>
                                                    <div style={{ display: "flex", gap: "6px" }}>
                                                        <button
                                                            className="btn-secondary"
                                                            style={{ padding: "6px 10px", fontSize: "0.75rem" }}
                                                            onClick={() => handleViewDetails(customer)}
                                                            title="View Profile & Bookings"
                                                        >
                                                            <Eye size={14} /> Details
                                                        </button>
                                                        {isActive ? (
                                                            <button
                                                                className="btn-danger"
                                                                style={{ padding: "6px 10px", fontSize: "0.75rem" }}
                                                                onClick={() => setActionTarget({ customer, action: "deactivate" })}
                                                                title="Deactivate Customer Account"
                                                            >
                                                                <UserX size={14} /> Deactivate
                                                            </button>
                                                        ) : (
                                                            <button
                                                                className="btn-success"
                                                                style={{ padding: "6px 10px", fontSize: "0.75rem" }}
                                                                onClick={() => setActionTarget({ customer, action: "reactivate" })}
                                                                title="Reactivate Customer Account"
                                                            >
                                                                <UserCheck size={14} /> Reactivate
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination Bar */}
                        <div className="pagination-bar">
                            <div className="pagination-info">
                                Showing Page {pagination.page} of {pagination.totalPages} ({pagination.total} total customers)
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

            {/* Customer Details Modal */}
            {selectedCustomer && (
                <div className="modal-overlay" onClick={() => setSelectedCustomer(null)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "700px" }}>
                        <div className="modal-header">
                            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                <Users size={22} color="#04b204" />
                                <h2>Customer Profile & Activity</h2>
                            </div>
                            <button className="modal-close-btn" onClick={() => setSelectedCustomer(null)}>
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
                                    {/* Profile Summary */}
                                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", background: "rgba(255,255,255,0.03)", padding: "16px", borderRadius: "var(--admin-radius-md)", marginBottom: "20px" }}>
                                        <div>
                                            <div style={{ fontSize: "0.75rem", color: "var(--admin-text-sub)" }}>Full Name</div>
                                            <div style={{ fontWeight: "700", color: "#ffffff", fontSize: "1.05rem" }}>{selectedCustomer.name}</div>
                                        </div>
                                        <div>
                                            <div style={{ fontSize: "0.75rem", color: "var(--admin-text-sub)" }}>Account Status</div>
                                            <span className={`status-pill ${selectedCustomer.isActive !== false ? "active" : "deactivated"}`}>
                                                {selectedCustomer.isActive !== false ? "Active Account" : "Deactivated"}
                                            </span>
                                        </div>
                                        <div>
                                            <div style={{ fontSize: "0.75rem", color: "var(--admin-text-sub)" }}>Email Address</div>
                                            <div style={{ color: "#cbd5e1", fontSize: "0.875rem" }}>{selectedCustomer.email}</div>
                                        </div>
                                        <div>
                                            <div style={{ fontSize: "0.75rem", color: "var(--admin-text-sub)" }}>Phone Number</div>
                                            <div style={{ color: "#cbd5e1", fontSize: "0.875rem", fontFamily: "monospace" }}>{selectedCustomer.phone}</div>
                                        </div>
                                    </div>

                                    {/* Booking History */}
                                    <h4 style={{ margin: "0 0 12px 0", color: "#ffffff", fontSize: "0.95rem" }}>
                                        Booking History ({customerDetails?.bookings?.length || 0})
                                    </h4>

                                    {customerDetails?.bookings?.length > 0 ? (
                                        <div style={{ display: "flex", flexDirection: "column", gap: "8px", maxHeight: "240px", overflowY: "auto" }}>
                                            {customerDetails.bookings.map((b) => (
                                                <div
                                                    key={b._id}
                                                    style={{
                                                        padding: "10px 14px",
                                                        background: "rgba(255,255,255,0.02)",
                                                        border: "1px solid var(--admin-border)",
                                                        borderRadius: "var(--admin-radius-md)",
                                                        display: "flex",
                                                        justifyContent: "space-between",
                                                        alignItems: "center",
                                                    }}
                                                >
                                                    <div>
                                                        <div style={{ fontWeight: "600", color: "#ffffff", fontSize: "0.85rem" }}>
                                                            {b.services?.[0]?.name || "Service"} • ₹{b.estimatedTotal}
                                                        </div>
                                                        <div style={{ fontSize: "0.75rem", color: "var(--admin-text-sub)" }}>
                                                            Provider: {b.assignedProviderId?.name || "Pending Dispatch"} • {new Date(b.createdAt).toLocaleDateString()}
                                                        </div>
                                                    </div>
                                                    <span className={`status-pill ${b.status}`}>{b.status.replace("_", " ")}</span>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p style={{ color: "var(--admin-text-sub)", fontSize: "0.85rem" }}>No service bookings requested by this customer yet.</p>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="modal-footer">
                            <button className="btn-secondary" onClick={() => setSelectedCustomer(null)}>
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Deactivation / Reactivation Confirmation Modal */}
            {actionTarget && (
                <div className="modal-overlay" onClick={() => setActionTarget(null)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "480px" }}>
                        <div className="modal-header">
                            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                <AlertTriangle size={22} color={actionTarget.action === "deactivate" ? "#ef4444" : "#10b981"} />
                                <h2>Confirm Customer {actionTarget.action === "deactivate" ? "Deactivation" : "Reactivation"}</h2>
                            </div>
                            <button className="modal-close-btn" onClick={() => setActionTarget(null)}>
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleConfirmStatusChange}>
                            <div className="modal-body" style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                                {actionError && (
                                    <div className="status-pill rejected" style={{ width: "100%", padding: "8px", borderRadius: "8px" }}>
                                        {actionError}
                                    </div>
                                )}
                                <p style={{ margin: 0, fontSize: "0.875rem", color: "#cbd5e1" }}>
                                    Are you sure you want to <strong>{actionTarget.action}</strong> the customer account for{" "}
                                    <strong>{actionTarget.customer.name}</strong> ({actionTarget.customer.email})?
                                </p>
                                {actionTarget.action === "deactivate" && (
                                    <div style={{ fontSize: "0.775rem", color: "#fca5a5" }}>
                                        Deactivated customers will be blocked from logging in until reactivated.
                                    </div>
                                )}
                                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                                    <label style={{ fontSize: "0.8rem", color: "var(--admin-text-muted)" }}>
                                        Reason for action (logged in audit trail):
                                    </label>
                                    <textarea
                                        rows={3}
                                        required={actionTarget.action === "deactivate"}
                                        value={actionReason}
                                        onChange={(e) => setActionReason(e.target.value)}
                                        className="search-input"
                                        style={{ height: "auto", padding: "10px" }}
                                        placeholder="e.g. Terms violation, customer requested temporary deactivation..."
                                    />
                                </div>
                            </div>

                            <div className="modal-footer">
                                <button type="button" className="btn-secondary" onClick={() => setActionTarget(null)}>
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className={actionTarget.action === "deactivate" ? "btn-danger" : "btn-success"}
                                    disabled={actionSubmitting}
                                >
                                    {actionSubmitting ? "Processing..." : `Confirm ${actionTarget.action === "deactivate" ? "Deactivation" : "Reactivation"}`}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
