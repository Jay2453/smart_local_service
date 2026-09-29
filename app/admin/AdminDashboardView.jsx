"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
    Users,
    Wrench,
    Calendar,
    DollarSign,
    AlertTriangle,
    ArrowUpRight,
    RefreshCw,
} from "lucide-react";

export default function AdminDashboardView() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState("");

    const fetchDashboard = useCallback(async () => {
        try {
            setRefreshing(true);
            const res = await fetch("/api/admin/dashboard");
            const json = await res.json();
            if (json.success) {
                setData(json);
                setError("");
            } else {
                setError(json.message || "Failed to load dashboard metrics.");
            }
        } catch (err) {
            console.error("Dashboard fetch error:", err);
            setError("Network error connecting to administration server.");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        fetchDashboard();
    }, [fetchDashboard]);

    const stats = data?.stats;
    const recentActivity = data?.recentActivity;

    if (loading) {
        return (
            <div className="admin-card">
                <div className="loading-skeleton">
                    <div className="skeleton-row" style={{ width: "40%" }} />
                    <div className="skeleton-row" />
                    <div className="skeleton-row" />
                    <div className="skeleton-row" />
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="admin-card">
                <div className="empty-state">
                    <div className="empty-state-icon" style={{ background: "rgba(239, 68, 68, 0.15)", color: "#ef4444" }}>
                        <AlertTriangle size={28} />
                    </div>
                    <h3 style={{ color: "var(--admin-text-main)", marginBottom: "8px" }}>Unable to Load Dashboard Data</h3>
                    <p style={{ color: "var(--admin-text-muted)", marginBottom: "20px" }}>{error}</p>
                    <button className="btn-primary" onClick={fetchDashboard}>
                        <RefreshCw size={16} /> Retry Connection
                    </button>
                </div>
            </div>
        );
    }

    // Pending Action Counts
    const pendingVerifications = stats?.providers?.pending || 0;
    const pendingBookings = stats?.bookings?.pending || 0;
    const openSupport = stats?.support?.open || 0;
    const hasPendingActions = pendingVerifications > 0 || pendingBookings > 0 || openSupport > 0;

    return (
        <div>
            {/* Header */}
            <div className="page-header">
                <div className="page-header-info">
                    <h1>Executive Command Center</h1>
                    <p>Real-time database statistics, operational metrics, and platform activities.</p>
                </div>
                <div className="page-header-actions">
                    <button
                        className="btn-secondary"
                        onClick={fetchDashboard}
                        disabled={refreshing}
                    >
                        <RefreshCw size={15} className={refreshing ? "spin" : ""} />
                        <span>{refreshing ? "Refreshing..." : "Refresh Data"}</span>
                    </button>
                </div>
            </div>

            {/* Action Required Banner */}
            {hasPendingActions && (
                <div
                    style={{
                        background: "var(--admin-warning-bg)",
                        border: "1px solid var(--admin-warning-border)",
                        borderRadius: "var(--admin-radius-lg)",
                        padding: "16px 20px",
                        marginBottom: "24px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        flexWrap: "wrap",
                        gap: "12px",
                    }}
                >
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <div style={{ padding: "8px", background: "#FEF3C7", borderRadius: "8px" }}>
                            <AlertTriangle size={20} color="#D97706" />
                        </div>
                        <div>
                            <div style={{ fontWeight: "700", color: "var(--admin-warning)", fontSize: "0.95rem" }}>
                                Operations Requiring Administrator Review
                            </div>
                            <div style={{ fontSize: "0.825rem", color: "var(--admin-text-body)" }}>
                                {pendingVerifications > 0 && `${pendingVerifications} Pending Provider Document(s) • `}
                                {pendingBookings > 0 && `${pendingBookings} Unassigned Booking(s) • `}
                                {openSupport > 0 && `${openSupport} Open Support Ticket(s)`}
                            </div>
                        </div>
                    </div>
                    <div style={{ display: "flex", gap: "10px" }}>
                        {pendingVerifications > 0 && (
                            <Link href="/admin/providers/verification" className="btn-primary" style={{ padding: "6px 14px", fontSize: "0.8rem" }}>
                                Review Documents
                            </Link>
                        )}
                        {openSupport > 0 && (
                            <Link href="/admin/support" className="btn-secondary" style={{ padding: "6px 14px", fontSize: "0.8rem" }}>
                                Support Tickets
                            </Link>
                        )}
                    </div>
                </div>
            )}

            {/* Core Metrics Grid */}
            <div className="stat-grid">
                {/* Customers */}
                <div className="stat-card">
                    <div className="stat-card-header">
                        <span className="stat-label">Total Customers</span>
                        <div className="stat-icon-wrapper" style={{ background: "rgba(14, 165, 233, 0.15)", color: "#0ea5e9" }}>
                            <Users size={18} />
                        </div>
                    </div>
                    <div className="stat-value">{stats?.customers?.total || 0}</div>
                    <div className="stat-subtext">
                        <span style={{ color: "#10b981", fontWeight: "600" }}>{stats?.customers?.active || 0} Active</span>
                        <span>•</span>
                        <span style={{ color: "#94a3b8" }}>{stats?.customers?.deactivated || 0} Deactivated</span>
                    </div>
                </div>

                {/* Service Providers */}
                <div className="stat-card">
                    <div className="stat-card-header">
                        <span className="stat-label">Service Providers</span>
                        <div className="stat-icon-wrapper" style={{ background: "rgba(245, 158, 11, 0.15)", color: "#f59e0b" }}>
                            <Wrench size={18} />
                        </div>
                    </div>
                    <div className="stat-value">{stats?.providers?.total || 0}</div>
                    <div className="stat-subtext">
                        <span style={{ color: "#10b981", fontWeight: "600" }}>{stats?.providers?.verified || 0} Verified</span>
                        <span>•</span>
                        <span style={{ color: "#f59e0b" }}>{stats?.providers?.pending || 0} Pending</span>
                    </div>
                </div>

                {/* Total Bookings */}
                <div className="stat-card">
                    <div className="stat-card-header">
                        <span className="stat-label">Total Bookings</span>
                        <div className="stat-icon-wrapper" style={{ background: "rgba(168, 85, 247, 0.15)", color: "#a855f7" }}>
                            <Calendar size={18} />
                        </div>
                    </div>
                    <div className="stat-value">{stats?.bookings?.total || 0}</div>
                    <div className="stat-subtext">
                        <span style={{ color: "#10b981" }}>{stats?.bookings?.completed || 0} Completed</span>
                        <span>•</span>
                        <span style={{ color: "#f59e0b" }}>{stats?.bookings?.active || 0} In Progress</span>
                    </div>
                </div>

                {/* Gross Revenue */}
                <div className="stat-card">
                    <div className="stat-card-header">
                        <span className="stat-label">Gross Completed Volume</span>
                        <div className="stat-icon-wrapper" style={{ background: "rgba(4, 178, 4, 0.15)", color: "#04b204" }}>
                            <DollarSign size={18} />
                        </div>
                    </div>
                    <div className="stat-value" style={{ color: "#04b204" }}>₹{stats?.finances?.totalRevenue?.toLocaleString() || 0}</div>
                    <div className="stat-subtext">
                        <span style={{ color: "var(--admin-primary-darker)", fontWeight: "600" }}>₹{stats?.finances?.commissionEarned?.toLocaleString() || 0} Commission</span>
                    </div>
                </div>
            </div>

            {/* Visual Breakdowns & Distribution Charts */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "20px", marginBottom: "28px" }}>
                {/* Booking Lifecycle Distribution */}
                <div className="admin-card" style={{ margin: 0 }}>
                    <div className="card-title-bar">
                        <h3>Booking Lifecycle Distribution</h3>
                        <Link href="/admin/bookings" className="btn-secondary" style={{ padding: "4px 10px", fontSize: "0.75rem" }}>
                            View All <ArrowUpRight size={12} />
                        </Link>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "14px" }}>
                        {[
                            { label: "Completed", count: stats?.bookings?.completed || 0, color: "#10b981" },
                            { label: "In Progress / Active", count: stats?.bookings?.active || 0, color: "#0ea5e9" },
                            { label: "Accepted", count: stats?.bookings?.accepted || 0, color: "#a855f7" },
                            { label: "Pending Dispatch", count: stats?.bookings?.pending || 0, color: "#f59e0b" },
                            { label: "Cancelled", count: stats?.bookings?.cancelled || 0, color: "#ef4444" },
                        ].map((b) => {
                            const total = stats?.bookings?.total || 1;
                            const pct = Math.round((b.count / (total > 0 ? total : 1)) * 100);
                            return (
                                <div key={b.label}>
                                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.825rem", marginBottom: "4px" }}>
                                        <span style={{ color: "var(--admin-text-main)" }}>{b.label}</span>
                                        <span style={{ color: "var(--admin-text-muted)", fontWeight: "600" }}>{b.count} ({pct}%)</span>
                                    </div>
                                    <div style={{ height: "6px", background: "var(--admin-border-light)", borderRadius: "3px", overflow: "hidden" }}>
                                        <div style={{ width: `${pct}%`, height: "100%", background: b.color, borderRadius: "3px" }} />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Financial Summary Breakdown */}
                <div className="admin-card" style={{ margin: 0 }}>
                    <div className="card-title-bar">
                        <h3>Platform Financial Overview</h3>
                        <Link href="/admin/payments" className="btn-secondary" style={{ padding: "4px 10px", fontSize: "0.75rem" }}>
                            Financials <ArrowUpRight size={12} />
                        </Link>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginTop: "14px" }}>
                        <div style={{ background: "var(--admin-card-inner)", padding: "16px", borderRadius: "var(--admin-radius-md)", border: "1px solid var(--admin-border)" }}>
                            <div style={{ fontSize: "0.75rem", color: "var(--admin-text-muted)", marginBottom: "4px" }}>Platform Commission</div>
                            <div style={{ fontSize: "1.4rem", fontWeight: "700", color: "#10b981" }}>₹{stats?.finances?.commissionEarned?.toLocaleString() || 0}</div>
                            <div style={{ fontSize: "0.7rem", color: "var(--admin-text-sub)", marginTop: "4px" }}>10% Platform Share</div>
                        </div>

                        <div style={{ background: "var(--admin-card-inner)", padding: "16px", borderRadius: "var(--admin-radius-md)", border: "1px solid var(--admin-border)" }}>
                            <div style={{ fontSize: "0.75rem", color: "var(--admin-text-muted)", marginBottom: "4px" }}>Pending Payouts</div>
                            <div style={{ fontSize: "1.4rem", fontWeight: "700", color: "#f59e0b" }}>₹{stats?.finances?.pendingPayouts?.toLocaleString() || 0}</div>
                            <div style={{ fontSize: "0.7rem", color: "var(--admin-text-sub)", marginTop: "4px" }}>Due to Providers</div>
                        </div>

                        <div style={{ background: "var(--admin-card-inner)", padding: "16px", borderRadius: "var(--admin-radius-md)", border: "1px solid var(--admin-border)" }}>
                            <div style={{ fontSize: "0.75rem", color: "var(--admin-text-muted)", marginBottom: "4px" }}>Online Providers</div>
                            <div style={{ fontSize: "1.4rem", fontWeight: "700", color: "#0284c7" }}>{stats?.providers?.online || 0}</div>
                            <div style={{ fontSize: "0.7rem", color: "var(--admin-text-sub)", marginTop: "4px" }}>Currently Active</div>
                        </div>

                        <div style={{ background: "var(--admin-card-inner)", padding: "16px", borderRadius: "var(--admin-radius-md)", border: "1px solid var(--admin-border)" }}>
                            <div style={{ fontSize: "0.75rem", color: "var(--admin-text-muted)", marginBottom: "4px" }}>Support Tickets</div>
                            <div style={{ fontSize: "1.4rem", fontWeight: "700", color: stats?.support?.open > 0 ? "#f59e0b" : "var(--admin-text-main)" }}>
                                {stats?.support?.open || 0}
                            </div>
                            <div style={{ fontSize: "0.7rem", color: "var(--admin-text-sub)", marginTop: "4px" }}>Awaiting Resolution</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Recent Operations Tables */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))", gap: "20px" }}>
                {/* Recent Bookings */}
                <div className="admin-card" style={{ margin: 0 }}>
                    <div className="card-title-bar">
                        <h3>Recent Service Bookings</h3>
                        <Link href="/admin/bookings" className="btn-secondary" style={{ padding: "4px 10px", fontSize: "0.75rem" }}>
                            All Bookings
                        </Link>
                    </div>

                    {recentActivity?.bookings?.length > 0 ? (
                        <div className="table-responsive">
                            <table className="admin-table">
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Customer</th>
                                        <th>Service</th>
                                        <th>Amount</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {recentActivity.bookings.map((b) => (
                                        <tr key={b._id}>
                                            <td style={{ fontFamily: "monospace", color: "var(--admin-text-sub)" }}>
                                                #{b._id.toString().slice(-5)}
                                            </td>
                                            <td>{b.customerId?.name || "Customer"}</td>
                                            <td>{b.services?.[0]?.name || "Service"}</td>
                                            <td style={{ fontWeight: "600" }}>₹{b.estimatedTotal}</td>
                                            <td>
                                                <span className={`status-pill ${b.status}`}>{b.status.replace("_", " ")}</span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="empty-state">
                            <p>No bookings found in database yet.</p>
                        </div>
                    )}
                </div>

                {/* Recent Audit Activity */}
                <div className="admin-card" style={{ margin: 0 }}>
                    <div className="card-title-bar">
                        <h3>Recent Administrator Actions</h3>
                        <Link href="/admin/audit-logs" className="btn-secondary" style={{ padding: "4px 10px", fontSize: "0.75rem" }}>
                            Audit Logs
                        </Link>
                    </div>

                    {recentActivity?.auditLogs?.length > 0 ? (
                        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                            {recentActivity.auditLogs.slice(0, 5).map((log) => (
                                <div
                                    key={log._id}
                                    style={{
                                        display: "flex",
                                        alignItems: "flex-start",
                                        justifyContent: "space-between",
                                        padding: "10px 12px",
                                        background: "var(--admin-card-inner)",
                                        border: "1px solid var(--admin-border)",
                                        borderRadius: "var(--admin-radius-md)",
                                        fontSize: "0.825rem",
                                    }}
                                >
                                    <div>
                                        <div style={{ fontWeight: "600", color: "var(--admin-text-main)", marginBottom: "2px" }}>
                                            {log.description}
                                        </div>
                                        <div style={{ color: "var(--admin-text-sub)", fontSize: "0.75rem" }}>
                                            By {log.adminName} • {log.targetType}
                                        </div>
                                    </div>
                                    <div style={{ color: "var(--admin-text-sub)", fontSize: "0.725rem", whiteSpace: "nowrap" }}>
                                        {new Date(log.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="empty-state">
                            <p>No administrative activities recorded yet.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
