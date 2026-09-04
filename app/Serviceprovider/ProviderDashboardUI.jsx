"use client";
import { useState, useEffect, useCallback } from "react";
import {
  ChevronDown,
  ChevronRight,
  ShoppingBag,
  Briefcase,
  Calendar,
  Wallet,
  MapPin,
  User,
  Droplets,
  Zap,
  Hammer,
  PaintRoller,
  Bug,
  WashingMachine,
  CheckCircle2,
  Star,
  Shield,
} from "lucide-react";
import styles from "./ProviderDashboard.module.css";
import NotificationBanner from "../../components/NotificationBanner/NotificationBanner";

// Helper for service icon and styling
const SERVICE_ICONS = {
  carpentry: { icon: Hammer, bg: "#EAF0FB", color: "#3B5EDB" },
  electrical: { icon: Zap, bg: "#FDF3DC", color: "#E3A008" },
  appliance: { icon: WashingMachine, bg: "#F1EEFC", color: "#7C5CE0" },
  plumbing: { icon: Droplets, bg: "#E7F5EE", color: "#1F8A55" },
  pest: { icon: Bug, bg: "#FCE9EE", color: "#D6396B" },
  painting: { icon: PaintRoller, bg: "#EFEEFC", color: "#5B4FCF" },
};

function getServiceMeta(serviceNameOrId = "") {
  const key = String(serviceNameOrId).toLowerCase().trim();
  for (const [id, meta] of Object.entries(SERVICE_ICONS)) {
    if (key.includes(id)) {
      return meta;
    }
  }
  return { icon: Droplets, bg: "#E7F5EE", color: "#1F8A55" };
}

// ---- Small building blocks ----------------------------------------------

function StatCard({ stat }) {
  const Icon = stat.icon;
  return (
    <div className={styles.statCard}>
      <span className={styles.statIconWrap} style={{ background: stat.iconBg }}>
        <Icon size={20} color={stat.iconColor} />
      </span>
      <div className={styles.statLabel}>{stat.label}</div>
      <div className={styles.statValue}>{stat.value}</div>
      <div className={`${styles.statNote} ${styles[`note_${stat.noteColor}`]}`}>
        {stat.note}
      </div>
    </div>
  );
}

function RequestCard({
  request,
  onAccept,
  onReject,
}) {
  const meta = getServiceMeta(request.category);
  const Icon = meta.icon;

  return (
    <div className={styles.requestCard}>
      <div className={styles.requestTop}>
        <span className={styles.requestIconWrap} style={{ background: meta.bg }}>
          <Icon size={22} color={meta.color} />
        </span>

        <div className={styles.requestInfo}>
          <div className={styles.requestCategory}>{request.category}</div>
          <div className={styles.requestTitle}>{request.title}</div>
          <div className={styles.requestMetaRow}>
            <User size={14} />
            {request.customer}
          </div>
          <div className={styles.requestMetaRow}>
            <MapPin size={14} />
            {request.distance}
            <span className={styles.metaDot}>•</span>
            <Calendar size={14} />
            {request.time}
          </div>
        </div>

        <div className={styles.priceBox}>
          <div className={styles.priceValue}>
            ₹{request.price}
          </div>
          <div className={styles.priceLabel}>Estimated Total</div>
        </div>
      </div>

      <p className={styles.requestDescription}>{request.description}</p>

      <div className={styles.requestBottom}>
        <div className={styles.photoStrip}>
          {Array.from({ length: Math.min(request.photos || 0, 4) }).map((_, i) => (
            <div key={i} className={styles.photoThumb} />
          ))}
        </div>

        <div className={styles.requestActions}>
          <button
            type="button"
            className={styles.viewDetailsBtn}
            onClick={() => onReject(request)}
          >
            Decline
          </button>

          <button
            type="button"
            className={styles.acceptBtn}
            onClick={() => onAccept(request)}
          >
            <CheckCircle2 size={16} />
            Accept Request
          </button>
        </div>
      </div>
    </div>
  );
}

