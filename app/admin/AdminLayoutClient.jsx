"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
    LayoutDashboard,
    Users,
    Wrench,
    ShieldCheck,
    Calendar,
    Settings,
    FileText,
    Star,
    DollarSign,
    Bell,
    LifeBuoy,
    LogOut,
    Menu,
    X,
    User,
    KeyRound,
    AlertCircle,
    CheckCircle2,
    Shield,
} from "lucide-react";
import "./admin.css";

const NAV_ITEMS = [
    { label: "Dashboard", href: "/admin", icon: LayoutDashboard, section: "Core" },
    { label: "Customers", href: "/admin/users", icon: Users, section: "Management" },
    { label: "Providers", href: "/admin/providers", icon: Wrench, section: "Management" },
    { label: "Verification", href: "/admin/providers/verification", icon: ShieldCheck, section: "Management" },
    { label: "Bookings", href: "/admin/bookings", icon: Calendar, section: "Operations" },
    { label: "Services", href: "/admin/services", icon: Wrench, section: "Operations" },
    { label: "Reviews", href: "/admin/reviews", icon: Star, section: "Operations" },
    { label: "Payments", href: "/admin/payments", icon: DollarSign, section: "Finance" },
    { label: "Broadcasts", href: "/admin/notifications", icon: Bell, section: "Engagement" },
    { label: "Support Desk", href: "/admin/support", icon: LifeBuoy, section: "Engagement" },
    { label: "Audit Logs", href: "/admin/audit-logs", icon: FileText, section: "Security" },
    { label: "Settings", href: "/admin/settings", icon: Settings, section: "System" },
];

