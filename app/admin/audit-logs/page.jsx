"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
    FileText,
    Search,
    RefreshCw,
    AlertTriangle,
    Shield,
    X,
    ChevronLeft,
    ChevronRight,
    Eye,
} from "lucide-react";

export default function AdminAuditLogsPage() {
    const [logs, setLogs] = useState([]);
    const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });
    const [search, setSearch] = useState("");
    const [targetTypeFilter, setTargetTypeFilter] = useState("all");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // Details Modal
    const [selectedLog, setSelectedLog] = useState(null);

    const fetchLogs = useCallback(async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams({
                page: pagination.page.toString(),
                limit: pagination.limit.toString(),
                targetType: targetTypeFilter,
                search: search.trim(),
            });

            const res = await fetch(`/api/admin/audit-logs?${params.toString()}`);
            const data = await res.json();

            if (data.success) {
                setLogs(data.logs || []);
                setPagination(data.pagination || { page: 1, limit: 20, total: 0, totalPages: 1 });
                setError("");
            } else {
                setError(data.message || "Failed to load audit logs.");
            }
        } catch (err) {
            console.error("Fetch audit logs error:", err);
            setError("Network error connecting to audit store.");
        } finally {
            setLoading(false);
        }
    }, [pagination.page, pagination.limit, targetTypeFilter, search]);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        fetchLogs();
    }, [fetchLogs]);

    return (
        <div>
            {/* Header */}
            <div className="page-header">
                <div className="page-header-info">
                    <h1>Security & Audit Trail Log</h1>
                    <p>Immutable forensic record of all administrative operations, authentications, and policy actions.</p>
                </div>
                <div className="page-header-actions">
                    <button className="btn-secondary" onClick={fetchLogs}>
                        <RefreshCw size={15} className={loading ? "spin" : ""} />
                        <span>Refresh Logs</span>
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
                            placeholder="Search description, admin name, action, target..."
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
                            value={targetTypeFilter}
                            onChange={(e) => {
                                setTargetTypeFilter(e.target.value);
                                setPagination((prev) => ({ ...prev, page: 1 }));
                            }}
                        >
                            <option value="all">All Target Resources</option>
                            <option value="auth">Authentication & Login</option>
                            <option value="customer">Customer Operations</option>
                            <option value="provider">Provider Operations</option>
                            <option value="verification">Verification Decisions</option>
                            <option value="booking">Booking Interventions</option>
                            <option value="service">Service Management</option>
                            <option value="review">Review Moderation</option>
                            <option value="payment">Payments & Refunds</option>
                            <option value="support">Support Desk</option>
                            <option value="setting">Platform Settings</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Logs Table */}
            <div className="admin-card">
                {loading ? (
                    <div className="loading-skeleton">
                        <div className="skeleton-row" />
                        <div className="skeleton-row" />
                        <div className="skeleton-row" />
                    </div>
                ) : error ? (
                    <div className="empty-state">
                        <AlertTriangle size={32} color="#ef4444" />
                        <p style={{ color: "#fca5a5" }}>{error}</p>
                    </div>
                ) : logs.length === 0 ? (
                    <div className="empty-state">
                        <FileText size={36} color="var(--admin-text-sub)" />
                        <h3>No Audit Logs Found</h3>
                        <p>No audit trail records match your current filter parameters.</p>
                    </div>
                ) : (
                    <div>
                        <div className="table-responsive">
                            <table className="admin-table">
                                <thead>
                                    <tr>
                                        <th>Timestamp</th>
                                        <th>Administrator</th>
                                        <th>Action Type</th>
                                        <th>Target</th>
                                        <th>Description</th>
                                        <th>Details</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {logs.map((log) => (
                                        <tr key={log._id}>
                                            <td style={{ fontSize: "0.8rem", color: "var(--admin-text-sub)", whiteSpace: "nowrap" }}>
                                                {new Date(log.createdAt).toLocaleString()}
                                            </td>
                                            <td>
                                                <div style={{ fontWeight: "600", color: "#ffffff" }}>
                                                    {log.adminName}
                                                </div>
                                                <div style={{ fontSize: "0.725rem", color: "var(--admin-text-sub)" }}>
                                                    {log.adminEmail}
                                                </div>
                                            </td>
                                            <td>
                                                <span
                                                    className="status-pill"
                                                    style={{
                                                        background: log.action.includes("failed") || log.action.includes("deleted") || log.action.includes("suspended")
                                                            ? "rgba(239, 68, 68, 0.15)"
                                                            : "rgba(4, 178, 4, 0.15)",
                                                        color: log.action.includes("failed") || log.action.includes("deleted") || log.action.includes("suspended")
                                                            ? "#fca5a5"
                                                            : "#86efac",
                                                        fontFamily: "monospace",
                                                        fontSize: "0.725rem",
                                                    }}
                                                >
                                                    {log.action}
                                                </span>
                                            </td>
                                            <td style={{ textTransform: "capitalize", fontSize: "0.8rem", color: "var(--admin-text-muted)" }}>
                                                {log.targetType}
                                            </td>
                                            <td style={{ maxWidth: "340px" }}>
                                                <div style={{ fontSize: "0.85rem", color: "#cbd5e1" }}>
                                                    {log.description}
                                                </div>
                                            </td>
                                            <td>
                                                <button
                                                    className="btn-secondary"
                                                    style={{ padding: "5px 10px", fontSize: "0.75rem" }}
                                                    onClick={() => setSelectedLog(log)}
                                                >
                                                    <Eye size={13} /> Inspect
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
                                Page {pagination.page} of {pagination.totalPages} ({pagination.total} total audit records)
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

            {/* Inspect Modal */}
            {selectedLog && (
                <div className="modal-overlay" onClick={() => setSelectedLog(null)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "600px" }}>
                        <div className="modal-header">
                            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                <Shield size={20} color="#04b204" />
                                <h2>Audit Log Entry: {selectedLog.action}</h2>
                            </div>
                            <button className="modal-close-btn" onClick={() => setSelectedLog(null)}>
                                <X size={20} />
                            </button>
                        </div>

                        <div className="modal-body">
                            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                                <div style={{ background: "rgba(255,255,255,0.03)", padding: "14px", borderRadius: "8px", border: "1px solid var(--admin-border)" }}>
                                    <div style={{ fontSize: "0.75rem", color: "var(--admin-text-sub)" }}>Description</div>
                                    <div style={{ fontWeight: "600", color: "#ffffff", marginTop: "2px" }}>{selectedLog.description}</div>
                                </div>

                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                                    <div style={{ background: "rgba(255,255,255,0.02)", padding: "10px 12px", borderRadius: "6px" }}>
                                        <div style={{ fontSize: "0.7rem", color: "var(--admin-text-sub)" }}>Administrator</div>
                                        <div style={{ fontSize: "0.85rem", color: "#ffffff" }}>{selectedLog.adminName} ({selectedLog.adminEmail})</div>
                                    </div>
                                    <div style={{ background: "rgba(255,255,255,0.02)", padding: "10px 12px", borderRadius: "6px" }}>
                                        <div style={{ fontSize: "0.7rem", color: "var(--admin-text-sub)" }}>Timestamp</div>
                                        <div style={{ fontSize: "0.85rem", color: "#ffffff" }}>{new Date(selectedLog.createdAt).toLocaleString()}</div>
                                    </div>
                                    <div style={{ background: "rgba(255,255,255,0.02)", padding: "10px 12px", borderRadius: "6px" }}>
                                        <div style={{ fontSize: "0.7rem", color: "var(--admin-text-sub)" }}>Target Resource ID</div>
                                        <div style={{ fontSize: "0.85rem", fontFamily: "monospace", color: "#86efac" }}>{selectedLog.targetId || "N/A"}</div>
                                    </div>
                                    <div style={{ background: "rgba(255,255,255,0.02)", padding: "10px 12px", borderRadius: "6px" }}>
                                        <div style={{ fontSize: "0.7rem", color: "var(--admin-text-sub)" }}>IP Address</div>
                                        <div style={{ fontSize: "0.85rem", fontFamily: "monospace", color: "#ffffff" }}>{selectedLog.ipAddress || "Localhost"}</div>
                                    </div>
                                </div>

                                {selectedLog.metadata && Object.keys(selectedLog.metadata).length > 0 && (
                                    <div>
                                        <div style={{ fontSize: "0.75rem", color: "var(--admin-text-sub)", marginBottom: "4px" }}>Structured Metadata</div>
                                        <pre style={{ background: "rgba(0,0,0,0.5)", border: "1px solid var(--admin-border)", borderRadius: "8px", padding: "12px", fontSize: "0.75rem", color: "#86efac", overflowX: "auto" }}>
                                            {JSON.stringify(selectedLog.metadata, null, 2)}
                                        </pre>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="modal-footer">
                            <button className="btn-secondary" onClick={() => setSelectedLog(null)}>
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