function ScheduleItem({ item, onUpdateStatus }) {
  const meta = getServiceMeta(item.title);
  const Icon = meta.icon;

  return (
    <div className={styles.scheduleItem}>
      <span className={styles.scheduleIconWrap} style={{ background: meta.bg }}>
        <Icon size={18} color={meta.color} />
      </span>
      <div className={styles.scheduleInfo}>
        <div className={styles.scheduleTitle}>{item.title}</div>
        <div className={styles.scheduleCustomer}>{item.customer}</div>
        {item.status && (
          <div
            style={{
              fontSize: "11px",
              fontWeight: "600",
              color: item.status === "in_progress" ? "#D97706" : "#1e9e5a",
              marginTop: "3px",
            }}
          >
            {item.status === "in_progress" ? "● In Progress" : "● Scheduled"}
          </div>
        )}
      </div>
      <div className={styles.scheduleMeta}>
        <div className={styles.scheduleTime}>{item.time}</div>
        <div className={styles.scheduleDistance}>
          <MapPin size={12} />
          {item.distance}
        </div>

        {onUpdateStatus && item.rawId && (
          <div style={{ marginTop: "6px", display: "flex", gap: "4px", justifyContent: "flex-end" }}>
            {item.status === "accepted" && (
              <button
                type="button"
                onClick={() => onUpdateStatus(item.rawId, "in_progress")}
                style={{
                  background: "#1e9e5a",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "6px",
                  padding: "4px 8px",
                  fontSize: "11px",
                  fontWeight: "600",
                  cursor: "pointer",
                }}
              >
                Start Job
              </button>
            )}
            {item.status === "in_progress" && (
              <button
                type="button"
                onClick={() => onUpdateStatus(item.rawId, "completed")}
                style={{
                  background: "#3b82f6",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "6px",
                  padding: "4px 8px",
                  fontSize: "11px",
                  fontWeight: "600",
                  cursor: "pointer",
                }}
              >
                Complete
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function ReviewItem({ review }) {
  return (
    <div className={styles.reviewItem}>
      <div className={styles.reviewAvatar}>{review.avatarInitial}</div>
      <div className={styles.reviewBody}>
        <div className={styles.reviewHead}>
          <div className={styles.stars}>
            {Array.from({ length: review.rating || 5 }).map((_, i) => (
              <Star key={i} size={13} fill="#F5A524" color="#F5A524" />
            ))}
          </div>
          <span className={styles.reviewDate}>{review.date}</span>
        </div>
        <p className={styles.reviewQuote}>&ldquo;{review.quote}&rdquo;</p>
        <div className={styles.reviewer}>— {review.name}</div>
      </div>
    </div>
  );
}

// ---- Main component ------------------------------------------------------

export default function ProviderDashboard() {
  const [online, setOnline] = useState(true);
  const [session, setSession] = useState(null);
  const [verificationStatus, setVerificationStatus] = useState("pending");

  const [notification, setNotification] = useState({
    show: false,
    message: "",
    type: "error",
  });

  const [statsData, setStatsData] = useState({
    requestsCount: 0,
    acceptedCount: 0,
    todayCount: 0,
    monthlyEarnings: 0,
  });

  const [requests, setRequests] = useState([]);
  const [schedule, setSchedule] = useState([]);
  const [reviews, setReviews] = useState([]);

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

  // Fetch Provider Statistics & Schedule
  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch("/api/provider/stats");
      if (!res.ok) return;
      const data = await res.json();
      if (data.success) {
        setStatsData(data.stats);
        if (typeof data.provider?.isOnline === "boolean") {
          setOnline(data.provider.isOnline);
        }
        if (data.provider?.verificationStatus) {
          setVerificationStatus(data.provider.verificationStatus);
        }

        // Format active schedule
        if (Array.isArray(data.schedule)) {
          const formattedSchedule = data.schedule.map((b) => ({
            id: b._id,
            rawId: b._id,
            title: b.services?.[0]?.name || "Home Service",
            customer: b.customerId?.name || "Customer",
            time: `${b.preferredDate} (${b.preferredTime})`,
            distance: b.address ? b.address.slice(0, 25) + "..." : "Local",
            status: b.status,
          }));
          setSchedule(formattedSchedule);
        }

        // Format reviews
        if (Array.isArray(data.reviews)) {
          const formattedReviews = data.reviews.map((r) => ({
            id: r._id,
            name: r.customerId?.name || "Verified Customer",
            date: new Date(r.createdAt).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
              year: "numeric",
            }),
            rating: r.rating || 5,
            quote: r.comment || "Great service! Very satisfied.",
            avatarInitial: (r.customerId?.name || "C").charAt(0).toUpperCase(),
          }));
          setReviews(formattedReviews);
        }
      }
    } catch (error) {
      console.error("Fetch stats error:", error);
    }
  }, []);

  // Fetch Pending Requests
  const fetchRequests = useCallback(async () => {
    try {
      const res = await fetch("/api/provider/requests");
      if (!res.ok) return;
      const data = await res.json();
      if (data.success && Array.isArray(data.requests)) {
        const formatted = data.requests.map((r) => {
          const b = r.bookingId || {};
          const serviceName = b.services?.[0]?.name || "Service Request";
          const problemName = b.services?.[0]?.problem || "Issue Fix";
          return {
            id: r._id,
            requestId: r._id,
            bookingId: b._id,
            category: serviceName,
            title: problemName,
            customer: b.customerId?.name || "Customer",
            distance: `${r.distanceKm || 2.5} km away`,
            time: `${b.preferredDate || "Today"}, ${b.preferredTime || "Soon"}`,
            description: b.description || "Service request details provided by customer.",
            price: b.estimatedTotal || 499,
            photos: Array.isArray(b.photos) ? b.photos.length : 0,
          };
        });
        setRequests(formatted);
      }
    } catch (error) {
      console.error("Fetch requests error:", error);
    }
  }, []);

  // Initial load and polling
  useEffect(() => {
    const init = async () => {
      try {
        const res = await fetch("/api/auth/session");
        if (res.ok) {
          const data = await res.json();
          if (data.success) {
            setSession(data.user);
          }
        }
      } catch (err) {
        console.error("Session fetch error:", err);
      }
      await fetchStats();
      await fetchRequests();
    };

    init();

    const interval = setInterval(() => {
      fetchStats();
      fetchRequests();
    }, 8000);

    return () => clearInterval(interval);
  }, [fetchStats, fetchRequests]);

  // Toggle Online/Offline State
  const handleToggleOnline = async () => {
    try {
      const nextOnline = !online;
      setOnline(nextOnline);
      const res = await fetch("/api/provider/toggle-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ online: nextOnline }),
      });
      const data = await res.json();
      if (data.success) {
        showNotification(data.message, "success");
      }
    } catch (err) {
      console.error("Toggle online error:", err);
      showNotification("Could not update status.");
    }
  };

  // Accept a Request
  const handleAcceptRequest = async (request) => {
    try {
      const res = await fetch(`/api/provider/requests/${request.requestId}/accept`, {
        method: "POST",
      });
      const data = await res.json();

      if (!res.ok) {
        showNotification(data.message || "Failed to accept request.");
        return;
      }

      showNotification(data.message || "Request accepted! Added to your schedule.", "success");
      await fetchStats();
      await fetchRequests();
    } catch (err) {
      console.error("Accept request error:", err);
      showNotification("Failed to accept request.");
    }
  };

  // Reject a Request
  const handleRejectRequest = async (request) => {
    try {
      const res = await fetch(`/api/provider/requests/${request.requestId}/reject`, {
        method: "POST",
      });
      const data = await res.json();

      if (!res.ok) {
        showNotification(data.message || "Failed to decline request.");
        return;
      }

      showNotification("Request declined.", "success");
      setRequests((prev) => prev.filter((r) => r.id !== request.id));
      await fetchStats();
    } catch (err) {
      console.error("Reject request error:", err);
    }
  };

  // Progress Job Status (in_progress, completed)
  const handleUpdateJobStatus = async (bookingId, newStatus) => {
    try {
      const res = await fetch(`/api/provider/jobs/${bookingId}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newStatus }),
      });
      const data = await res.json();

      if (!res.ok) {
        showNotification(data.message || "Could not update job status.");
        return;
      }

      showNotification(data.message || "Status updated successfully!", "success");
      await fetchStats();
    } catch (err) {
      console.error("Update job status error:", err);
      showNotification("Failed to update job status.");
    }
  };

  const dynamicStats = [
    {
      id: "requests",
      label: "New Requests",
      value: requests.length,
      note: requests.length > 0 ? "Pending action" : "Up to date",
      noteColor: requests.length > 0 ? "purple" : "green",
      icon: ShoppingBag,
      iconBg: "#E7F5EE",
      iconColor: "#1F8A55",
    },
    {
      id: "accepted",
      label: "Active Jobs",
      value: statsData.acceptedCount,
      note: statsData.acceptedCount > 0 ? "In progress" : "No active jobs",
      noteColor: "purple",
      icon: Briefcase,
      iconBg: "#F1EEFC",
      iconColor: "#7C5CE0",
    },
    {
      id: "today",
      label: "Today's Jobs",
      value: statsData.todayCount,
      note: "Scheduled today",
      noteColor: "blue",
      icon: Calendar,
      iconBg: "#E9F1FE",
      iconColor: "#3B82F6",
    },
    {
      id: "earnings",
      label: "Earnings (This Month)",
      value: `₹${(statsData.monthlyEarnings || 0).toLocaleString("en-IN")}`,
      note: "From completed jobs",
      noteColor: "green",
      icon: Wallet,
      iconBg: "#FDF3DC",
      iconColor: "#E3A008",
    },
  ];

  return (
    <>
      {notification.show && (
        <NotificationBanner
          message={notification.message}
          type={notification.type}
          onClose={hideNotification}
        />
      )}

      <div className={styles.page}>
        <div className={styles.content}>
          {/* Greeting row */}
          <div className={styles.greetingRow}>
            <div>
              <h1 className={styles.greeting}>
                Good Day, {session?.name || "Provider"} 👋
              </h1>
              <p className={styles.greetingSub}>
                Here&apos;s what&apos;s happening with your services today.
              </p>
            </div>

            <button
              type="button"
              className={styles.onlineToggle}
              onClick={handleToggleOnline}
            >
              <span
                className={styles.onlineDot}
                style={{ background: online ? "#22C55E" : "#A1A1AA" }}
              />
              {online ? "Online" : "Offline"}
              <ChevronDown size={16} />
            </button>
          </div>

          {/* Verification Banner (Plan.txt Note #3) */}
          {verificationStatus !== "verified" && (
            <div
              style={{
                background: "#FFFBEB",
                border: "1px solid #FDE68A",
                borderRadius: "12px",
                padding: "14px 20px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "20px",
                flexWrap: "wrap",
                gap: "10px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <Shield size={22} color="#D97706" />
                <div>
                  <strong style={{ color: "#92400E", fontSize: "14px", display: "block" }}>
                    Identity Verification Required
                  </strong>
                  <span style={{ color: "#B45309", fontSize: "13px" }}>
                    Please submit your government document and selfie to unlock verified partner benefits.
                  </span>
                </div>
              </div>
              <a
                href="/Register/Verify_docs"
                style={{
                  background: "#D97706",
                  color: "#FFFFFF",
                  padding: "8px 16px",
                  borderRadius: "8px",
                  fontSize: "13px",
                  fontWeight: "600",
                  textDecoration: "none",
                }}
              >
                Verify Now
              </a>
            </div>
          )}

          {/* Stat cards */}
          <div className={styles.statGrid}>
            {dynamicStats.map((s) => (
              <StatCard key={s.id} stat={s} />
            ))}
          </div>

          {/* Main grid */}
          <div className={styles.mainGrid}>
            {/* Left: requests */}
            <div className={styles.leftCol}>
              <div className={styles.panel}>
                <div className={styles.panelHead}>
                  <span className={styles.panelTitle}>
                    New Service Requests ({requests.length})
                  </span>
                  <button
                    type="button"
                    className={styles.viewAllBtn}
                    onClick={fetchRequests}
                  >
                    Refresh <ChevronRight size={15} />
                  </button>
                </div>

                <div className={styles.requestList}>
                  {requests.length === 0 ? (
                    <div
                      style={{
                        padding: "36px 20px",
                        textAlign: "center",
                        color: "var(--text-muted)",
                        fontSize: "14px",
                      }}
                    >
                      No new service requests right now. When customers book a service in your area, they will appear here.
                    </div>
                  ) : (
                    requests.map((r) => (
                      <RequestCard
                        key={r.id}
                        request={r}
                        onAccept={handleAcceptRequest}
                        onReject={handleRejectRequest}
                        onViewDetails={() => {}}
                      />
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Right: sidebar */}
            <div className={styles.rightCol}>
              <div className={styles.panel}>
                <div className={styles.panelHead}>
                  <span className={styles.panelTitle}>Active Schedule</span>
                  <button
                    type="button"
                    className={styles.viewAllLink}
                    onClick={fetchStats}
                  >
                    Refresh
                  </button>
                </div>
                <div className={styles.scheduleList}>
                  {schedule.length === 0 ? (
                    <div
                      style={{
                        padding: "20px 0",
                        color: "var(--text-muted)",
                        fontSize: "13px",
                        textAlign: "center",
                      }}
                    >
                      No active jobs in your schedule.
                    </div>
                  ) : (
                    schedule.map((s) => (
                      <ScheduleItem
                        key={s.id}
                        item={s}
                        onUpdateStatus={handleUpdateJobStatus}
                      />
                    ))
                  )}
                </div>
              </div>

              <div className={styles.panel}>
                <div className={styles.panelHead}>
                  <span className={styles.panelTitle}>Recent Reviews</span>
                </div>
                <div className={styles.reviewList}>
                  {reviews.length === 0 ? (
                    <div
                      style={{
                        padding: "20px 0",
                        color: "var(--text-muted)",
                        fontSize: "13px",
                        textAlign: "center",
                      }}
                    >
                      No customer reviews yet. Reviews will appear after jobs are completed.
                    </div>
                  ) : (
                    reviews.map((r) => (
                      <ReviewItem key={r.id} review={r} />
                    ))
                  )}
                </div>
              </div>

              <div className={styles.tipBanner}>
                <span className={styles.tipIconWrap}>
                  <Shield size={20} color="#FFFFFF" />
                </span>
                <div>
                  <div className={styles.tipTitle}>Keep Your Rating High!</div>
                  <p className={styles.tipText}>
                    Fast response times and polite communication lead to 5-star ratings and higher marketplace ranking.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
