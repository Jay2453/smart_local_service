"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import "./Navbar.css";
import Image from "next/image";
import Login from "@/components/Login/Login";
import NotificationBanner from "../NotificationBanner/NotificationBanner";
const Navbar = () => {
  const [notification, setNotification] = useState({
    show: false,
    message: "",
    type: "error",
  });
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showLogin, setShowLogin] = useState(false);
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

      <div className="navb">

        <Link href="/">
          <Image
            className="mainlogo"
            src="/images/smartserve.png"
            alt="SmartServe Logo"
            width={165}
            height={43}
          />
        </Link>

        <div className="navoptbuts">
          <ul className="nav-con">
            <li>
              <Link href="/">Home</Link>
            </li>
            <li>
              <Link href="/#services">
                Services
              </Link>
            </li>
            <li>
              <Link href="/#about">
                About Us
              </Link>
            </li>

            {/* Dashboard only visible when logged in */}
            {session && (
              <li>
                <Link href={
                  session.role === "serviceprovider"
                    ? "/Serviceprovider"
                    : "/Dashboard"
                }>
                  Dashboard
                </Link>
              </li>
            )}

            {/* Login when logged out */}
            {!session && !loading && (
              <li>
                <Link
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    setShowLogin(true);
                  }}
                >
                  Login
                </Link>
              </li>
            )}

            {/* Logout when logged in */}
            {session && (
              <li className="logout">
                <Link
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    handleLogout();
                  }}
                >
                  Logout
                </Link>
              </li>
            )}
          </ul>
        </div>
        <div className="profile">
          <span className="profile_name">
            {loading
              ? "..."
              : session
                ? session.name
                : "GUEST"
            }
          </span>
          <Image
            className="profile_logo"
            src="/images/profileLogo.jpg"
            alt="Guest profile"
            width={40}
            height={40}
          />
        </div>
      </div>
    </>
  );
};

export default Navbar;