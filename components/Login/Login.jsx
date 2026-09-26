"use client";

import { useState } from "react";
import "./Login.css";
import NotificationBanner from "../../components/NotificationBanner/NotificationBanner";
import { Phone, Lock, Eye, EyeOff, X, ArrowRight, ShieldCheck, Loader2 } from "lucide-react";

export default function Login({ closeLogin, onLoginSuccess }) {
  const [LoginData, setLoginData] = useState({
    phone: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const [notification, setNotification] = useState({
    show: false,
    message: "",
    type: "error",
  });

  const showNotification = (message, type = "error") => {
    setNotification({
      show: true,
      message,
      type,
    });
  };

  const hideNotification = () => {
    setNotification({
      show: false,
      message: "",
      type: "error",
    });
  };

  // Handle login input changes
  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "phone") {
      const numbersOnly = value.replace(/\D/g, "").slice(0, 10);
      setLoginData((prev) => ({
        ...prev,
        phone: numbersOnly,
      }));
      return;
    }

    setLoginData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Verify login credentials
  const handleLogin = async () => {
    if (!LoginData.phone) {
      showNotification("Please enter your mobile number.");
      return;
    }

    if (LoginData.phone.length !== 10) {
      showNotification("Please enter a valid 10-digit mobile number.");
      return;
    }

    if (!LoginData.password) {
      showNotification("Please enter your password.");
      return;
    }

    try {
      setLoading(true);
      const response = await fetch("/api/auth/check-login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phone: LoginData.phone,
          password: LoginData.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        showNotification(data.message || "Login failed.");
        setLoading(false);
        return;
      }

      // Update Navbar session
      await onLoginSuccess();

      setTimeout(() => {
        if (data.user?.role === "serviceprovider") {
          window.location.href = "/Serviceprovider";
        } else {
          window.location.href = "/Dashboard";
        }
      }, 600);
    } catch (error) {
      console.error("Login Error:", error);
      showNotification("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="login-overlay" onClick={closeLogin}>
      {notification.show && (
        <NotificationBanner
          message={notification.message}
          type={notification.type}
          onClose={hideNotification}
        />
      )}

      <div
        className="login-card"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="login-title"
      >
        <button
          type="button"
          className="close-btn"
          onClick={closeLogin}
          aria-label="Close modal"
        >
          <X size={18} />
        </button>

        <div className="login-header">
          <div className="login-icon-badge">
            <ShieldCheck size={26} color="#04B204" />
          </div>
          <h2 id="login-title" className="login-title">
            Welcome to <span className="signcolor">SmartServe</span>
          </h2>
          <p className="login-subtitle">
            Sign in with your registered phone number to manage or book services.
          </p>
        </div>

        <form
          className="login-form"
          onSubmit={(e) => {
            e.preventDefault();
            handleLogin();
          }}
        >
          <div className="input-group">
            <label htmlFor="login-phone">Mobile Number</label>
            <div className="login-input-wrap">
              <Phone size={18} className="input-prefix-icon" />
              <span className="phone-prefix">+91</span>
              <span className="input-divider" />
              <input
                id="login-phone"
                type="tel"
                name="phone"
                placeholder="Enter 10-digit number"
                value={LoginData.phone}
                onChange={handleChange}
                maxLength={10}
                inputMode="numeric"
                autoFocus
              />
            </div>
          </div>

          <div className="input-group">
            <label htmlFor="login-password">Password</label>
            <div className="login-input-wrap">
              <Lock size={18} className="input-prefix-icon" />
              <input
                id="login-password"
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Enter your password"
                value={LoginData.password}
                onChange={handleChange}
              />
              <button
                type="button"
                className="eye-toggle-btn"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="login-options">
            <label className="remember">
              <input type="checkbox" defaultChecked />
              <span>Remember me</span>
            </label>

            <button
              type="button"
              className="forgot-btn"
              onClick={() => showNotification("Please contact support to reset your password.", "success")}
            >
              Forgot Password?
            </button>
          </div>

          <button
            type="submit"
            className="login-btn"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 size={18} className="spin-icon" />
                <span>Logging In...</span>
              </>
            ) : (
              <>
                <span>Sign In</span>
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        <div className="divider">
          <span>OR</span>
        </div>

        <p className="signup-text">
          Don&apos;t have an account yet?
          <button
            type="button"
            className="signup-link"
            onClick={() => {
              closeLogin();
              window.location.href = "/Register";
            }}
          >
            Create an Account
          </button>
        </p>
      </div>
    </div>
  );
}