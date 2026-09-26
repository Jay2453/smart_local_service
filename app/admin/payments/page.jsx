"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
    DollarSign,
    RefreshCw,
    AlertTriangle,
    CheckCircle2,
    ArrowDownRight,
    ArrowUpRight,
    X,
    ChevronLeft,
    ChevronRight,
    CreditCard,
} from "lucide-react";

export default function AdminPaymentsPage() {
    const [payments, setPayments] = useState([]);
    const [summary, setSummary] = useState(null);
    const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0, totalPages: 1 });
    const [statusFilter, setStatusFilter] = useState("all");
    const [payoutFilter, setPayoutFilter] = useState("all");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // Refund Modal
    const [refundTarget, setRefundTarget] = useState(null);
    const [refundAmount, setRefundAmount] = useState("");
    const [refundReason, setRefundReason] = useState("");
    const [refundSubmitting, setRefundSubmitting] = useState(false);
    const [refundError, setRefundError] = useState("");

    // Payout Modal
    const [payoutTarget, setPayoutTarget] = useState(null);
    const [payoutStatus, setPayoutStatus] = useState("processed");
    const [payoutSubmitting, setPayoutSubmitting] = useState(false);
    const [payoutError, setPayoutError] = useState("");

    const fetchPayments = useCallback(async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams({
                page: pagination.page.toString(),
                limit: pagination.limit.toString(),
                status: statusFilter,
                payoutStatus: payoutFilter,
            });

            const res = await fetch(`/api/admin/payments?${params.toString()}`);
            const data = await res.json();

            if (data.success) {
                setPayments(data.payments || []);
                setSummary(data.summary || null);
                setPagination(data.pagination || { page: 1, limit: 15, total: 0, totalPages: 1 });
                setError("");
            } else {
                setError(data.message || "Failed to load financial records.");
            }
        } catch (err) {
            console.error("Fetch payments error:", err);
            setError("Network error fetching payment records.");
        } finally {
            setLoading(false);
        }
    }, [pagination.page, pagination.limit, statusFilter, payoutFilter]);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        fetchPayments();
    }, [fetchPayments]);

    const handleOpenRefund = (p) => {
        setRefundTarget(p);
        setRefundAmount(p.amount.toString());
        setRefundReason("");
        setRefundError("");
    };

    const handleRefundSubmit = async (e) => {
        e.preventDefault();
        if (!refundTarget) return;

        setRefundSubmitting(true);
        setRefundError("");

        try {
            const res = await fetch("/api/admin/payments", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    paymentId: refundTarget._id,
                    action: "refund",
                    refundAmount: Number(refundAmount),
                    refundReason: refundReason.trim(),
                }),
            });

            const data = await res.json();

            if (!res.ok || !data.success) {
                setRefundError(data.message || "Failed to process refund.");
                setRefundSubmitting(false);
                return;
            }

            setRefundTarget(null);
            fetchPayments();
        } catch (err) {
            console.error("Refund submit error:", err);
            setRefundError("Communication error with server.");
        } finally {
            setRefundSubmitting(false);
        }
    };

    const handleOpenPayout = (p) => {
        setPayoutTarget(p);
        setPayoutStatus("processed");
        setPayoutError("");
    };

    const handlePayoutSubmit = async (e) => {
        e.preventDefault();
        if (!payoutTarget) return;

        setPayoutSubmitting(true);
        setPayoutError("");

        try {
            const res = await fetch("/api/admin/payments", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    paymentId: payoutTarget._id,
                    action: "payout",
                    payoutStatus,
                }),
            });

            const data = await res.json();

            if (!res.ok || !data.success) {
                setPayoutError(data.message || "Failed to update payout status.");
                setPayoutSubmitting(false);
                return;
            }

            setPayoutTarget(null);
            fetchPayments();
        } catch (err) {
            console.error("Payout submit error:", err);
            setPayoutError("Communication error with server.");
        } finally {
            setPayoutSubmitting(false);
        }
    };

    return (
        <div>
            {/* Header */}
            <div className="page-header">
                <div className="page-header-info">
                    <h1>Platform Financials & Transactions</h1>
                    <p>Track payments, revenue calculations, provider payouts, and refund processing.</p>
                </div>
                <div className="page-header-actions">
                    <button className="btn-secondary" onClick={fetchPayments}>
                        <RefreshCw size={15} className={loading ? "spin" : ""} />
                        <span>Refresh Financials</span>
                    </button>
                </div>
            </div>

            {/* Financial Summaries */}
            {summary && (
                <div className="stat-grid">
                    <div className="stat-card">
                        <div className="stat-card-header">
                            <span className="stat-label">Gross Transaction Volume</span>
                            <div className="stat-icon-wrapper" style={{ background: "rgba(4, 178, 4, 0.15)", color: "#04b204" }}>
                                <DollarSign size={18} />
                            </div>
                        </div>
                        <div className="stat-value" style={{ color: "#04b204" }}>₹{summary.totalGrossRevenue?.toLocaleString()}</div>
                        <div className="stat-subtext">Total Processed Payments</div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-card-header">
                            <span className="stat-label">Platform Commission (10%)</span>
                            <div className="stat-icon-wrapper" style={{ background: "rgba(16, 185, 129, 0.15)", color: "#10b981" }}>
                                <ArrowDownRight size={18} />
                            </div>
                        </div>
                        <div className="stat-value" style={{ color: "#10b981" }}>₹{summary.totalCommissionEarned?.toLocaleString()}</div>
                        <div className="stat-subtext">Retained Platform Revenue</div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-card-header">
                            <span className="stat-label">Pending Provider Payouts</span>
                            <div className="stat-icon-wrapper" style={{ background: "rgba(245, 158, 11, 0.15)", color: "#f59e0b" }}>
                                <ArrowUpRight size={18} />
                            </div>
                        </div>
                        <div className="stat-value" style={{ color: "#f59e0b" }}>₹{summary.pendingPayoutAmount?.toLocaleString()}</div>
                        <div className="stat-subtext">Awaiting Disbursement</div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-card-header">
                            <span className="stat-label">Total Transactions</span>
                            <div className="stat-icon-wrapper" style={{ background: "rgba(14, 165, 233, 0.15)", color: "#0ea5e9" }}>
                                <CreditCard size={18} />
                            </div>
                        </div>
                        <div className="stat-value">{summary.totalTransactions}</div>
                        <div className="stat-subtext">Orders Completed</div>
                    </div>
                </div>
            )}

            {/* Filter Bar */}
            <div className="admin-card" style={{ padding: "16px 20px", marginBottom: "20px" }}>
                <div className="filter-bar" style={{ margin: 0 }}>
                    <div style={{ fontSize: "0.9rem", fontWeight: "600", color: "#ffffff" }}>
                        Transaction Ledger Filters
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
                            <option value="all">All Payment Statuses</option>
                            <option value="completed">Completed</option>
                            <option value="pending">Pending</option>
                            <option value="refunded">Refunded</option>
                        </select>

                        <select
                            className="admin-select"
                            value={payoutFilter}
                            onChange={(e) => {
                                setPayoutFilter(e.target.value);
                                setPagination((prev) => ({ ...prev, page: 1 }));
                            }}
                        >
                            <option value="all">All Payout Statuses</option>
                            <option value="pending">Pending Payout</option>
                            <option value="processed">Processed Payout</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Transactions Table */}
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
                ) : payments.length === 0 ? (
                    <div className="empty-state">
                        <DollarSign size={36} color="var(--admin-text-sub)" />
                        <h3>No Payment Records Found</h3>
                        <p>No transactions match your current query or financial filters.</p>
                    </div>
                ) : (
                    <div>
                        <div className="table-responsive">
                            <table className="admin-table">
                                <thead>
                                    <tr>
                                        <th>ID / Booking</th>
                                        <th>Customer</th>
                                        <th>Provider</th>
                                        <th>Amount</th>
                                        <th>Method</th>
                                        <th>Payment Status</th>
                                        <th>Payout Status</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {payments.map((p) => (
                                        <tr key={p._id}>
                                            <td style={{ fontFamily: "monospace", color: "var(--admin-text-sub)" }}>
                                                #{p._id.toString().slice(-6)}
                                            </td>
                                            <td>
                                                <div style={{ fontWeight: "600", color: "#ffffff" }}>
                                                    {p.customerId?.name || "Customer"}
                                                </div>
                                            </td>
                                            <td>
                                                <div style={{ fontWeight: "600", color: "#86efac" }}>
                                                    {p.providerId?.name || "Provider"}
                                                </div>
                                            </td>
                                            <td style={{ fontWeight: "700", color: "#ffffff" }}>
                                                ₹{p.amount}
                                            </td>
                                            <td style={{ textTransform: "uppercase", fontSize: "0.75rem", fontWeight: "600" }}>
                                                {p.method}
                                            </td>
                                            <td>
                                                <span className={`status-pill ${p.status}`}>
                                                    {p.status}
                                                </span>
                                            </td>
                                            <td>
                                                <span className={`status-pill ${p.payoutStatus || "pending"}`}>
                                                    {p.payoutStatus || "pending"}
                                                </span>
                                            </td>
                                            <td>
                                                <div style={{ display: "flex", gap: "6px" }}>
                                                    {p.status === "completed" && p.refundStatus !== "processed" && (
                                                        <button
                                                            className="btn-danger"
                                                            style={{ padding: "5px 10px", fontSize: "0.75rem" }}
                                                            onClick={() => handleOpenRefund(p)}
                                                        >
                                                            Refund
                                                        </button>
                                                    )}
                                                    {p.payoutStatus === "pending" && p.status === "completed" && (
                                                        <button
                                                            className="btn-success"
                                                            style={{ padding: "5px 10px", fontSize: "0.75rem" }}
                                                            onClick={() => handleOpenPayout(p)}
                                                        >
                                                            Disburse
                                                        </button>
                                                    )}
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
                                Page {pagination.page} of {pagination.totalPages} ({pagination.total} transactions)
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

            {/* Refund Modal */}
            {refundTarget && (
                <div className="modal-overlay" onClick={() => setRefundTarget(null)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "500px" }}>
                        <div className="modal-header">
                            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                <AlertTriangle size={20} color="#ef4444" />
                                <h2>Process Customer Refund</h2>
                            </div>
                            <button className="modal-close-btn" onClick={() => setRefundTarget(null)}>
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleRefundSubmit}>
                            <div className="modal-body" style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                                {refundError && (
                                    <div className="status-pill rejected" style={{ width: "100%", padding: "8px", borderRadius: "8px" }}>
                                        {refundError}
                                    </div>
                                )}

                                <p style={{ margin: 0, fontSize: "0.85rem", color: "#cbd5e1" }}>
                                    Refunding customer <strong>{refundTarget.customerId?.name}</strong> for payment #{refundTarget._id.toString().slice(-6)}. Total order value: ₹{refundTarget.amount}.
                                </p>

                                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                                    <label style={{ fontSize: "0.8rem", color: "var(--admin-text-muted)", fontWeight: "600" }}>Refund Amount (₹)</label>
                                    <input
                                        type="number"
                                        required
                                        min="1"
                                        max={refundTarget.amount}
                                        value={refundAmount}
                                        onChange={(e) => setRefundAmount(e.target.value)}
                                        className="search-input"
                                    />
                                </div>

                                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                                    <label style={{ fontSize: "0.8rem", color: "var(--admin-text-muted)", fontWeight: "600" }}>Refund Justification</label>
                                    <textarea
                                        rows={3}
                                        required
                                        value={refundReason}
                                        onChange={(e) => setRefundReason(e.target.value)}
                                        className="search-input"
                                        style={{ height: "auto", padding: "10px" }}
                                        placeholder="Reason for financial reversal..."
                                    />
                                </div>
                            </div>

                            <div className="modal-footer">
                                <button type="button" className="btn-secondary" onClick={() => setRefundTarget(null)}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn-danger" disabled={refundSubmitting}>
                                    {refundSubmitting ? "Processing Refund..." : "Authorize Refund"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Payout Modal */}
            {payoutTarget && (
                <div className="modal-overlay" onClick={() => setPayoutTarget(null)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "480px" }}>
                        <div className="modal-header">
                            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                <CheckCircle2 size={20} color="#10b981" />
                                <h2>Confirm Provider Payout Disbursement</h2>
                            </div>
                            <button className="modal-close-btn" onClick={() => setPayoutTarget(null)}>
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handlePayoutSubmit}>
                            <div className="modal-body" style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                                {payoutError && (
                                    <div className="status-pill rejected" style={{ width: "100%", padding: "8px", borderRadius: "8px" }}>
                                        {payoutError}
                                    </div>
                                )}

                                <p style={{ margin: 0, fontSize: "0.85rem", color: "#cbd5e1" }}>
                                    Disburse payout to provider <strong>{payoutTarget.providerId?.name}</strong> for Booking #{payoutTarget.bookingId?.toString().slice(-6) || "Order"}. Payout amount: <strong>₹{payoutTarget.providerPayoutAmount || Math.round(payoutTarget.amount * 0.9)}</strong>.
                                </p>
                            </div>

                            <div className="modal-footer">
                                <button type="button" className="btn-secondary" onClick={() => setPayoutTarget(null)}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn-success" disabled={payoutSubmitting}>
                                    {payoutSubmitting ? "Processing..." : "Confirm Payout Release"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
