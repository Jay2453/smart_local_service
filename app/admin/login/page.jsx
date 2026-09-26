"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Shield, Lock, Mail, Eye, EyeOff, AlertCircle, CheckCircle2 } from "lucide-react";
import "./adminLogin.css";

export default function AdminLoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setSuccess("");
        setLoading(true);

        try {
            const res = await fetch("/api/admin/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
            });

            const data = await res.json();

            if (!res.ok || !data.success) {
                setError(data.message || "Invalid administrator credentials.");
                setLoading(false);
                return;
            }

            setSuccess("Authentication successful! Redirecting to admin console...");
            setTimeout(() => {
                router.push("/admin");
                router.refresh();
            }, 800);
        } catch (err) {
            console.error("Admin login error:", err);
            setError("Connection error. Please verify the server is running.");
            setLoading(false);
        }
    };

    return (
        <div className="admin-login-wrapper">
            <div className="admin-login-card">
                <div className="admin-login-header">
                    <div className="admin-badge-icon">
                        <Shield size={32} color="#04b204" />
                    </div>
                    <h1 className="admin-title">SmartServe Administrator</h1>
                    <p className="admin-subtitle">Secure Administration Portal</p>
                </div>

                {error && (
                    <div className="admin-alert admin-alert-error" role="alert">
                        <AlertCircle size={18} />
                        <span>{error}</span>
                    </div>
                )}

                {success && (
                    <div className="admin-alert admin-alert-success" role="alert">
                        <CheckCircle2 size={18} />
                        <span>{success}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="admin-login-form">
                    <div className="admin-form-group">
                        <label htmlFor="admin-email">Admin Email Address</label>
                        <div className="admin-input-wrapper">
                            <Mail size={18} className="input-icon" />
                            <input
                                id="admin-email"
                                type="email"
                                required
                                placeholder="admin@smartserve.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                autoComplete="email"
                                disabled={loading}
                            />
                        </div>
                    </div>

                    <div className="admin-form-group">
                        <label htmlFor="admin-password">Admin Password</label>
                        <div className="admin-input-wrapper">
                            <Lock size={18} className="input-icon" />
                            <input
                                id="admin-password"
                                type={showPassword ? "text" : "password"}
                                required
                                placeholder="••••••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                autoComplete="current-password"
                                disabled={loading}
                            />
                            <button
                                type="button"
                                className="toggle-password-btn"
                                onClick={() => setShowPassword(!showPassword)}
                                tabIndex={-1}
                                aria-label={showPassword ? "Hide password" : "Show password"}
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="admin-submit-btn"
                        disabled={loading}
                    >
                        {loading ? (
                            <span className="admin-spinner-text">
                                <span className="admin-spinner"></span>
                                Verifying...
                            </span>
                        ) : (
                            "Sign In to Admin Console"
                        )}
                    </button>
                </form>

                <div className="admin-login-footer">
                    <p>Protected area. All administrative actions and login attempts are logged and audited.</p>
                </div>
            </div>
        </div>
    );
}
