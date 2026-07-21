"use client";

import "./Login.css";

export default function Login({ closeLogin }) {
  return (
    <div className="login-overlay">
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
          <h1>Sign <span className="signcolor">in</span></h1>
          <p>Access your SmartServe account.</p>
        </div>

        <form className="login-form">
          <div className="input-group">
            <label>Email Address</label>
            <input
              type="email"
              placeholder="Enter your email"
            />
          </div>

          <div className="input-group">
            <label>Password</label>
            <input
              type="password"
              placeholder="Enter your password"
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
            Sign in
          </button>
        </form>

        <div className="divider">
          <span>OR</span>
        </div>

        <button className="google-btn">
          Continue with Google
        </button>

        <p className="signup-text">
          Don't have an account?
          <button className="signup-link">
            Create one
          </button>
        </p>
      </div>
    </div>
  );
}