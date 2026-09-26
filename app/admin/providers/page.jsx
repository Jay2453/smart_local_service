"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
    Wrench,
    Search,
    RefreshCw,
    Eye,
    ShieldCheck,
    Star,
    AlertTriangle,
    X,
    ChevronLeft,
    ChevronRight,
    UserX,
    UserCheck,
} from "lucide-react";

export default function AdminProvidersPage() {
    const [providers, setProviders] = useState([]);
    const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
    const [search, setSearch] = useState("");
    const [verificationFilter, setVerificationFilter] = useState("all");
    const [statusFilter, setStatusFilter] = useState("all");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // Details Modal
    const [selectedProvider, setSelectedProvider] = useState(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const [providerDetails, setProviderDetails] = useState(null);

    // Suspension Action Modal
    const [actionTarget, setActionTarget] = useState(null); // { provider, action: 'suspend' | 'reactivate' }
    const [actionReason, setActionReason] = useState("");
    const [actionSubmitting, setActionSubmitting] = useState(false);
    const [actionError, setActionError] = useState("");

    const fetchProviders = useCallback(async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams({
                page: pagination.page.toString(),
                limit: pagination.limit.toString(),
                verificationStatus: verificationFilter,
                status: statusFilter,
                search: search.trim(),
            });

            const res = await fetch(`/api/admin/providers?${params.toString()}`);
            const data = await res.json();

            if (data.success) {
                setProviders(data.providers || []);
                setPagination(data.pagination || { page: 1, limit: 10, total: 0, totalPages: 1 });
                setError("");
            } else {
                setError(data.message || "Failed to load providers.");
            }
        } catch (err) {
            console.error("Fetch providers error:", err);
            setError("Network error connecting to database.");
        } finally {
            setLoading(false);
        }
    }, [pagination.page, pagination.limit, verificationFilter, statusFilter, search]);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        fetchProviders();
    }, [fetchProviders]);

    const handleViewDetails = async (provider) => {
        setSelectedProvider(provider);
        setDetailLoading(true);
        try {
            const res = await fetch(`/api/admin/providers/${provider._id}`);
            const data = await res.json();
            if (data.success) {
                setProviderDetails(data);
            }
        } catch (err) {
            console.error("Error loading provider details:", err);
        } finally {
            setDetailLoading(false);
        }
    };

    const handleConfirmSuspension = async (e) => {
        e.preventDefault();
        if (!actionTarget) return;

        setActionSubmitting(true);
        setActionError("");

        try {
            const res = await fetch(`/api/admin/providers/${actionTarget.provider._id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action: actionTarget.action,
                    reason: actionReason.trim(),
                }),
            });

            const data = await res.json();

            if (!res.ok || !data.success) {
                setActionError(data.message || "Failed to update suspension status.");
                setActionSubmitting(false);
                return;
            }

            setActionTarget(null);
            setActionReason("");
            fetchProviders();
        } catch (err) {
            console.error("Suspension error:", err);
            setActionError("Failed to communicate with server.");
        } finally {
            setActionSubmitting(false);
        }
    };

    return (
        <div>
            {/* Header */}
            <div className="page-header">
                <div className="page-header-info">
                    <h1>Service Provider Management</h1>
                    <p>Track verified professionals, inspect credentials, ratings, and manage suspensions.</p>
                </div>
                <div className="page-header-actions">
                    <Link href="/admin/providers/verification" className="btn-primary">
                        <ShieldCheck size={16} /> Verification Queue
                    </Link>
                    <button className="btn-secondary" onClick={fetchProviders}>
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
                            placeholder="Search provider name, profession, email, address..."
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
                            value={verificationFilter}
                            onChange={(e) => {
                                setVerificationFilter(e.target.value);
                                setPagination((prev) => ({ ...prev, page: 1 }));
                            }}
                        >
                            <option value="all">All Verifications</option>
                            <option value="verified">Verified Only</option>
                            <option value="pending">Pending Review</option>
                            <option value="rejected">Rejected</option>
                        </select>

                        <select
                            className="admin-select"
                            value={statusFilter}
                            onChange={(e) => {
                                setStatusFilter(e.target.value);
                                setPagination((prev) => ({ ...prev, page: 1 }));
                            }}
                        >
                            <option value="all">All Statuses</option>
                            <option value="active">Active Only</option>
                            <option value="suspended">Suspended Only</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Table Card */}
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
                        <button className="btn-primary" onClick={fetchProviders} style={{ marginTop: "12px" }}>
                            Try Again
                        </button>
                    </div>
                ) : providers.length === 0 ? (
                    <div className="empty-state">
                        <Wrench size={36} color="var(--admin-text-sub)" style={{ marginBottom: "12px" }} />
                        <h3>No Service Providers Found</h3>
                        <p>No providers matched your current search and filter criteria.</p>
                    </div>
                ) : (
                    <div>
                        <div className="table-responsive">
                            <table className="admin-table">
                                <thead>
                                    <tr>
                                        <th>Provider</th>
                                        <th>Profession</th>
                                        <th>Experience</th>
                                        <th>Verification</th>
                                        <th>Status</th>
                                        <th>Rating</th>
                                        <th>Completed Jobs</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {providers.map((p) => {
                                        const isSuspended = p.isSuspended === true || p.status === "suspended";
                                        return (
                                            <tr key={p._id}>
                                                <td>
                                                    <div style={{ fontWeight: "600", color: "#ffffff" }}>{p.name}</div>
                                                    <div style={{ fontSize: "0.75rem", color: "var(--admin-text-sub)", fontFamily: "monospace" }}>
                                                        {p.phone} • {p.email}
                                                    </div>
                                                </td>
                                                <td style={{ textTransform: "capitalize", fontWeight: "500" }}>{p.Proffesion}</td>
                                                <td>{p.Experience}</td>
                                                <td>
                                                    <span className={`status-pill ${p.verificationStatus || "pending"}`}>
                                                        {p.verificationStatus || "pending"}
                                                    </span>
                                                </td>
                                                <td>
                                                    <span className={`status-pill ${isSuspended ? "suspended" : "active"}`}>
                                                        {isSuspended ? "Suspended" : "Active"}
                                                    </span>
                                                </td>
                                                <td>
                                                    <div style={{ display: "flex", alignItems: "center", gap: "4px", color: "#fbbf24", fontWeight: "600" }}>
                                                        <Star size={14} fill="#fbbf24" /> {p.rating?.toFixed(1) || "5.0"}
                                                    </div>
                                                </td>
                                                <td style={{ fontWeight: "600" }}>{p.stats?.completedJobs || 0}</td>
                                                <td>
                                                    <div style={{ display: "flex", gap: "6px" }}>
                                                        <button
                                                            className="btn-secondary"
                                                            style={{ padding: "6px 10px", fontSize: "0.75rem" }}
                                                            onClick={() => handleViewDetails(p)}
                                                        >
                                                            <Eye size={14} /> Details
                                                        </button>
                                                        {isSuspended ? (
                                                            <button
                                                                className="btn-success"
                                                                style={{ padding: "6px 10px", fontSize: "0.75rem" }}
                                                                onClick={() => setActionTarget({ provider: p, action: "reactivate" })}
                                                            >
                                                                <UserCheck size={14} /> Reactivate
                                                            </button>
                                                        ) : (
                                                            <button
                                                                className="btn-danger"
                                                                style={{ padding: "6px 10px", fontSize: "0.75rem" }}
                                                                onClick={() => setActionTarget({ provider: p, action: "suspend" })}
                                                            >
                                                                <UserX size={14} /> Suspend
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
                                Page {pagination.page} of {pagination.totalPages} ({pagination.total} total providers)
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

            {/* Provider Details Modal */}
            {selectedProvider && (
                <div className="modal-overlay" onClick={() => setSelectedProvider(null)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "720px" }}>
                        <div className="modal-header">
                            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                <Wrench size={22} color="#04b204" />
                                <h2>Service Provider Dossier</h2>
                            </div>
                            <button className="modal-close-btn" onClick={() => setSelectedProvider(null)}>
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
                                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", background: "rgba(255,255,255,0.03)", padding: "16px", borderRadius: "var(--admin-radius-md)", marginBottom: "20px" }}>
                                        <div>
                                            <div style={{ fontSize: "0.75rem", color: "var(--admin-text-sub)" }}>Provider Name</div>
                                            <div style={{ fontWeight: "700", color: "#ffffff", fontSize: "1.1rem" }}>{selectedProvider.name}</div>
                                        </div>
                                        <div>
                                            <div style={{ fontSize: "0.75rem", color: "var(--admin-text-sub)" }}>Profession / Category</div>
                                            <div style={{ textTransform: "capitalize", fontWeight: "600", color: "#86efac" }}>{selectedProvider.Proffesion}</div>
                                        </div>
                                        <div>
                                            <div style={{ fontSize: "0.75rem", color: "var(--admin-text-sub)" }}>Contact Phone & Email</div>
                                            <div style={{ color: "#cbd5e1", fontSize: "0.85rem" }}>{selectedProvider.phone} • {selectedProvider.email}</div>
                                        </div>
                                        <div>
                                            <div style={{ fontSize: "0.75rem", color: "var(--admin-text-sub)" }}>Service Radius & Experience</div>
                                            <div style={{ color: "#cbd5e1", fontSize: "0.85rem" }}>{selectedProvider.ServiceRadius} • {selectedProvider.Experience}</div>
                                        </div>
                                        <div>
                                            <div style={{ fontSize: "0.75rem", color: "var(--admin-text-sub)" }}>Address / Base Location</div>
                                            <div style={{ color: "#cbd5e1", fontSize: "0.85rem" }}>{selectedProvider.address}</div>
                                        </div>
                                        <div>
                                            <div style={{ fontSize: "0.75rem", color: "var(--admin-text-sub)" }}>Verification & Online</div>
                                            <div style={{ display: "flex", gap: "8px", marginTop: "4px" }}>
                                                <span className={`status-pill ${selectedProvider.verificationStatus}`}>
                                                    {selectedProvider.verificationStatus}
                                                </span>
                                                <span className={`status-pill ${selectedProvider.isOnline ? "active" : "na"}`}>
                                                    {selectedProvider.isOnline ? "Online" : "Offline"}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Assigned Jobs Summary */}
                                    <h4 style={{ margin: "0 0 10px 0", color: "#ffffff", fontSize: "0.95rem" }}>
                                        Assigned Bookings ({providerDetails?.bookings?.length || 0})
                                    </h4>
                                    {providerDetails?.bookings?.length > 0 ? (
                                        <div style={{ display: "flex", flexDirection: "column", gap: "8px", maxHeight: "200px", overflowY: "auto", marginBottom: "16px" }}>
                                            {providerDetails.bookings.map((b) => (
                                                <div
                                                    key={b._id}
                                                    style={{
                                                        padding: "10px 12px",
                                                        background: "rgba(255,255,255,0.02)",
                                                        border: "1px solid var(--admin-border)",
                                                        borderRadius: "var(--admin-radius-md)",
                                                        display: "flex",
                                                        justifyContent: "space-between",
                                                        alignItems: "center",
                                                        fontSize: "0.85rem",
                                                    }}
                                                >
                                                    <div>
                                                        <span style={{ fontWeight: "600", color: "#ffffff" }}>{b.services?.[0]?.name}</span> • ₹{b.estimatedTotal} • {b.customerId?.name}
                                                    </div>
                                                    <span className={`status-pill ${b.status}`}>{b.status.replace("_", " ")}</span>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p style={{ color: "var(--admin-text-sub)", fontSize: "0.85rem", marginBottom: "16px" }}>No assigned jobs on record.</p>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="modal-footer">
                            <button className="btn-secondary" onClick={() => setSelectedProvider(null)}>
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Suspend / Reactivate Modal */}
            {actionTarget && (
                <div className="modal-overlay" onClick={() => setActionTarget(null)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "480px" }}>
                        <div className="modal-header">
                            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                <AlertTriangle size={22} color={actionTarget.action === "suspend" ? "#ef4444" : "#10b981"} />
                                <h2>Confirm Provider {actionTarget.action === "suspend" ? "Suspension" : "Reactivation"}</h2>
                            </div>
                            <button className="modal-close-btn" onClick={() => setActionTarget(null)}>
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleConfirmSuspension}>
                            <div className="modal-body" style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                                {actionError && (
                                    <div className="status-pill rejected" style={{ width: "100%", padding: "8px", borderRadius: "8px" }}>
                                        {actionError}
                                    </div>
                                )}
                                <p style={{ margin: 0, fontSize: "0.875rem", color: "#cbd5e1" }}>
                                    Are you sure you want to <strong>{actionTarget.action}</strong> provider{" "}
                                    <strong>{actionTarget.provider.name}</strong> ({actionTarget.provider.Proffesion})?
                                </p>
                                {actionTarget.action === "suspend" && (
                                    <div style={{ fontSize: "0.775rem", color: "#fca5a5" }}>
                                        Suspended providers cannot receive new booking requests or log into the provider console.
                                    </div>
                                )}
                                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                                    <label style={{ fontSize: "0.8rem", color: "var(--admin-text-muted)" }}>
                                        Reason for action (logged in audit log):
                                    </label>
                                    <textarea
                                        rows={3}
                                        required={actionTarget.action === "suspend"}
                                        value={actionReason}
                                        onChange={(e) => setActionReason(e.target.value)}
                                        className="search-input"
                                        style={{ height: "auto", padding: "10px" }}
                                        placeholder="e.g. Quality violation, customer dispute pending, identity issues..."
                                    />
                                </div>
                            </div>

                            <div className="modal-footer">
                                <button type="button" className="btn-secondary" onClick={() => setActionTarget(null)}>
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className={actionTarget.action === "suspend" ? "btn-danger" : "btn-success"}
                                    disabled={actionSubmitting}
                                >
                                    {actionSubmitting ? "Processing..." : `Confirm ${actionTarget.action === "suspend" ? "Suspension" : "Reactivation"}`}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
