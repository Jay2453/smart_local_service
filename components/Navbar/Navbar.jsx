"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import "./Navbar.css";
import Image from "next/image";
import Login from "@/components/Login/Login";
import NotificationBanner from "../NotificationBanner/NotificationBanner";
import { Menu, X, ArrowRight, User as UserIcon, LogOut, LayoutDashboard } from "lucide-react";

const Navbar = () => {
  const [notification, setNotification] = useState({
    show: false,
    message: "",
    type: "error",
  });
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showLogin, setShowLogin] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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

  const getSession = async () => {
    try {
      const response = await fetch("/api/auth/session");
      if (!response.ok) {
        setSession(null);
        return;
      }
      const data = await response.json();
      if (data.success) {
        setSession(data.user);
      } else {
        setSession(null);
      }
    } catch (error) {
      console.error("Session error:", error);
      setSession(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    const fetchSession = async () => {
      try {
        const response = await fetch("/api/auth/session");
        if (!response.ok) {
          if (active) setSession(null);
          return;
        }
        const data = await response.json();
        if (active) {
          setSession(data.success ? data.user : null);
        }
      } catch (error) {
        console.error("Session error:", error);
        if (active) setSession(null);
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchSession();

    const handleServiceAction = (event) => {
      const { type } = event.detail;

      if (!session) {
        setShowLogin(true);
        return;
      }

      if (type === "book") {
        if (session.role !== "customer") {
          showNotification("You are not registered as a customer.");
          return;
        }
        window.location.href = "/Dashboard";
      }

      if (type === "offer") {
        if (session.role !== "serviceprovider") {
          showNotification("You are not registered as a service provider.");
          return;
        }
        window.location.href = "/Serviceprovider";
      }
    };

    window.addEventListener("service-action", handleServiceAction);

    return () => {
      active = false;
      window.removeEventListener("service-action", handleServiceAction);
    };
  }, [session]);

  // Handle logout
  const handleLogout = async () => {
    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
      });

      const data = await response.json();

      if (data.success) {
        setSession(null);
        setMobileMenuOpen(false);
        window.location.href = "/";
      }
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  // Update Navbar after successful login
  const handleLoginSuccess = async () => {
    await getSession();
    setShowLogin(false);
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  return (
    <>
      {notification.show && (
        <NotificationBanner
          message={notification.message}
          type={notification.type}
          onClose={hideNotification}
        />
      )}
      {showLogin && (
        <Login
          closeLogin={() => setShowLogin(false)}
          onLoginSuccess={handleLoginSuccess}
        />
      )}

      <header className="navbar-wrapper">
        <nav className="navb" aria-label="Main Navigation">
          <div className="nav-container">
            <Link href="/" className="logo-link" onClick={closeMobileMenu}>
              <Image
                className="mainlogo"
                src="/images/smartserve.png"
                alt="SmartServe Logo"
                width={155}
                height={38}
                priority
              />
            </Link>

            <div className="navoptbuts">
              <ul className="nav-con">
                <li>
                  <Link href="/" className="nav-link">
                    Home
                  </Link>
                </li>
                <li>
                  <Link href="/#services" className="nav-link">
                    Services
                  </Link>
                </li>
                <li>
                  <Link href="/#how-it-works" className="nav-link">
                    How it Works
                  </Link>
                </li>
                <li>
                  <Link href="/#about" className="nav-link">
                    About Us
                  </Link>
                </li>
                <li>
                  <Link href="#contact" className="nav-link">
                    Contact
                  </Link>
                </li>

                {/* Dashboard only visible when logged in */}
                {session && (
                  <li>
                    <Link
                      href={
                        session.role === "serviceprovider"
                          ? "/Serviceprovider"
                          : "/Dashboard"
                      }
                      className="nav-link nav-link-dashboard"
                    >
                      Dashboard
                    </Link>
                  </li>
                )}
              </ul>
            </div>

            <div className="nav-right-actions">
              {/* Login button when logged out */}
              {!session && !loading && (
                <button
                  type="button"
                  className="nav-login-btn"
                  onClick={() => setShowLogin(true)}
                >
                  <span>Login</span>
                  <ArrowRight size={16} />
                </button>
              )}

              {/* Profile / Logout section when logged in */}
              {session && (
                <div className="nav-auth-group">
                  <div
                    className="profile"
                    title={`Logged in as ${session.name} (${session.role === "serviceprovider" ? "Provider" : "Customer"})`}
                  >
                    <span className="profile_name">
                      {session.name}
                    </span>
                    <Image
                      className="profile_logo"
                      src="/images/profileLogo.jpg"
                      alt={session.name || "User profile"}
                      width={38}
                      height={38}
                    />
                  </div>

                  <button
                    type="button"
                    className="nav-logout-btn"
                    onClick={handleLogout}
                    title="Logout"
                  >
                    <LogOut size={16} />
                    <span className="logout-text">Logout</span>
                  </button>
                </div>
              )}

              {/* Mobile Hamburger Button */}
              <button
                type="button"
                className="hamburger-btn"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label="Toggle navigation menu"
                aria-expanded={mobileMenuOpen}
              >
                {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </nav>

        {/* Mobile Navigation Drawer / Dropdown */}
        <div
          className={`mobile-nav-overlay ${mobileMenuOpen ? "is-open" : ""}`}
          onClick={closeMobileMenu}
        />
        <div className={`mobile-nav-drawer ${mobileMenuOpen ? "is-open" : ""}`}>
          <div className="mobile-nav-header">
            <Image
              src="/images/smartserve.png"
              alt="SmartServe Logo"
              width={140}
              height={34}
            />
            <button
              type="button"
              className="mobile-close-btn"
              onClick={closeMobileMenu}
              aria-label="Close menu"
            >
              <X size={22} />
            </button>
          </div>

          <div className="mobile-user-status">
            <div className="mobile-user-info">
              <Image
                src="/images/profileLogo.jpg"
                alt="Profile"
                width={38}
                height={38}
                className="mobile-avatar"
              />
              <div>
                <p className="mobile-user-name">
                  {loading ? "Loading..." : session ? session.name : "Guest User"}
                </p>
                <p className="mobile-user-role">
                  {session ? (session.role === "serviceprovider" ? "Service Provider" : "Customer") : "Welcome to SmartServe"}
                </p>
              </div>
            </div>
          </div>

          <ul className="mobile-nav-links">
            <li>
              <Link href="/" onClick={closeMobileMenu} className="mobile-link">
                Home
              </Link>
            </li>
            <li>
              <Link href="/#services" onClick={closeMobileMenu} className="mobile-link">
                Services
              </Link>
            </li>
            <li>
              <Link href="/#how-it-works" onClick={closeMobileMenu} className="mobile-link">
                How it Works
              </Link>
            </li>
            <li>
              <Link href="/#about" onClick={closeMobileMenu} className="mobile-link">
                About Us
              </Link>
            </li>
            <li>
              <Link href="#contact" onClick={closeMobileMenu} className="mobile-link">
                Contact
              </Link>
            </li>

            {session && (
              <li>
                <Link
                  href={
                    session.role === "serviceprovider"
                      ? "/Serviceprovider"
                      : "/Dashboard"
                  }
                  onClick={closeMobileMenu}
                  className="mobile-link mobile-link-highlight"
                >
                  <LayoutDashboard size={18} />
                  <span>Dashboard</span>
                </Link>
              </li>
            )}
          </ul>

          <div className="mobile-nav-footer">
            {!session && !loading ? (
              <button
                type="button"
                className="mobile-login-btn"
                onClick={() => {
                  closeMobileMenu();
                  setShowLogin(true);
                }}
              >
                <UserIcon size={18} />
                <span>Log In / Sign Up</span>
              </button>
            ) : session ? (
              <button
                type="button"
                className="mobile-logout-btn"
                onClick={handleLogout}
              >
                <LogOut size={18} />
                <span>Log Out</span>
              </button>
            ) : null}
          </div>
        </div>
      </header>
    </>
  );
};

export default Navbar;