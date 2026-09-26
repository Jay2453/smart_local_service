"use client";

import { useState, useEffect, useCallback } from "react";
import {
    Save,
    RefreshCw,
    Shield,
    DollarSign,
    CheckCircle2,
    AlertTriangle,
    Globe,
} from "lucide-react";

export default function AdminSettingsPage() {
    const [settingsMap, setSettingsMap] = useState({
        platform_name: "SmartServe",
        support_email: "support@smartserve.com",
        support_phone: "+91 98765 43210",
        default_commission_percent: 10,
        cancellation_window_hours: 2,
        cancellation_fee: 50,
        require_provider_verification: true,
        maintenance_mode: false,
        broadcast_notifications_enabled: true,
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");

    const fetchSettings = useCallback(async () => {
        try {
            setLoading(true);
            const res = await fetch("/api/admin/settings");
            const data = await res.json();
            if (data.success && data.settingsMap) {
                setSettingsMap((prev) => ({ ...prev, ...data.settingsMap }));
                setError("");
            } else {
                setError(data.message || "Failed to load settings.");
            }
        } catch (err) {
            console.error("Fetch settings error:", err);
            setError("Network error connecting to configuration store.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        fetchSettings();
    }, [fetchSettings]);

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError("");
        setSuccessMessage("");

        try {
            const res = await fetch("/api/admin/settings", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ settings: settingsMap }),
            });

            const data = await res.json();

            if (!res.ok || !data.success) {
                setError(data.message || "Failed to persist settings.");
                setSaving(false);
                return;
            }

            setSuccessMessage("Platform settings saved and applied successfully!");
            setTimeout(() => setSuccessMessage(""), 4000);
        } catch (err) {
            console.error("Save settings error:", err);
            setError("Failed to save settings to server.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div>
            {/* Header */}
            <div className="page-header">
                <div className="page-header-info">
                    <h1>Platform Configuration & Governance</h1>
                    <p>Manage marketplace fees, cancellation rules, verification policies, and public contact information.</p>
                </div>
                <div className="page-header-actions">
                    <button className="btn-secondary" onClick={fetchSettings} disabled={loading || saving}>
                        <RefreshCw size={15} className={loading ? "spin" : ""} />
                        <span>Reload</span>
                    </button>
                    <button className="btn-primary" onClick={handleSave} disabled={saving || loading}>
                        <Save size={15} />
                        <span>{saving ? "Saving Changes..." : "Save Settings"}</span>
                    </button>
                </div>
            </div>

            {successMessage && (
                <div
                    style={{
                        background: "rgba(16, 185, 129, 0.15)",
                        border: "1px solid rgba(16, 185, 129, 0.3)",
                        color: "#86efac",
                        padding: "12px 18px",
                        borderRadius: "var(--admin-radius-md)",
                        marginBottom: "20px",
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        fontSize: "0.875rem",
                    }}
                >
                    <CheckCircle2 size={18} />
                    <span>{successMessage}</span>
                </div>
            )}

            {error && (
                <div
                    style={{
                        background: "rgba(239, 68, 68, 0.15)",
                        border: "1px solid rgba(239, 68, 68, 0.3)",
                        color: "#fca5a5",
                        padding: "12px 18px",
                        borderRadius: "var(--admin-radius-md)",
                        marginBottom: "20px",
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        fontSize: "0.875rem",
                    }}
                >
                    <AlertTriangle size={18} />
                    <span>{error}</span>
                </div>
            )}

            <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                {/* General Settings */}
                <div className="admin-card" style={{ margin: 0 }}>
                    <div className="card-title-bar">
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <Globe size={20} color="#04b204" />
                            <h3>General Platform Identity</h3>
                        </div>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "16px" }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                            <label style={{ fontSize: "0.825rem", color: "var(--admin-text-muted)", fontWeight: "600" }}>
                                Platform Public Name
                            </label>
                            <input
                                type="text"
                                required
                                value={settingsMap.platform_name || ""}
                                onChange={(e) => setSettingsMap({ ...settingsMap, platform_name: e.target.value })}
                                className="search-input"
                            />
                        </div>

                        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                            <label style={{ fontSize: "0.825rem", color: "var(--admin-text-muted)", fontWeight: "600" }}>
                                Support Email Address
                            </label>
                            <input
                                type="email"
                                required
                                value={settingsMap.support_email || ""}
                                onChange={(e) => setSettingsMap({ ...settingsMap, support_email: e.target.value })}
                                className="search-input"
                            />
                        </div>

                        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                            <label style={{ fontSize: "0.825rem", color: "var(--admin-text-muted)", fontWeight: "600" }}>
                                Support Hotline Phone
                            </label>
                            <input
                                type="text"
                                required
                                value={settingsMap.support_phone || ""}
                                onChange={(e) => setSettingsMap({ ...settingsMap, support_phone: e.target.value })}
                                className="search-input"
                            />
                        </div>
                    </div>
                </div>

                {/* Business & Finance Settings */}
                <div className="admin-card" style={{ margin: 0 }}>
                    <div className="card-title-bar">
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <DollarSign size={20} color="#10b981" />
                            <h3>Financial & Booking Governance</h3>
                        </div>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "16px" }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                            <label style={{ fontSize: "0.825rem", color: "var(--admin-text-muted)", fontWeight: "600" }}>
                                Default Platform Commission (%)
                            </label>
                            <input
                                type="number"
                                required
                                min="0"
                                max="100"
                                value={settingsMap.default_commission_percent ?? 10}
                                onChange={(e) => setSettingsMap({ ...settingsMap, default_commission_percent: Number(e.target.value) })}
                                className="search-input"
                            />
                            <span style={{ fontSize: "0.725rem", color: "var(--admin-text-sub)" }}>
                                Percentage retained by SmartServe upon job completion.
                            </span>
                        </div>

                        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                            <label style={{ fontSize: "0.825rem", color: "var(--admin-text-muted)", fontWeight: "600" }}>
                                Free Cancellation Window (Hours)
                            </label>
                            <input
                                type="number"
                                required
                                min="0"
                                max="72"
                                value={settingsMap.cancellation_window_hours ?? 2}
                                onChange={(e) => setSettingsMap({ ...settingsMap, cancellation_window_hours: Number(e.target.value) })}
                                className="search-input"
                            />
                            <span style={{ fontSize: "0.725rem", color: "var(--admin-text-sub)" }}>
                                Minimum hours prior to service time for zero penalty.
                            </span>
                        </div>

                        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                            <label style={{ fontSize: "0.825rem", color: "var(--admin-text-muted)", fontWeight: "600" }}>
                                Late Cancellation Penalty (₹)
                            </label>
                            <input
                                type="number"
                                required
                                min="0"
                                max="5000"
                                value={settingsMap.cancellation_fee ?? 50}
                                onChange={(e) => setSettingsMap({ ...settingsMap, cancellation_fee: Number(e.target.value) })}
                                className="search-input"
                            />
                        </div>
                    </div>
                </div>

                {/* Operations & Provider Policy */}
                <div className="admin-card" style={{ margin: 0 }}>
                    <div className="card-title-bar">
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <Shield size={20} color="#f59e0b" />
                            <h3>Security & Verification Governance</h3>
                        </div>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                        <label style={{ display: "flex", alignItems: "center", gap: "12px", cursor: "pointer", background: "rgba(255,255,255,0.02)", padding: "14px", borderRadius: "8px", border: "1px solid var(--admin-border)" }}>
                            <input
                                type="checkbox"
                                checked={!!settingsMap.require_provider_verification}
                                onChange={(e) => setSettingsMap({ ...settingsMap, require_provider_verification: e.target.checked })}
                                style={{ width: "18px", height: "18px", accentColor: "#04b204" }}
                            />
                            <div>
                                <div style={{ fontWeight: "600", color: "#ffffff", fontSize: "0.9rem" }}>
                                    Require Document Verification for Matching Engine
                                </div>
                                <div style={{ fontSize: "0.75rem", color: "var(--admin-text-sub)" }}>
                                    When enabled, unverified providers will not receive live dispatch notifications.
                                </div>
                            </div>
                        </label>

                        <label style={{ display: "flex", alignItems: "center", gap: "12px", cursor: "pointer", background: "rgba(255,255,255,0.02)", padding: "14px", borderRadius: "8px", border: "1px solid var(--admin-border)" }}>
                            <input
                                type="checkbox"
                                checked={!!settingsMap.broadcast_notifications_enabled}
                                onChange={(e) => setSettingsMap({ ...settingsMap, broadcast_notifications_enabled: e.target.checked })}
                                style={{ width: "18px", height: "18px", accentColor: "#04b204" }}
                            />
                            <div>
                                <div style={{ fontWeight: "600", color: "#ffffff", fontSize: "0.9rem" }}>
                                    Allow Platform Broadcasts
                                </div>
                                <div style={{ fontSize: "0.75rem", color: "var(--admin-text-sub)" }}>
                                    Permit administrators to send broadcast alerts to customer and provider feeds.
                                </div>
                            </div>
                        </label>

                        <label style={{ display: "flex", alignItems: "center", gap: "12px", cursor: "pointer", background: "rgba(239,68,68,0.05)", padding: "14px", borderRadius: "8px", border: "1px solid rgba(239,68,68,0.2)" }}>
                            <input
                                type="checkbox"
                                checked={!!settingsMap.maintenance_mode}
                                onChange={(e) => setSettingsMap({ ...settingsMap, maintenance_mode: e.target.checked })}
                                style={{ width: "18px", height: "18px", accentColor: "#ef4444" }}
                            />
                            <div>
                                <div style={{ fontWeight: "600", color: "#fca5a5", fontSize: "0.9rem" }}>
                                    System Maintenance Mode
                                </div>
                                <div style={{ fontSize: "0.75rem", color: "#cbd5e1" }}>
                                    Temporarily pause new customer booking requests for scheduled maintenance.
                                </div>
                            </div>
                        </label>
                    </div>
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                    <button type="submit" className="btn-primary" style={{ padding: "12px 28px", fontSize: "0.95rem" }} disabled={saving}>
                        <Save size={16} />
                        <span>{saving ? "Persisting Changes..." : "Save All Platform Settings"}</span>
                    </button>
                </div>
            </form>
        </div>
    );
}
