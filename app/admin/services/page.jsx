"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
    Wrench,
    Plus,
    Edit3,
    Trash2,
    RefreshCw,
    Search,
    AlertTriangle,
    X,
    Layers,
} from "lucide-react";

export default function AdminServicesPage() {
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");

    // Modal state for Create / Edit
    const [modalMode, setModalMode] = useState(null); // 'create' | 'edit'
    const [activeService, setActiveService] = useState(null);
    const [formData, setFormData] = useState({
        serviceId: "",
        name: "",
        category: "Home Services",
        description: "",
        icon: "Wrench",
        basePrice: 499,
        isActive: true,
        tasks: [],
    });
    const [submitting, setSubmitting] = useState(false);
    const [formError, setFormError] = useState("");

    const fetchServices = useCallback(async () => {
        try {
            setLoading(true);
            const res = await fetch("/api/admin/services");
            const data = await res.json();
            if (data.success) {
                setServices(data.services || []);
                setError("");
            } else {
                setError(data.message || "Failed to load services.");
            }
        } catch (err) {
            console.error("Fetch services error:", err);
            setError("Network error loading services.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        fetchServices();
    }, [fetchServices]);

    const handleOpenCreate = () => {
        setActiveService(null);
        setFormData({
            serviceId: "",
            name: "",
            category: "Home Services",
            description: "",
            icon: "Wrench",
            basePrice: 499,
            isActive: true,
            tasks: [{ name: "Standard Repair", problem: "General Maintenance", price: 499 }],
        });
        setModalMode("create");
        setFormError("");
    };

    const handleOpenEdit = (svc) => {
        setActiveService(svc);
        setFormData({
            serviceId: svc.serviceId,
            name: svc.name,
            category: svc.category,
            description: svc.description,
            icon: svc.icon || "Wrench",
            basePrice: svc.basePrice || 499,
            isActive: svc.isActive !== false,
            tasks: Array.isArray(svc.tasks) ? [...svc.tasks] : [],
        });
        setModalMode("edit");
        setFormError("");
    };

    const handleAddTask = () => {
        setFormData((prev) => ({
            ...prev,
            tasks: [...prev.tasks, { name: "", problem: "", price: prev.basePrice }],
        }));
    };

    const handleRemoveTask = (idx) => {
        setFormData((prev) => ({
            ...prev,
            tasks: prev.tasks.filter((_, i) => i !== idx),
        }));
    };

    const handleTaskChange = (idx, field, val) => {
        setFormData((prev) => {
            const next = [...prev.tasks];
            next[idx] = { ...next[idx], [field]: field === "price" ? Number(val) : val };
            if (field === "name" && !next[idx].problem) {
                next[idx].problem = val;
            }
            return { ...prev, tasks: next };
        });
    };

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setFormError("");

        try {
            const url = modalMode === "create" ? "/api/admin/services" : `/api/admin/services/${activeService._id}`;
            const method = modalMode === "create" ? "POST" : "PATCH";

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            const data = await res.json();

            if (!res.ok || !data.success) {
                setFormError(data.message || "Failed to save service.");
                setSubmitting(false);
                return;
            }

            setModalMode(null);
            fetchServices();
        } catch (err) {
            console.error("Save service error:", err);
            setFormError("Server connection error.");
        } finally {
            setSubmitting(false);
        }
    };

    const handleToggleStatus = async (svc) => {
        try {
            await fetch(`/api/admin/services/${svc._id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ isActive: !svc.isActive }),
            });
            fetchServices();
        } catch (err) {
            console.error("Toggle service error:", err);
        }
    };

    const filteredServices = services.filter((s) => {
        if (!search.trim()) return true;
        const q = search.toLowerCase();
        return s.name.toLowerCase().includes(q) || s.category.toLowerCase().includes(q) || s.serviceId.toLowerCase().includes(q);
    });

    return (
        <div>
            {/* Header */}
            <div className="page-header">
                <div className="page-header-info">
                    <h1>Service Catalog Management</h1>
                    <p>Configure marketplace categories, base pricing, problem choices, and service activation.</p>
                </div>
                <div className="page-header-actions">
                    <button className="btn-primary" onClick={handleOpenCreate}>
                        <Plus size={16} /> Add New Service
                    </button>
                    <button className="btn-secondary" onClick={fetchServices}>
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
                            placeholder="Search services, categories, or problem types..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="search-input"
                        />
                    </div>
                </div>
            </div>

            {/* Services Grid */}
            {loading ? (
                <div className="admin-card">
                    <div className="loading-skeleton">
                        <div className="skeleton-row" />
                        <div className="skeleton-row" />
                    </div>
                </div>
            ) : error ? (
                <div className="admin-card">
                    <div className="empty-state">
                        <AlertTriangle size={32} color="#ef4444" />
                        <p style={{ color: "#fca5a5" }}>{error}</p>
                    </div>
                </div>
            ) : filteredServices.length === 0 ? (
                <div className="admin-card">
                    <div className="empty-state">
                        <Layers size={36} color="var(--admin-text-sub)" />
                        <h3>No Services Found</h3>
                        <p>No services matched your query. Click &quot;Add New Service&quot; to create one.</p>
                    </div>
                </div>
            ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: "20px" }}>
                    {filteredServices.map((svc) => (
                        <div
                            key={svc._id}
                            className="admin-card"
                            style={{
                                margin: 0,
                                display: "flex",
                                flexDirection: "column",
                                justifyContent: "space-between",
                                borderLeft: `4px solid ${svc.isActive !== false ? "#10b981" : "#ef4444"}`,
                            }}
                        >
                            <div>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                                    <div>
                                        <h3 style={{ margin: "0 0 4px 0", fontSize: "1.15rem", color: "var(--admin-text-main)" }}>
                                            {svc.name}
                                        </h3>
                                        <div style={{ display: "flex", gap: "6px" }}>
                                            <span style={{ fontSize: "0.75rem", background: "var(--admin-info-bg)", border: "1px solid var(--admin-info-border)", padding: "2px 8px", borderRadius: "4px", color: "var(--admin-info)", fontWeight: "600" }}>
                                                {svc.category}
                                            </span>
                                            <span style={{ fontSize: "0.75rem", fontFamily: "monospace", color: "var(--admin-text-sub)" }}>
                                                ID: {svc.serviceId}
                                            </span>
                                        </div>
                                    </div>
                                    <span className={`status-pill ${svc.isActive !== false ? "active" : "deactivated"}`}>
                                        {svc.isActive !== false ? "Active" : "Disabled"}
                                    </span>
                                </div>

                                <p style={{ fontSize: "0.825rem", color: "var(--admin-text-body)", margin: "0 0 14px 0", lineHeight: "1.4" }}>
                                    {svc.description}
                                </p>

                                <div style={{ background: "var(--admin-card-inner)", border: "1px solid var(--admin-border)", padding: "12px", borderRadius: "var(--admin-radius-md)", marginBottom: "14px" }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", marginBottom: "6px" }}>
                                        <span style={{ color: "var(--admin-text-sub)" }}>Base Price</span>
                                        <span style={{ fontWeight: "700", color: "var(--admin-primary-darker)" }}>₹{svc.basePrice}</span>
                                    </div>
                                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem" }}>
                                        <span style={{ color: "var(--admin-text-sub)" }}>Configured Problem Types</span>
                                        <span style={{ fontWeight: "600", color: "var(--admin-text-main)" }}>{svc.tasks?.length || 0} Task(s)</span>
                                    </div>
                                </div>

                                {svc.tasks?.length > 0 && (
                                    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "16px" }}>
                                        {svc.tasks.slice(0, 3).map((t, idx) => (
                                            <span key={idx} style={{ fontSize: "0.7rem", background: "#FFFFFF", border: "1px solid var(--admin-border)", padding: "3px 8px", borderRadius: "4px", color: "var(--admin-text-body)", fontWeight: "500" }}>
                                                {t.name} (₹{t.price})
                                            </span>
                                        ))}
                                        {svc.tasks.length > 3 && (
                                            <span style={{ fontSize: "0.7rem", color: "var(--admin-text-sub)", padding: "3px 4px" }}>
                                                +{svc.tasks.length - 3} more
                                            </span>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid var(--admin-border)", paddingTop: "12px" }}>
                                <button
                                    onClick={() => handleToggleStatus(svc)}
                                    style={{
                                        background: "none",
                                        border: "none",
                                        color: svc.isActive !== false ? "#ef4444" : "#10b981",
                                        fontSize: "0.8rem",
                                        fontWeight: "600",
                                        cursor: "pointer",
                                    }}
                                >
                                    {svc.isActive !== false ? "Disable Service" : "Enable Service"}
                                </button>
                                <button
                                    className="btn-secondary"
                                    style={{ padding: "6px 12px", fontSize: "0.8rem" }}
                                    onClick={() => handleOpenEdit(svc)}
                                >
                                    <Edit3 size={14} /> Edit Service
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Create / Edit Service Modal */}
            {modalMode && (
                <div className="modal-overlay" onClick={() => setModalMode(null)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "680px" }}>
                        <div className="modal-header">
                            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                <Wrench size={20} color="#04b204" />
                                <h2>{modalMode === "create" ? "Add New Marketplace Service" : `Edit Service: ${activeService?.name}`}</h2>
                            </div>
                            <button className="modal-close-btn" onClick={() => setModalMode(null)}>
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleFormSubmit}>
                            <div className="modal-body" style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                                {formError && (
                                    <div className="status-pill rejected" style={{ width: "100%", padding: "10px", borderRadius: "8px" }}>
                                        {formError}
                                    </div>
                                )}

                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                                    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                                        <label style={{ fontSize: "0.8rem", color: "var(--admin-text-muted)", fontWeight: "600" }}>Service Name</label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            className="search-input"
                                            placeholder="e.g. Appliance Repair"
                                        />
                                    </div>

                                    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                                        <label style={{ fontSize: "0.8rem", color: "var(--admin-text-muted)", fontWeight: "600" }}>Service ID / Slug</label>
                                        <input
                                            type="text"
                                            required
                                            disabled={modalMode === "edit"}
                                            value={formData.serviceId}
                                            onChange={(e) => setFormData({ ...formData, serviceId: e.target.value.toLowerCase().replace(/\s+/g, "-") })}
                                            className="search-input"
                                            placeholder="e.g. appliance"
                                            style={modalMode === "edit" ? { opacity: 0.6, cursor: "not-allowed" } : {}}
                                        />
                                    </div>
                                </div>

                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                                    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                                        <label style={{ fontSize: "0.8rem", color: "var(--admin-text-muted)", fontWeight: "600" }}>Category</label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.category}
                                            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                            className="search-input"
                                            placeholder="e.g. Home Repair"
                                        />
                                    </div>

                                    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                                        <label style={{ fontSize: "0.8rem", color: "var(--admin-text-muted)", fontWeight: "600" }}>Base Price (₹)</label>
                                        <input
                                            type="number"
                                            required
                                            min="0"
                                            value={formData.basePrice}
                                            onChange={(e) => setFormData({ ...formData, basePrice: Number(e.target.value) })}
                                            className="search-input"
                                        />
                                    </div>
                                </div>

                                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                                    <label style={{ fontSize: "0.8rem", color: "var(--admin-text-muted)", fontWeight: "600" }}>Description</label>
                                    <textarea
                                        rows={2}
                                        required
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        className="search-input"
                                        style={{ height: "auto", padding: "10px" }}
                                        placeholder="Service summary and highlights..."
                                    />
                                </div>

                                {/* Dynamic Tasks & Problem Pricing */}
                                <div style={{ borderTop: "1px solid var(--admin-border)", paddingTop: "14px" }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                                        <label style={{ fontSize: "0.85rem", color: "var(--admin-text-main)", fontWeight: "600" }}>
                                            Service Tasks & Problem Choices ({formData.tasks.length})
                                        </label>
                                        <button
                                            type="button"
                                            onClick={handleAddTask}
                                            className="btn-secondary"
                                            style={{ padding: "4px 10px", fontSize: "0.75rem" }}
                                        >
                                            <Plus size={14} /> Add Problem Option
                                        </button>
                                    </div>

                                    <div style={{ display: "flex", flexDirection: "column", gap: "8px", maxHeight: "200px", overflowY: "auto" }}>
                                        {formData.tasks.map((task, idx) => (
                                            <div key={idx} style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                                                <input
                                                    type="text"
                                                    required
                                                    placeholder="Task / Problem Name"
                                                    value={task.name}
                                                    onChange={(e) => handleTaskChange(idx, "name", e.target.value)}
                                                    className="search-input"
                                                    style={{ flex: 2 }}
                                                />
                                                <input
                                                    type="number"
                                                    required
                                                    placeholder="Price (₹)"
                                                    value={task.price}
                                                    onChange={(e) => handleTaskChange(idx, "price", e.target.value)}
                                                    className="search-input"
                                                    style={{ flex: 1 }}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveTask(idx)}
                                                    className="btn-danger"
                                                    style={{ padding: "8px" }}
                                                    title="Remove Task"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="modal-footer">
                                <button type="button" className="btn-secondary" onClick={() => setModalMode(null)}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn-primary" disabled={submitting}>
                                    {submitting ? "Saving..." : modalMode === "create" ? "Create Service" : "Save Changes"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
