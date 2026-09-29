"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
    Star,
    Search,
    RefreshCw,
    AlertTriangle,
    Shield,
    X,
    ChevronLeft,
    ChevronRight,
} from "lucide-react";

export default function AdminReviewsPage() {
    const [reviews, setReviews] = useState([]);
    const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0, totalPages: 1 });
    const [statusFilter, setStatusFilter] = useState("all");
    const [ratingFilter, setRatingFilter] = useState("");
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // Moderation Modal
    const [selectedReview, setSelectedReview] = useState(null);
    const [moderationStatus, setModerationStatus] = useState("visible");
    const [moderationReason, setModerationReason] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [modError, setModError] = useState("");

    const fetchReviews = useCallback(async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams({
                page: pagination.page.toString(),
                limit: pagination.limit.toString(),
                status: statusFilter,
                rating: ratingFilter,
                search: search.trim(),
            });

            const res = await fetch(`/api/admin/reviews?${params.toString()}`);
            const data = await res.json();

            if (data.success) {
                setReviews(data.reviews || []);
                setPagination(data.pagination || { page: 1, limit: 15, total: 0, totalPages: 1 });
                setError("");
            } else {
                setError(data.message || "Failed to load reviews.");
            }
        } catch (err) {
            console.error("Fetch reviews error:", err);
            setError("Network error fetching reviews.");
        } finally {
            setLoading(false);
        }
    }, [pagination.page, pagination.limit, statusFilter, ratingFilter, search]);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        fetchReviews();
    }, [fetchReviews]);

    const handleOpenModeration = (review) => {
        setSelectedReview(review);
        setModerationStatus(review.status || "visible");
        setModerationReason(review.moderationReason || "");
        setModError("");
    };

    const handleModerationSubmit = async (e) => {
        e.preventDefault();
        if (!selectedReview) return;

        setSubmitting(true);
        setModError("");

        try {
            const res = await fetch(`/api/admin/reviews/${selectedReview._id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    status: moderationStatus,
                    moderationReason: moderationReason.trim(),
                }),
            });

            const data = await res.json();

            if (!res.ok || !data.success) {
                setModError(data.message || "Failed to update review moderation status.");
                setSubmitting(false);
                return;
            }

            setSelectedReview(null);
            fetchReviews();
        } catch (err) {
            console.error("Moderate review error:", err);
            setModError("Server communication error.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div>
            {/* Header */}
            <div className="page-header">
                <div className="page-header-info">
                    <h1>Customer Reviews & Moderation</h1>
                    <p>Monitor platform feedback, investigate flagged comments, and manage public visibility.</p>
                </div>
                <div className="page-header-actions">
                    <button className="btn-secondary" onClick={fetchReviews}>
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
                            placeholder="Search review comments..."
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
                            <option value="all">All Moderation Statuses</option>
                            <option value="visible">Visible Only</option>
                            <option value="flagged">Flagged / Under Review</option>
                            <option value="hidden">Hidden / Removed</option>
                        </select>

                        <select
                            className="admin-select"
                            value={ratingFilter}
                            onChange={(e) => {
                                setRatingFilter(e.target.value);
                                setPagination((prev) => ({ ...prev, page: 1 }));
                            }}
                        >
                            <option value="">All Star Ratings</option>
                            <option value="5">5 Stars (Excellent)</option>
                            <option value="4">4 Stars</option>
                            <option value="3">3 Stars</option>
                            <option value="2">2 Stars</option>
                            <option value="1">1 Star (Critical)</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Reviews Table */}
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
                ) : reviews.length === 0 ? (
                    <div className="empty-state">
                        <Star size={36} color="var(--admin-text-sub)" />
                        <h3>No Reviews Found</h3>
                        <p>No customer reviews matched your search filters.</p>
                    </div>
                ) : (
                    <div>
                        <div className="table-responsive">
                            <table className="admin-table">
                                <thead>
                                    <tr>
                                        <th>Rating</th>
                                        <th>Customer</th>
                                        <th>Provider</th>
                                        <th>Comment</th>
                                        <th>Date</th>
                                        <th>Status</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {reviews.map((r) => (
                                        <tr key={r._id}>
                                            <td>
                                                <div style={{ display: "flex", alignItems: "center", gap: "4px", color: "#fbbf24", fontWeight: "700" }}>
                                                    <Star size={14} fill="#fbbf24" /> {r.rating} / 5
                                                </div>
                                            </td>
                                            <td>
                                                <div style={{ fontWeight: "600", color: "var(--admin-text-main)" }}>
                                                    {r.customerId?.name || "Customer"}
                                                </div>
                                            </td>
                                            <td>
                                                <div style={{ fontWeight: "600", color: "var(--admin-primary-darker)" }}>
                                                    {r.providerId?.name || "Provider"}
                                                </div>
                                                <div style={{ fontSize: "0.75rem", color: "var(--admin-text-sub)" }}>
                                                    {r.providerId?.Proffesion}
                                                </div>
                                            </td>
                                            <td style={{ maxWidth: "300px" }}>
                                                <div style={{ fontSize: "0.85rem", color: "var(--admin-text-body)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                                    {r.comment || "(No text comment provided)"}
                                                </div>
                                            </td>
                                            <td style={{ fontSize: "0.8rem", color: "var(--admin-text-sub)" }}>
                                                {new Date(r.createdAt).toLocaleDateString()}
                                            </td>
                                            <td>
                                                <span className={`status-pill ${r.status || "visible"}`}>
                                                    {r.status || "visible"}
                                                </span>
                                            </td>
                                            <td>
                                                <button
                                                    className="btn-secondary"
                                                    style={{ padding: "6px 12px", fontSize: "0.75rem" }}
                                                    onClick={() => handleOpenModeration(r)}
                                                >
                                                    <Shield size={14} /> Moderate
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
                                Showing Page {pagination.page} of {pagination.totalPages} ({pagination.total} total reviews)
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

            {/* Moderation Modal */}
            {selectedReview && (
                <div className="modal-overlay" onClick={() => setSelectedReview(null)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "540px" }}>
                        <div className="modal-header">
                            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                <Shield size={20} color="#04b204" />
                                <h2>Review Moderation Action</h2>
                            </div>
                            <button className="modal-close-btn" onClick={() => setSelectedReview(null)}>
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleModerationSubmit}>
                            <div className="modal-body" style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                                {modError && (
                                    <div className="status-pill rejected" style={{ width: "100%", padding: "10px", borderRadius: "8px" }}>
                                        {modError}
                                    </div>
                                )}

                                <div style={{ background: "var(--admin-card-inner)", border: "1px solid var(--admin-border)", padding: "14px", borderRadius: "var(--admin-radius-md)" }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                                        <div style={{ fontWeight: "700", color: "var(--admin-text-main)" }}>
                                            {selectedReview.customerId?.name} → {selectedReview.providerId?.name}
                                        </div>
                                        <div style={{ color: "#d97706", fontWeight: "700" }}>
                                            ★ {selectedReview.rating} / 5
                                        </div>
                                    </div>
                                    <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--admin-text-body)", fontStyle: "italic" }}>
                                        &quot;{selectedReview.comment || "No comment"}&quot;
                                    </p>
                                </div>

                                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                                    <label style={{ fontSize: "0.825rem", color: "var(--admin-text-muted)", fontWeight: "600" }}>
                                        Moderation Visibility Status
                                    </label>
                                    <select
                                        className="admin-select"
                                        value={moderationStatus}
                                        onChange={(e) => setModerationStatus(e.target.value)}
                                    >
                                        <option value="visible">Visible (Approved on Public Profile)</option>
                                        <option value="flagged">Flagged (Under Investigation)</option>
                                        <option value="hidden">Hidden (Removed for Policy Violation)</option>
                                    </select>
                                </div>

                                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                                    <label style={{ fontSize: "0.8rem", color: "var(--admin-text-muted)" }}>
                                        Moderation Reason (logged in audit log):
                                    </label>
                                    <textarea
                                        rows={3}
                                        value={moderationReason}
                                        onChange={(e) => setModerationReason(e.target.value)}
                                        className="search-input"
                                        style={{ height: "auto", padding: "10px" }}
                                        placeholder="Reason for visibility decision..."
                                    />
                                </div>
                            </div>

                            <div className="modal-footer">
                                <button type="button" className="btn-secondary" onClick={() => setSelectedReview(null)}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn-primary" disabled={submitting}>
                                    {submitting ? "Saving..." : "Apply Moderation"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