export default function AdminLayoutClient({ children, admin }) {
    const pathname = usePathname();
    const router = useRouter();

    // If on /admin/login, render without shell layout
    const isLoginPage = pathname === "/admin/login";

    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [profileModalOpen, setProfileModalOpen] = useState(false);
    const [loggingOut, setLoggingOut] = useState(false);

    const [name, setName] = useState(admin?.name || "");
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [profileLoading, setProfileLoading] = useState(false);
    const [profileError, setProfileError] = useState("");
    const [profileSuccess, setProfileSuccess] = useState("");

    useEffect(() => {
        if (!isLoginPage && !admin) {
            router.replace("/admin/login");
        }
    }, [isLoginPage, admin, router]);

    if (isLoginPage) {
        return <>{children}</>;
    }

    if (!admin) {
        return null;
    }

    const handleLogout = async () => {
        setLoggingOut(true);
        try {
            await fetch("/api/admin/auth/logout", { method: "POST" });
            router.push("/admin/login");
            router.refresh();
        } catch (err) {
            console.error("Logout error:", err);
            setLoggingOut(false);
        }
    };

    const handleProfileSubmit = async (e) => {
        e.preventDefault();
        setProfileError("");
        setProfileSuccess("");

        if (newPassword && newPassword !== confirmPassword) {
            setProfileError("New passwords do not match.");
            return;
        }

        if (newPassword && newPassword.length < 8) {
            setProfileError("New password must be at least 8 characters.");
            return;
        }

        setProfileLoading(true);

        try {
            const body = {};
            if (name !== admin?.name) body.name = name;
            if (newPassword) {
                body.currentPassword = currentPassword;
                body.newPassword = newPassword;
            }

            const res = await fetch("/api/admin/auth/profile", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });

            const data = await res.json();

            if (!res.ok || !data.success) {
                setProfileError(data.message || "Failed to update profile.");
                setProfileLoading(false);
                return;
            }

            setProfileSuccess("Admin profile updated successfully!");
            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
            setTimeout(() => {
                setProfileModalOpen(false);
                setProfileSuccess("");
                router.refresh();
            }, 1000);
        } catch (err) {
            console.error("Update profile error:", err);
            setProfileError("Connection error while updating profile.");
        } finally {
            setProfileLoading(false);
        }
    };

    // Group nav items by section
    const navSections = {};
    NAV_ITEMS.forEach((item) => {
        if (!navSections[item.section]) navSections[item.section] = [];
        navSections[item.section].push(item);
    });

    return (
        <div className="admin-shell">
            {/* Sidebar */}
            <aside className={`admin-sidebar ${sidebarOpen ? "open" : ""}`}>
                <div className="admin-sidebar-brand">
                    <div className="brand-icon-box">
                        <Shield size={22} color="#04b204" />
                    </div>
                    <div className="brand-text">
                        <h2>SmartServe</h2>
                        <span>Admin Console</span>
                    </div>
                </div>

                <nav className="admin-nav">
                    {Object.entries(navSections).map(([section, items]) => (
                        <div key={section}>
                            <div className="nav-section-title">{section}</div>
                            {items.map((item) => {
                                const Icon = item.icon;
                                const isActive = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href));
                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        className={`admin-nav-item ${isActive ? "active" : ""}`}
                                        onClick={() => setSidebarOpen(false)}
                                    >
                                        <div className="nav-item-left">
                                            <Icon size={18} />
                                            <span>{item.label}</span>
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    ))}
                </nav>

                <div className="admin-sidebar-footer">
                    <div className="admin-user-info">
                        <div className="admin-avatar">
                            {admin?.name?.charAt(0) || "A"}
                        </div>
                        <div className="admin-user-details">
                            <div className="name">{admin?.name || "Administrator"}</div>
                            <div className="role">Super Administrator</div>
                        </div>
                    </div>
                    <button
                        onClick={() => setProfileModalOpen(true)}
                        className="topbar-action-btn"
                        title="Admin Profile Settings"
                        aria-label="Admin Profile Settings"
                    >
                        <User size={16} />
                    </button>
                </div>
            </aside>

            {/* Mobile Backdrop */}
            {sidebarOpen && (
                <div
                    className="modal-overlay"
                    style={{ zIndex: 95 }}
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Main Content */}
            <div className="admin-main">
                {/* Topbar */}
                <header className="admin-topbar">
                    <div className="topbar-left">
                        <button
                            className="mobile-menu-btn"
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                            aria-label="Toggle Navigation"
                        >
                            {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
                        </button>
                        <div className="page-breadcrumb">
                            <span>SmartServe</span>
                            <span>/</span>
                            <span className="current">
                                {NAV_ITEMS.find((n) => n.href === pathname)?.label || "Admin Console"}
                            </span>
                        </div>
                    </div>

                    <div className="topbar-right">
                        <Link href="/admin/notifications" className="topbar-action-btn" title="Announcements">
                            <Bell size={18} />
                        </Link>
                        <button
                            className="topbar-profile-btn"
                            onClick={() => setProfileModalOpen(true)}
                        >
                            <User size={16} />
                            <span>{admin?.name?.split(" ")[0] || "Admin"}</span>
                        </button>
                        <button
                            className="topbar-logout-btn"
                            onClick={handleLogout}
                            disabled={loggingOut}
                        >
                            <LogOut size={16} />
                            <span>{loggingOut ? "Signing out..." : "Logout"}</span>
                        </button>
                    </div>
                </header>

                {/* Page Content */}
                <main className="admin-content">
                    {children}
                </main>
            </div>

            {/* Admin Profile & Password Change Modal */}
            {profileModalOpen && (
                <div className="modal-overlay" onClick={() => setProfileModalOpen(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                <KeyRound size={22} color="#04b204" />
                                <h2>Administrator Profile & Security</h2>
                            </div>
                            <button
                                className="modal-close-btn"
                                onClick={() => setProfileModalOpen(false)}
                                aria-label="Close"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleProfileSubmit}>
                            <div className="modal-body" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                                {profileError && (
                                    <div className="status-pill rejected" style={{ width: "100%", padding: "10px", borderRadius: "8px" }}>
                                        <AlertCircle size={16} /> {profileError}
                                    </div>
                                )}
                                {profileSuccess && (
                                    <div className="status-pill active" style={{ width: "100%", padding: "10px", borderRadius: "8px" }}>
                                        <CheckCircle2 size={16} /> {profileSuccess}
                                    </div>
                                )}

                                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                                    <label style={{ fontSize: "0.825rem", color: "var(--admin-text-muted)", fontWeight: "600" }}>Admin Email (Read Only)</label>
                                    <input
                                        type="email"
                                        disabled
                                        value={admin?.email || ""}
                                        className="search-input"
                                        style={{ opacity: 0.6, cursor: "not-allowed" }}
                                    />
                                </div>

                                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                                    <label style={{ fontSize: "0.825rem", color: "var(--admin-text-muted)", fontWeight: "600" }}>Display Name</label>
                                    <input
                                        type="text"
                                        required
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="search-input"
                                        placeholder="Administrator Name"
                                    />
                                </div>

                                <div style={{ borderTop: "1px solid var(--admin-border)", paddingTop: "14px", marginTop: "6px" }}>
                                    <h4 style={{ margin: "0 0 12px 0", fontSize: "0.95rem", color: "var(--admin-text-main)" }}>Change Password (Optional)</h4>

                                    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                                        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                                            <label style={{ fontSize: "0.825rem", color: "var(--admin-text-muted)" }}>Current Password</label>
                                            <input
                                                type="password"
                                                value={currentPassword}
                                                onChange={(e) => setCurrentPassword(e.target.value)}
                                                className="search-input"
                                                placeholder="••••••••••••"
                                            />
                                        </div>

                                        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                                            <label style={{ fontSize: "0.825rem", color: "var(--admin-text-muted)" }}>New Password (min 8 chars)</label>
                                            <input
                                                type="password"
                                                value={newPassword}
                                                onChange={(e) => setNewPassword(e.target.value)}
                                                className="search-input"
                                                placeholder="••••••••••••"
                                            />
                                        </div>

                                        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                                            <label style={{ fontSize: "0.825rem", color: "var(--admin-text-muted)" }}>Confirm New Password</label>
                                            <input
                                                type="password"
                                                value={confirmPassword}
                                                onChange={(e) => setConfirmPassword(e.target.value)}
                                                className="search-input"
                                                placeholder="••••••••••••"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="modal-footer">
                                <button
                                    type="button"
                                    className="btn-secondary"
                                    onClick={() => setProfileModalOpen(false)}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="btn-primary"
                                    disabled={profileLoading}
                                >
                                    {profileLoading ? "Saving Changes..." : "Save Profile"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
