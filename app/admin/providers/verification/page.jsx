"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
    ShieldCheck,
    CheckCircle2,
    XCircle,
    Eye,
    FileText,
    Image as ImageIcon,
    RefreshCw,
    AlertTriangle,
    X,
} from "lucide-react";

export default function AdminVerificationPage() {
    const [verifications, setVerifications] = useState([]);
    const [statusTab, setStatusTab] = useState("pending");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // Review Modal State
    const [selectedItem, setSelectedItem] = useState(null);
    const [decisionAction, setDecisionAction] = useState(""); // "verified" | "rejected"
    const [rejectionReason, setRejectionReason] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [actionError, setActionError] = useState("");

    const fetchVerifications = useCallback(async () => {
        try {
            setLoading(true);
            const res = await fetch(`/api/admin/providers/verification?status=${statusTab}`);
            const data = await res.json();
            if (data.success) {
                setVerifications(data.verifications || []);
                setError("");
            } else {
                setError(data.message || "Failed to load verifications.");
            }
        } catch (err) {
            console.error("Fetch verifications error:", err);
            setError("Network error fetching verification documents.");
        } finally {
            setLoading(false);
        }
    }, [statusTab]);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        fetchVerifications();
    }, [fetchVerifications]);

    const handleOpenReview = (item, action = "") => {
        setSelectedItem(item);
        setDecisionAction(action);
        setRejectionReason(item.rejectionReason || "");
        setActionError("");
    };

    const handleDecisionSubmit = async (e) => {
        e.preventDefault();
        if (!selectedItem || !decisionAction) return;

        if (decisionAction === "rejected" && !rejectionReason.trim()) {
            setActionError("Rejection reason is required.");
            return;
        }

        setSubmitting(true);
        setActionError("");

        try {
            const res = await fetch("/api/admin/providers/verification", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    providerId: selectedItem.providerId?._id || selectedItem.providerId,
                    decision: decisionAction,
                    rejectionReason: rejectionReason.trim(),
                }),
            });

            const data = await res.json();

            if (!res.ok || !data.success) {
                setActionError(data.message || "Failed to submit decision.");
                setSubmitting(false);
                return;
            }

            // Success
            setSelectedItem(null);
            fetchVerifications();
        } catch (err) {
            console.error("Verification submit error:", err);
            setActionError("Failed to save verification decision.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div>
            {/* Header */}
            <div className="page-header">
                <div className="page-header-info">
                    <h1>Provider Verification Queue</h1>
                    <p>Inspect government IDs, verification selfies, and approve professional credentials.</p>
                </div>
                <div className="page-header-actions">
                    <button className="btn-secondary" onClick={fetchVerifications}>
                        <RefreshCw size={15} className={loading ? "spin" : ""} />
                        <span>Refresh Queue</span>
                    </button>
                </div>
            </div>

            {/* Status Filter Tabs */}
            <div className="admin-card" style={{ padding: "14px 20px", marginBottom: "20px" }}>
                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                    {[
                        { key: "pending", label: "Pending Review ⏳" },
                        { key: "verified", label: "Approved Providers ✓" },
                        { key: "rejected", label: "Rejected Submissions ✕" },
                        { key: "all", label: "All Records" },
                    ].map((tab) => (
                        <button
                            key={tab.key}
                            onClick={() => setStatusTab(tab.key)}
                            style={{
                                padding: "8px 18px",
                                borderRadius: "var(--admin-radius-md)",
                                fontSize: "0.85rem",
                                fontWeight: statusTab === tab.key ? "700" : "600",
                                background: statusTab === tab.key ? "var(--admin-primary-gradient)" : "#FFFFFF",
                                color: statusTab === tab.key ? "#ffffff" : "var(--admin-text-body)",
                                border: `1.5px solid ${statusTab === tab.key ? "transparent" : "var(--admin-border)"}`,
                                cursor: "pointer",
                                transition: "all 0.2s ease",
                                boxShadow: statusTab === tab.key ? "var(--admin-shadow-green-sm)" : "none",
                            }}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Queue Table */}
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
                        <p style={{ color: "var(--admin-danger)" }}>{error}</p>
                        <button className="btn-primary" onClick={fetchVerifications} style={{ marginTop: "12px" }}>
                            Retry
                        </button>
                    </div>
                ) : verifications.length === 0 ? (
                    <div className="empty-state">
                        <ShieldCheck size={36} color="#04b204" style={{ marginBottom: "12px" }} />
                        <h3>No Verifications in this Queue</h3>
                        <p>There are no submissions currently matching the &apos;{statusTab}&apos; status filter.</p>
                    </div>
                ) : (
                    <div className="table-responsive">
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th>Provider</th>
                                    <th>Profession</th>
                                    <th>Document Type</th>
                                    <th>Submission Date</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {verifications.map((item) => (
                                    <tr key={item._id}>
                                        <td>
                                            <div style={{ fontWeight: "600", color: "var(--admin-text-main)" }}>
                                                {item.providerId?.name || "Provider"}
                                            </div>
                                            <div style={{ fontSize: "0.75rem", color: "var(--admin-text-sub)" }}>
                                                {item.providerId?.phone} • {item.providerId?.email}
                                            </div>
                                        </td>
                                        <td style={{ textTransform: "capitalize" }}>
                                            {item.providerId?.Proffesion || "General"}
                                        </td>
                                        <td style={{ textTransform: "uppercase", fontWeight: "600" }}>
                                            {item.documentType}
                                        </td>
                                        <td style={{ color: "var(--admin-text-sub)", fontSize: "0.8rem" }}>
                                            {new Date(item.createdAt).toLocaleDateString()}
                                        </td>
                                        <td>
                                            <span className={`status-pill ${item.status}`}>{item.status}</span>
                                        </td>
                                        <td>
                                            <div style={{ display: "flex", gap: "6px" }}>
                                                <button
                                                    className="btn-secondary"
                                                    style={{ padding: "6px 12px", fontSize: "0.75rem" }}
                                                    onClick={() => handleOpenReview(item)}
                                                >
                                                    <Eye size={14} /> Review Documents
                                                </button>
                                                {item.status === "pending" && (
                                                    <>
                                                        <button
                                                            className="btn-success"
                                                            style={{ padding: "6px 10px", fontSize: "0.75rem" }}
                                                            onClick={() => handleOpenReview(item, "verified")}
                                                        >
                                                            <CheckCircle2 size={14} /> Approve
                                                        </button>
                                                        <button
                                                            className="btn-danger"
                                                            style={{ padding: "6px 10px", fontSize: "0.75rem" }}
                                                            onClick={() => handleOpenReview(item, "rejected")}
                                                        >
                                                            <XCircle size={14} /> Reject
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Document Review & Decision Modal */}
            {selectedItem && (
                <div className="modal-overlay" onClick={() => setSelectedItem(null)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "780px" }}>
                        <div className="modal-header">
                            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                <ShieldCheck size={22} color="#04b204" />
                                <h2>Verification Inspection: {selectedItem.providerId?.name}</h2>
                            </div>
                            <button className="modal-close-btn" onClick={() => setSelectedItem(null)}>
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleDecisionSubmit}>
                            <div className="modal-body" style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
                                {actionError && (
                                    <div className="status-pill rejected" style={{ width: "100%", padding: "10px", borderRadius: "8px" }}>
                                        {actionError}
                                    </div>
                                )}

                                {/* Provider Overview */}
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", background: "var(--admin-card-inner)", padding: "14px", borderRadius: "var(--admin-radius-md)", border: "1px solid var(--admin-border)" }}>
                                    <div>
                                        <div style={{ fontSize: "0.75rem", color: "var(--admin-text-sub)" }}>Provider Name & Profession</div>
                                        <div style={{ fontWeight: "700", color: "var(--admin-text-main)" }}>
                                            {selectedItem.providerId?.name} ({selectedItem.providerId?.Proffesion})
                                        </div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: "0.75rem", color: "var(--admin-text-sub)" }}>Current Status</div>
                                        <span className={`status-pill ${selectedItem.status}`}>{selectedItem.status}</span>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: "0.75rem", color: "var(--admin-text-sub)" }}>Experience & Radius</div>
                                        <div style={{ color: "var(--admin-text-body)", fontSize: "0.85rem" }}>
                                            {selectedItem.providerId?.Experience} • {selectedItem.providerId?.ServiceRadius}
                                        </div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: "0.75rem", color: "var(--admin-text-sub)" }}>Base Address</div>
                                        <div style={{ color: "var(--admin-text-body)", fontSize: "0.85rem" }}>{selectedItem.providerId?.address}</div>
                                    </div>
                                </div>

                                {/* Document Viewers */}
                                <div>
                                    <h4 style={{ margin: "0 0 12px 0", color: "var(--admin-text-main)", fontSize: "0.95rem" }}>
                                        Submitted Identification ({selectedItem.documentType?.toUpperCase()}) & Live Selfie
                                    </h4>

                                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                                        {/* Gov ID Card */}
                                        <div style={{ background: "var(--admin-card-inner)", border: "1px solid var(--admin-border)", borderRadius: "var(--admin-radius-md)", padding: "12px", textAlign: "center" }}>
                                            <div style={{ fontSize: "0.75rem", color: "var(--admin-text-muted)", marginBottom: "8px", fontWeight: "600" }}>
                                                Government ID Document
                                            </div>
                                            {selectedItem.documentPath ? (
                                                <div style={{ position: "relative", minHeight: "180px", background: "#F3F4F6", border: "1px solid var(--admin-border)", borderRadius: "8px", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                                    <img
                                                        src={selectedItem.documentPath}
                                                        alt="Government ID"
                                                        style={{ maxWidth: "100%", maxHeight: "220px", objectFit: "contain" }}
                                                        onError={(e) => {
                                                            e.target.style.display = "none";
                                                            e.target.nextSibling.style.display = "block";
                                                        }}
                                                    />
                                                    <div style={{ display: "none", padding: "20px", color: "var(--admin-text-sub)", fontSize: "0.8rem" }}>
                                                        <FileText size={28} style={{ margin: "0 auto 8px auto", display: "block" }} />
                                                        Document: {selectedItem.documentPath}
                                                    </div>
                                                </div>
                                            ) : (
                                                <div style={{ padding: "40px 0", color: "var(--admin-text-sub)" }}>No document attached</div>
                                            )}
                                        </div>

                                        {/* Selfie Photo */}
                                        <div style={{ background: "var(--admin-card-inner)", border: "1px solid var(--admin-border)", borderRadius: "var(--admin-radius-md)", padding: "12px", textAlign: "center" }}>
                                            <div style={{ fontSize: "0.75rem", color: "var(--admin-text-muted)", marginBottom: "8px", fontWeight: "600" }}>
                                                Live Verification Selfie
                                            </div>
                                            {selectedItem.selfiePath ? (
                                                <div style={{ position: "relative", minHeight: "180px", background: "#F3F4F6", border: "1px solid var(--admin-border)", borderRadius: "8px", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                                    <img
                                                        src={selectedItem.selfiePath}
                                                        alt="Verification Selfie"
                                                        style={{ maxWidth: "100%", maxHeight: "220px", objectFit: "contain" }}
                                                        onError={(e) => {
                                                            e.target.style.display = "none";
                                                            e.target.nextSibling.style.display = "block";
                                                        }}
                                                    />
                                                    <div style={{ display: "none", padding: "20px", color: "var(--admin-text-sub)", fontSize: "0.8rem" }}>
                                                        <ImageIcon size={28} style={{ margin: "0 auto 8px auto", display: "block" }} />
                                                        Selfie: {selectedItem.selfiePath}
                                                    </div>
                                                </div>
                                            ) : (
                                                <div style={{ padding: "40px 0", color: "var(--admin-text-sub)" }}>No selfie attached</div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Decision Controls */}
                                <div style={{ borderTop: "1px solid var(--admin-border)", paddingTop: "16px" }}>
                                    <h4 style={{ margin: "0 0 10px 0", color: "var(--admin-text-main)", fontSize: "0.95rem" }}>
                                        Administrator Decision
                                    </h4>

                                    <div style={{ display: "flex", gap: "12px", marginBottom: "14px" }}>
                                        <label
                                            style={{
                                                flex: 1,
                                                padding: "10px 14px",
                                                borderRadius: "var(--admin-radius-md)",
                                                border: `2px solid ${decisionAction === "verified" ? "#04b204" : "var(--admin-border)"}`,
                                                background: decisionAction === "verified" ? "var(--admin-primary-light)" : "#FFFFFF",
                                                color: decisionAction === "verified" ? "var(--admin-primary-darker)" : "var(--admin-text-body)",
                                                cursor: "pointer",
                                                display: "flex",
                                                alignItems: "center",
                                                gap: "8px",
                                                fontWeight: "600",
                                                fontSize: "0.85rem",
                                            }}
                                        >
                                            <input
                                                type="radio"
                                                name="decision"
                                                value="verified"
                                                checked={decisionAction === "verified"}
                                                onChange={() => setDecisionAction("verified")}
                                                style={{ display: "none" }}
                                            />
                                            <CheckCircle2 size={18} /> Approve & Grant Verified Badge
                                        </label>

                                        <label
                                            style={{
                                                flex: 1,
                                                padding: "10px 14px",
                                                borderRadius: "var(--admin-radius-md)",
                                                border: `2px solid ${decisionAction === "rejected" ? "#ef4444" : "var(--admin-border)"}`,
                                                background: decisionAction === "rejected" ? "var(--admin-danger-bg)" : "#FFFFFF",
                                                color: decisionAction === "rejected" ? "var(--admin-danger)" : "var(--admin-text-body)",
                                                cursor: "pointer",
                                                display: "flex",
                                                alignItems: "center",
                                                gap: "8px",
                                                fontWeight: "600",
                                                fontSize: "0.85rem",
                                            }}
                                        >
                                            <input
                                                type="radio"
                                                name="decision"
                                                value="rejected"
                                                checked={decisionAction === "rejected"}
                                                onChange={() => setDecisionAction("rejected")}
                                                style={{ display: "none" }}
                                            />
                                            <XCircle size={18} /> Reject & Request Resubmission
                                        </label>
                                    </div>

                                    {decisionAction === "rejected" && (
                                        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                                            <label style={{ fontSize: "0.8rem", color: "#fca5a5", fontWeight: "600" }}>
                                                Rejection Reason (visible to provider and recorded in audit log):
                                            </label>
                                            <textarea
                                                rows={3}
                                                required
                                                value={rejectionReason}
                                                onChange={(e) => setRejectionReason(e.target.value)}
                                                className="search-input"
                                                style={{ height: "auto", padding: "10px" }}
                                                placeholder="e.g. Blurry photo ID, document expired, name mismatch..."
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="modal-footer">
                                <button type="button" className="btn-secondary" onClick={() => setSelectedItem(null)}>
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className={decisionAction === "rejected" ? "btn-danger" : "btn-primary"}
                                    disabled={submitting || !decisionAction}
                                >
                                    {submitting ? "Submitting Decision..." : "Submit Verification Decision"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
