"use client";
import { useState } from "react";
import "./Login.css";
import NotificationBanner from "../../components/NotificationBanner/NotificationBanner";

export default function Login({ closeLogin }) {

    const [LoginData, setLoginData] = useState({
        phone: "",
        password: "",
    });

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
                return;
            }

            console.log("Login successful:", data);

            setTimeout(() => {
                if (data.user.role === "serviceprovider") {
                    window.location.href = "/Serviceprovider";
                } else {
                    window.location.href = "/Dashboard";
                }
            }, 800);

        } catch (error) {
            console.error("Login Error:", error);
            showNotification("Something went wrong. Please try again.");
        }
    };

    return (
        <div className="login-overlay">

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
            >

                <button
                    className="close-btn"
                    onClick={closeLogin}
                >
                    ✕
                </button>

                <div className="login-header">
                    <h1>
                        Log<span className="signcolor">in</span>
                    </h1>
                    <p>Access your SmartServe account.</p>
                </div>

                <form
                    className="login-form"
                    onSubmit={(e) => {
                        e.preventDefault();
                        handleLogin();
                    }}
                >

                    <div className="input-group">
                        <label>Mobile number</label>

                        <input
                            type="tel"
                            name="phone"
                            placeholder="Enter your number"
                            value={LoginData.phone}
                            onChange={handleChange}
                            maxLength={10}
                        />
                    </div>

                    <div className="input-group">
                        <label>Password</label>

                        <input
                            type="password"
                            name="password"
                            placeholder="Enter your password"
                            value={LoginData.password}
                            onChange={handleChange}
                        />
                    </div>

                    <div className="login-options">

                        <label className="remember">
                            <input type="checkbox" />
                            <span>Remember me</span>
                        </label>

                        <button
                            type="button"
                            className="forgot-btn"
                        >
                            Forgot Password?
                        </button>

                    </div>

                    <button
                        type="submit"
                        className="login-btn"
                    >
                        Login
                    </button>

                </form>

                <div className="divider">
                    <span>OR</span>
                </div>

                {/* <button
                    className="google-btn"
                    type="button"
                >
                    Continue with Google
                </button> */}

                <p className="signup-text">
                    Don't have an account?

                    <button
                        type="button"
                        className="signup-link"
                        onClick={() =>
                            window.open("/Register", "_blank")
                        }
                    >
                        Create one
                    </button>
                </p>

            </div>
        </div>
    );
}