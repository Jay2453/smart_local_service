"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import {
  Hammer,
  Zap,
  WashingMachine,
  Droplets,
  Bug,
  PaintRoller,
  MapPin,
  Crosshair,
  Calendar,
  Clock,
  ShieldCheck,
  X,
  Plus,
  Camera,
  ChevronRight,
  Star,
  Phone,
} from "lucide-react";

import styles from "./customer.module.css";
import NotificationBanner from "../../components/NotificationBanner/NotificationBanner";

const SERVICES = [
  {
    id: "carpentry",
    name: "carpentry",
    icon: Hammer,
    iconBg: "#EAF0FB",
    iconColor: "#3B5EDB",
    price: 549,
    problems: [
      "Furniture Repair",
      "Door/Window Fix",
      "Assembly",
      "Polishing",
      "Other",
    ],
  },
  {
    id: "electrical",
    name: "electrical",
    icon: Zap,
    iconBg: "#FDF3DC",
    iconColor: "#E3A008",
    price: 399,
    problems: [
      "Wiring Issue",
      "Switch/Socket",
      "Fan Repair",
      "Tap Repair",
      "Short Circuit",
      "Other",
    ],
  },
  {
    id: "appliance",
    name: "appliance",
    icon: WashingMachine,
    iconBg: "#F1EEFC",
    iconColor: "#7C5CE0",
    price: 599,
    problems: [
      "Not Turning On",
      "Noise Issue",
      "Cooling Problem",
      "Installation",
      "Other",
    ],
  },
  {
    id: "plumbing",
    name: "plumbing",
    icon: Droplets,
    iconBg: "#E7F5EE",
    iconColor: "#1F8A55",
    price: 499,
    problems: [
      "Leakage",
      "Pipe Blockage",
      "Low Water Pressure",
      "Tap Repair",
      "Drainage Issue",
      "Other",
    ],
  },
  {
    id: "pest",
    name: "pest",
    icon: Bug,
    iconBg: "#FCE9EE",
    iconColor: "#D6396B",
    price: 699,
    problems: [
      "Cockroach",
      "Termite",
      "Rodents",
      "Mosquito",
      "Other",
    ],
  },
  {
    id: "painting",
    name: "painting",
    icon: PaintRoller,
    iconBg: "#EFEEFC",
    iconColor: "#5B4FCF",
    price: 799,
    problems: [
      "Wall Touch-up",
      "Full Room",
      "Waterproofing",
      "Other",
    ],
  },
];

// ---- Small building blocks --------------------------------------------

function ServiceCard({ service, selected, onToggle }) {
  const Icon = service.icon;

  return (
    <button
      type="button"
      onClick={() => onToggle(service.id)}
      aria-pressed={selected}
      className={`${styles.serviceCard} ${selected ? styles.serviceCardSelected : ""
        }`}
    >
      <span
        className={styles.serviceIconWrap}
        style={{ background: service.iconBg }}
      >
        <Icon
          size={24}
          color={service.iconColor}
          strokeWidth={2}
        />
      </span>

      <span className={styles.serviceName}>
        {service.name}
      </span>
    </button>
  );
}

function Pill({ label, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`${styles.pill} ${active ? styles.pillActive : ""
        }`}
    >
      {label}
    </button>
  );
}

function SectionLabel({ children }) {
  return (
    <div className={styles.sectionLabel}>
      {children}
    </div>
  );
}

function SummaryRow({
  icon,
  title,
  action,
  onAction,
  children,
}) {
  return (
    <div>
      <div className={styles.summaryRowHead}>
        <div className={styles.summaryRowTitle}>
          {icon}
          {title}
        </div>

        <button
          type="button"
          className={styles.linkBtn}
          onClick={onAction}
        >
          {action}
        </button>
      </div>

      <div className={styles.summaryRowBody}>
        {icon ? (
          <span className={styles.summaryRowSpacer} />
        ) : null}

        <div style={{ flex: 1 }}>
          {children}
        </div>
      </div>
    </div>
  );
}

// ---- Main component -------

export default function BookService() {

  const [FormData, setFormData] = useState({
    address: "",
    longitude: "",
    latitude: "",
  });

  const [preferredDate, setPreferredDate] = useState("");
  const [preferredTime, setPreferredTime] = useState("");
  const [showDateTimePicker, setShowDateTimePicker] = useState(false);

  const [multiService, setMultiService] = useState(false);

  const [selectedIds, setSelectedIds] = useState([]);

  const [activeProblemTab, setActiveProblemTab] =
    useState("");

  const [problemChoice, setProblemChoice] =
    useState({});

  const [description, setDescription] =
    useState("");

  const [photos, setPhotos] =
    useState([]);

  const fileInputRef = useRef(null);


  const [activeView, setActiveView] = useState("book");
  const [myBookings, setMyBookings] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reviewForm, setReviewForm] = useState({
    bookingId: null,
    rating: 5,
    comment: "",
  });

  const [Notification, setNotification] = useState({
    show: false,
    message: "",
    type: "error",
  });

  const fetchMyBookings = useCallback(async () => {
    try {
      const res = await fetch("/api/bookings");
      if (!res.ok) return;
      const data = await res.json();
      if (data.success && Array.isArray(data.bookings)) {
        setMyBookings(data.bookings);
      }
    } catch (err) {
      console.error("Fetch my bookings error:", err);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      try {
        const res = await fetch("/api/bookings");
        if (!res.ok) return;
        const data = await res.json();
        if (isMounted && data.success && Array.isArray(data.bookings)) {
          setMyBookings(data.bookings);
        }
      } catch (err) {
        console.error("Fetch my bookings error:", err);
      }
    };

    load();
    const interval = setInterval(load, 8000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const formatDate = (dateString) => {
    if (!dateString) return "Select date";

    const date = new Date(`${dateString}T00:00:00`);

    return date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric",
      weekday: "long",
    });
  };
  const showNotification = (
    message,
    type = "error"
  ) => {
    setNotification({
      show: true,
      message,
      type,
    });
  };

  const selectedServices = SERVICES.filter((s) =>
    selectedIds.includes(s.id)
  );

  function toggleService(id) {
    setSelectedIds((prev) => {

      let next;

      if (prev.includes(id)) {
        next = prev.filter((x) => x !== id);
      } else if (multiService) {
        next = [...prev, id];
      } else {
        next = [id];
      }

      if (
        next.length &&
        !next.includes(activeProblemTab)
      ) {
        setActiveProblemTab(next[0]);
      }

      if (!next.length) {
        setActiveProblemTab(null);
      }

      return next;
    });
  }

  function removeService(id) {
    toggleService(id);
  }

  function setProblem(serviceId, problem) {
    setProblemChoice((prev) => ({
      ...prev,
      [serviceId]: problem,
    }));
  }

  function handleFiles(e) {

    const files = Array.from(
      e.target.files || []
    );

    const additions = files
      .slice(0, 4 - photos.length)
      .map((f, i) => ({
        id: `${Date.now()}-${i}`,
        label: f.name,
      }));

    setPhotos((prev) => [
      ...prev,
      ...additions,
    ]);

    e.target.value = "";
  }

  function removePhoto(id) {
    setPhotos((prev) =>
      prev.filter((p) => p.id !== id)
    );
  }

  const handleBookService = async () => {
    if (!FormData.address.trim()) {
      showNotification(
        "Please enter your service address.",
        "error"
      );
      return;
    }

    if (!preferredDate) {
      showNotification(
        "Please select your preferred date.",
        "error"
      );
      setShowDateTimePicker(true);
      return;
    }

    if (!preferredTime) {
      showNotification(
        "Please select your preferred time.",
        "error"
      );
      setShowDateTimePicker(true);
      return;
    }

    if (selectedServices.length === 0) {
      showNotification(
        "Please select at least one service.",
        "error"
      );
      return;
    }

    const missingProblem = selectedServices.find(
      (service) => !problemChoice[service.id]
    );

    if (missingProblem) {
      showNotification(
        `Please select a problem for ${missingProblem.name}.`,
        "error"
      );
      return;
    }

    if (!description.trim()) {
      showNotification(
        "Please describe your issue.",
        "error"
      );
      return;
    }

    try {
      setIsSubmitting(true);
      showNotification("Submitting your booking request...", "success");

      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          address: FormData.address,
          latitude: FormData.latitude,
          longitude: FormData.longitude,
          preferredDate,
          preferredTime,
          selectedServices,
          problemChoice,
          description,
          photos: photos.map((p) => p.label),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        showNotification(data.message || "Failed to place booking.", "error");
        setIsSubmitting(false);
        return;
      }

      showNotification(
        data.message || "Service booked successfully!",
        "success"
      );

      // Clear selection
      setSelectedIds([]);
      setDescription("");
      setPhotos([]);
      setProblemChoice({});
      setPreferredDate("");
      setPreferredTime("");
      setIsSubmitting(false);

      // Refresh bookings and view them
      await fetchMyBookings();
      setActiveView("my_bookings");

    } catch (err) {
      console.error("Booking error:", err);
      showNotification("Something went wrong. Please try again.", "error");
      setIsSubmitting(false);
    }
  };

  const handleCancelBooking = async (bookingId) => {
    try {
      const res = await fetch(`/api/bookings/${bookingId}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: "Cancelled by customer" }),
      });
      const data = await res.json();
      if (!res.ok) {
        showNotification(data.message || "Failed to cancel booking.", "error");
        return;
      }
      showNotification("Booking cancelled successfully.", "success");
      await fetchMyBookings();
    } catch (err) {
      console.error("Cancel error:", err);
      showNotification("Failed to cancel booking.", "error");
    }
  };

  const handlePayment = async (bookingId, method = "cash") => {
    try {
      const res = await fetch(`/api/bookings/${bookingId}/payment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ method }),
      });
      const data = await res.json();
      if (!res.ok) {
        showNotification(data.message || "Failed to confirm payment.", "error");
        return;
      }
      showNotification("Payment confirmed successfully!", "success");
      await fetchMyBookings();
    } catch (err) {
      console.error("Payment error:", err);
      showNotification("Failed to process payment.", "error");
    }
  };

  const handleSubmitReview = async (bookingId) => {
    if (!reviewForm.rating) {
      showNotification("Please select a star rating.", "error");
      return;
    }
    try {
      const res = await fetch(`/api/bookings/${bookingId}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rating: reviewForm.rating,
          comment: reviewForm.comment,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        showNotification(data.message || "Failed to submit review.", "error");
        return;
      }
      showNotification("Thank you for your review!", "success");
      setReviewForm({ bookingId: null, rating: 5, comment: "" });
      await fetchMyBookings();
    } catch (err) {
      console.error("Review error:", err);
      showNotification("Failed to submit review.", "error");
    }
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      showNotification(
        "Geolocation is not supported by this browser.",
        "error"
      );
      return;
    }

    showNotification(
      "Requesting your location...",
      "success"
    );

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;

        console.log("LOCATION SUCCESS");
        console.log("Latitude:", latitude);
        console.log("Longitude:", longitude);
        console.log("Accuracy:", position.coords.accuracy);

        try {
          const response = await fetch(
            `/api/location/reverse-geocode?lat=${latitude}&lon=${longitude}`
          );

          console.log(
            "Reverse geocode status:",
            response.status
          );

          const data = await response.json();

          console.log(
            "Reverse geocode response:",
            data
          );

          if (!response.ok) {
            showNotification(
              data.message ||
              "Unable to find your address.",
              "error"
            );
            return;
          }

          setFormData((prev) => ({
            ...prev,
            address: data.address,
            latitude: latitude,
            longitude: longitude,
          }));

          showNotification(
            "Location detected successfully!",
            "success"
          );

        } catch (error) {
          console.error(
            "Reverse geocoding error:",
            error
          );

          showNotification(
            "Location found, but address could not be detected.",
            "error"
          );
        }
      },

      (error) => {
        console.error(
          "GEOLOCATION ERROR:",
          error
        );

        console.log("Error code:", error.code);
        console.log("Error message:", error.message);

        if (error.code === 1) {
          showNotification(
            "Location permission was denied.",
            "error"
          );
        } else if (error.code === 2) {
          showNotification(
            "Your device could not determine your location.",
            "error"
          );
        } else if (error.code === 3) {
          showNotification(
            "Location request timed out.",
            "error"
          );
        } else {
          showNotification(
            "Unable to detect your location.",
            "error"
          );
        }
      },

      {
        enableHighAccuracy: true,
        timeout: 20000,
        maximumAge: 0,
      }
    );
  };

  const total = selectedServices.reduce(
    (sum, s) => sum + s.price,
    0
  );

  const activeService = SERVICES.find(
    (s) => s.id === activeProblemTab
  );

  return (
    <>
      {Notification.show && (
        <NotificationBanner
          message={Notification.message}
          type={Notification.type}
          onClose={() =>
            setNotification({
              show: false,
              message: "",
              type: "error",
            })
          }
        />
      )}
      <div className={styles.page}>

        <div className={styles.grid}>

          <div className={styles.card}>
            <div className={styles.pillRow} style={{ marginTop: 0, marginBottom: "24px" }}>
              <Pill
                label="Book a Service"
                active={activeView === "book"}
                onClick={() => setActiveView("book")}
              />
              <Pill
                label={`My Bookings ${myBookings.length > 0 ? `(${myBookings.length})` : ""}`}
                active={activeView === "my_bookings"}
                onClick={() => setActiveView("my_bookings")}
              />
            </div>

            {activeView === "my_bookings" ? (
              <div>
                <h1 className={styles.title}>My Service Bookings</h1>
                <p className={styles.subtitle}>
                  Track your service requests, assigned professionals, and completion status.
                </p>

                {myBookings.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "48px 20px" }}>
                    <p style={{ color: "var(--text-muted)", fontSize: "14.5px", marginBottom: "18px" }}>
                      You haven&apos;t booked any services yet.
                    </p>
                    <button
                      type="button"
                      className={styles.submitBtn}
                      style={{ maxWidth: "240px", margin: "0 auto", justifyContent: "center" }}
                      onClick={() => setActiveView("book")}
                    >
                      Book a Service Now
                    </button>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
                    {myBookings.map((b) => {
                      const statusMap = {
                        pending: { bg: "#FDF3DC", color: "#B45309", label: "Searching for Providers..." },
                        accepted: { bg: "#E9F1FE", color: "#1D4ED8", label: `Accepted by ${b.assignedProviderId?.name || "Provider"}` },
                        in_progress: { bg: "#F1EEFC", color: "#6D28D9", label: "Service In Progress" },
                        completed: { bg: "#E7F5EE", color: "#15803D", label: "Completed" },
                        cancelled: { bg: "#FCE9EE", color: "#BE123C", label: "Cancelled" },
                      };
                      const st = statusMap[b.status] || statusMap.pending;

                      return (
                        <div
                          key={b._id}
                          style={{
                            border: "1px solid var(--border)",
                            borderRadius: "14px",
                            padding: "20px",
                            background: "#ffffff",
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "flex-start",
                              flexWrap: "wrap",
                              gap: "10px",
                              marginBottom: "12px",
                            }}
                          >
                            <div>
                              <h3 style={{ fontSize: "16px", fontWeight: "700", margin: "0 0 4px" }}>
                                {b.services?.map((s) => s.name).join(", ") || "Service Request"}
                              </h3>
                              <div style={{ fontSize: "13px", color: "var(--text-muted)" }}>
                                Booking #{b._id.slice(-6)} • {b.preferredDate} ({b.preferredTime})
                              </div>
                            </div>

                            <span
                              style={{
                                background: st.bg,
                                color: st.color,
                                fontSize: "12.5px",
                                fontWeight: "600",
                                padding: "4px 12px",
                                borderRadius: "999px",
                              }}
                            >
                              {st.label}
                            </span>
                          </div>

                          <div style={{ fontSize: "13.5px", color: "var(--text-sub)", margin: "8px 0" }}>
                            <strong>Address:</strong> {b.address}
                          </div>

                          <div style={{ fontSize: "13.5px", color: "var(--text-sub)", margin: "8px 0" }}>
                            <strong>Issue:</strong> {b.description}
                          </div>

                          {b.assignedProviderId && (
                            <div
                              style={{
                                background: "var(--green-bg-soft)",
                                border: "1px solid #cdeedc",
                                borderRadius: "10px",
                                padding: "12px 16px",
                                marginTop: "12px",
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                flexWrap: "wrap",
                                gap: "8px",
                              }}
                            >
                              <div>
                                <div style={{ fontWeight: "600", fontSize: "13.5px" }}>
                                  Assigned Provider: {b.assignedProviderId.name}
                                </div>
                                <div style={{ fontSize: "12.5px", color: "var(--text-muted)" }}>
                                  ⭐ {b.assignedProviderId.rating || "5.0"} ({b.assignedProviderId.reviewCount || 0} reviews)
                                </div>
                              </div>
                              {b.assignedProviderId.phone && (
                                <a
                                  href={`tel:${b.assignedProviderId.phone}`}
                                  style={{
                                    fontSize: "13px",
                                    fontWeight: "600",
                                    color: "var(--green)",
                                    textDecoration: "none",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "4px",
                                  }}
                                >
                                  <Phone size={14} /> Call {b.assignedProviderId.phone}
                                </a>
                              )}
                            </div>
                          )}

                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              marginTop: "16px",
                              paddingTop: "14px",
                              borderTop: "1px solid var(--border-soft)",
                              flexWrap: "wrap",
                              gap: "10px",
                            }}
                          >
                            <div style={{ fontSize: "15px", fontWeight: "700" }}>
                              Total: <span style={{ color: "var(--green)" }}>₹{b.estimatedTotal}</span>
                            </div>

                            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                              {(b.status === "pending" || b.status === "accepted") && (
                                <button
                                  type="button"
                                  onClick={() => handleCancelBooking(b._id)}
                                  style={{
                                    background: "none",
                                    border: "1px solid #FCA5A5",
                                    color: "#DC2626",
                                    padding: "6px 12px",
                                    borderRadius: "8px",
                                    fontSize: "13px",
                                    fontWeight: "600",
                                    cursor: "pointer",
                                  }}
                                >
                                  Cancel Booking
                                </button>
                              )}

                              {b.status === "completed" && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => handlePayment(b._id, "cash")}
                                    style={{
                                      background: "none",
                                      border: "1px solid #86EFAC",
                                      color: "#16A34A",
                                      padding: "6px 12px",
                                      borderRadius: "8px",
                                      fontSize: "13px",
                                      fontWeight: "600",
                                      cursor: "pointer",
                                    }}
                                  >
                                    Confirm Payment (₹{b.estimatedTotal})
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() =>
                                      setReviewForm((prev) => ({
                                        ...prev,
                                        bookingId: prev.bookingId === b._id ? null : b._id,
                                      }))
                                    }
                                    style={{
                                      background: "var(--green)",
                                      border: "none",
                                      color: "#ffffff",
                                      padding: "6px 14px",
                                      borderRadius: "8px",
                                      fontSize: "13px",
                                      fontWeight: "600",
                                      cursor: "pointer",
                                    }}
                                  >
                                    {reviewForm.bookingId === b._id ? "Close Review" : "Leave Review"}
                                  </button>
                                </>
                              )}
                            </div>
                          </div>

                          {/* Inline Review Form if opened */}
                          {reviewForm.bookingId === b._id && (
                            <div
                              style={{
                                marginTop: "14px",
                                padding: "16px",
                                background: "#F9FAFB",
                                border: "1px solid var(--border)",
                                borderRadius: "10px",
                              }}
                            >
                              <h4 style={{ margin: "0 0 10px", fontSize: "14px", fontWeight: "700" }}>
                                Rate Your Service
                              </h4>

                              <div style={{ display: "flex", gap: "6px", alignItems: "center", marginBottom: "12px" }}>
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <button
                                    key={star}
                                    type="button"
                                    onClick={() =>
                                      setReviewForm((prev) => ({ ...prev, rating: star }))
                                    }
                                    style={{ background: "none", border: "none", cursor: "pointer", padding: "2px" }}
                                  >
                                    <Star
                                      size={22}
                                      fill={star <= reviewForm.rating ? "#F5A524" : "none"}
                                      color={star <= reviewForm.rating ? "#F5A524" : "#D1D5DB"}
                                    />
                                  </button>
                                ))}
                                <span style={{ marginLeft: "8px", fontSize: "14px", fontWeight: "600" }}>
                                  {reviewForm.rating} / 5
                                </span>
                              </div>

                              <textarea
                                rows={3}
                                placeholder="Write feedback about the service..."
                                value={reviewForm.comment}
                                onChange={(e) =>
                                  setReviewForm((prev) => ({ ...prev, comment: e.target.value }))
                                }
                                className={styles.textarea}
                                style={{ width: "100%", marginBottom: "10px" }}
                              />

                              <button
                                type="button"
                                onClick={() => handleSubmitReview(b._id)}
                                style={{
                                  background: "var(--green)",
                                  color: "#ffffff",
                                  border: "none",
                                  borderRadius: "8px",
                                  padding: "8px 16px",
                                  fontSize: "13px",
                                  fontWeight: "600",
                                  cursor: "pointer",
                                }}
                              >
                                Submit Review
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
              <div>
                <h1 className={styles.title}>
                  Book a Service
                </h1>

            <p className={styles.subtitle}>
              Select the service(s) you need and tell us
              about the issue.
            </p>

            <SectionLabel>
              1. Service Address
            </SectionLabel>

            <div className={styles.addressBox}>

              <MapPin
                size={18}
                color="#A1A1AA"
              />

              <input
                value={FormData.address}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    address: e.target.value,
                  }))
                }
                placeholder="Enter your complete address"
                className={styles.addressInput}
              />

              <Crosshair
                size={18}
                className={styles.greenIcon}
              />

            </div>

            {/* CURRENT LOCATION BUTTON */}

            <button
              className={styles.locationbtn}
              type="button"
              onClick={getCurrentLocation}
            >
              <Crosshair size={16} />
              Use current location
            </button>

            <label
              className={styles.checkboxLabel}
            >
              <input
                type="checkbox"
                checked={multiService}
                onChange={(e) =>
                  setMultiService(
                    e.target.checked
                  )
                }
                className={styles.checkbox}
              />

              Choose multiple services at a time
            </label>

            <div className={styles.sectionSpacer}>

              <SectionLabel>
                2. Select Service(s)
              </SectionLabel>

            </div>

            <div className={styles.serviceGrid}>

              {SERVICES.map((s) => (

                <ServiceCard
                  key={s.id}
                  service={s}
                  selected={selectedIds.includes(
                    s.id
                  )}
                  onToggle={toggleService}
                />

              ))}

            </div>

            <div
              className={styles.describeSection}
            >

              <div
                className={styles.describeHead}
              >

                <SectionLabel>
                  3. Describe the Issue
                </SectionLabel>

                <button
                  type="button"
                  onClick={() => {

                    setSelectedIds([]);

                    setDescription("");

                    setPhotos([]);

                    setProblemChoice({});

                    setActiveProblemTab(null);

                  }}
                  className={styles.linkBtn}
                >
                  Clear all
                </button>

              </div>

              {selectedServices.length === 0 && (

                <p className={styles.emptyHint}>
                  Select a service above to describe
                  your issue.
                </p>

              )}

              {selectedServices.length > 0 && (

                <>

                  {selectedServices.length > 1 && (

                    <div className={styles.pillRow}>

                      {selectedServices.map((s) => (

                        <Pill
                          key={s.id}
                          label={s.name}
                          active={
                            activeProblemTab ===
                            s.id
                          }
                          onClick={() =>
                            setActiveProblemTab(
                              s.id
                            )
                          }
                        />

                      ))}

                    </div>

                  )}

                  {activeService && (

                    <div
                      className={
                        styles.problemBlock
                      }
                    >

                      <div
                        className={
                          styles.fieldLabel
                        }
                      >
                        Related Problem (
                        {activeService.name}
                        )
                      </div>

                      <div
                        className={
                          styles.pillRow
                        }
                      >

                        {activeService.problems.map(
                          (p) => (

                            <Pill
                              key={p}
                              label={p}
                              active={
                                problemChoice[
                                activeService.id
                                ] === p
                              }
                              onClick={() =>
                                setProblem(
                                  activeService.id,
                                  p
                                )
                              }
                            />

                          )
                        )}

                      </div>

                    </div>

                  )}

                </>

              )}

              {/* ISSUE DESCRIPTION */}

              <div className={styles.fieldBlock}>

                <div
                  className={
                    styles.fieldLabel
                  }
                >
                  Briefly describe your issue
                </div>

                <textarea
                  value={description}
                  maxLength={500}
                  onChange={(e) =>
                    setDescription(
                      e.target.value
                    )
                  }
                  placeholder="Write a brief description of the issue..."
                  rows={4}
                  className={styles.textarea}
                />

                <div
                  className={
                    styles.charCount
                  }
                >
                  {description.length}/500
                </div>

              </div>

              {/* PHOTOS */}

              <div className={styles.fieldBlock}>

                <div
                  className={
                    styles.fieldLabel
                  }
                >
                  Upload Photos{" "}
                  <span
                    className={
                      styles.optionalLabel
                    }
                  >
                    (Optional)
                  </span>
                </div>

                <div
                  className={styles.photoRow}
                >

                  <label
                    className={
                      styles.uploadTile
                    }
                  >

                    <Camera
                      size={20}
                      color="#A1A1AA"
                    />

                    <span
                      className={
                        styles.uploadTitle
                      }
                    >
                      Click to upload photos
                    </span>

                    <span>
                      PNG, JPG, JPEG up to 5MB
                    </span>

                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/png,image/jpeg"
                      multiple
                      onChange={handleFiles}
                      className={
                        styles.hiddenInput
                      }
                    />

                  </label>

                  {photos.map((p) => (

                    <div
                      key={p.id}
                      className={
                        styles.photoThumb
                      }
                      title={p.label}
                    >

                      <span
                        className={
                          styles.photoLabel
                        }
                      >
                        {p.label}
                      </span>

                      <button
                        type="button"
                        onClick={() =>
                          removePhoto(p.id)
                        }
                        className={
                          styles.photoRemoveBtn
                        }
                      >
                        <X size={12} />
                      </button>

                    </div>

                  ))}

                  {photos.length < 4 && (

                    <button
                      type="button"
                      onClick={() =>
                        fileInputRef.current?.click()
                      }
                      className={
                        styles.addPhotoBtn
                      }
                    >
                      <Plus size={20} />
                    </button>

                  )}

                </div>

              </div>

            </div>
            <button
              type="button"
              disabled={
                selectedServices.length === 0 ||
                !FormData.address ||
                isSubmitting
              }
              className={styles.submitBtn}
              onClick={handleBookService}
            >
              {isSubmitting ? "Booking Service..." : "Book Service"}
              <ChevronRight size={18} />
            </button>

          </div>
        )}

      </div>

          <div className={styles.summaryCard}>
            {activeView === "my_bookings" ? (
              <div>
                <div className={styles.summaryHeader}>
                  <Calendar size={20} className={styles.greenIcon} />
                  <span className={styles.summaryHeaderTitle}>Bookings Overview</span>
                </div>

                <div className={styles.summaryCount}>
                  Total Records ({myBookings.length})
                </div>

                <div style={{ marginTop: "16px", display: "flex", flexDirection: "column", gap: "10px", fontSize: "14px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0" }}>
                    <span style={{ color: "var(--text-muted)" }}>Active / In Progress</span>
                    <strong style={{ color: "#3B82F6" }}>
                      {myBookings.filter((b) => ["pending", "accepted", "in_progress"].includes(b.status)).length}
                    </strong>
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0" }}>
                    <span style={{ color: "var(--text-muted)" }}>Completed</span>
                    <strong style={{ color: "#1E9E5A" }}>
                      {myBookings.filter((b) => b.status === "completed").length}
                    </strong>
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0" }}>
                    <span style={{ color: "var(--text-muted)" }}>Cancelled</span>
                    <strong style={{ color: "#EF4444" }}>
                      {myBookings.filter((b) => b.status === "cancelled").length}
                    </strong>
                  </div>
                </div>

                <div className={styles.divider} />

                <div className={styles.secureBox}>
                  <ShieldCheck size={22} className={styles.greenIcon} />
                  <div>
                    <div className={styles.secureTitle}>Verified Marketplace</div>
                    <div className={styles.secureText}>
                      All professionals are background-checked and identity-verified.
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  className={styles.submitBtn}
                  style={{ width: "100%", justifyContent: "center", marginTop: "18px" }}
                  onClick={() => setActiveView("book")}
                >
                  Book Another Service
                </button>
              </div>
            ) : (
              <>
                <div
                  className={styles.summaryHeader}
                >

                  <Calendar
                    size={20}
                    className={styles.greenIcon}
                  />

                  <span
                    className={
                      styles.summaryHeaderTitle
                    }
                  >
                    Booking Summary
                  </span>

                </div>

                <div
                  className={styles.summaryCount}
                >
                  Selected Services (
                  {selectedServices.length}
                  )
                </div>

            {selectedServices.length === 0 && (

              <p className={styles.emptyHint}>
                No services selected yet.
              </p>

            )}

            {selectedServices.map((s, idx) => {

              const Icon = s.icon;

              return (

                <div key={s.id}>

                  <div
                    className={
                      styles.summaryItem
                    }
                  >

                    <div
                      className={
                        styles.summaryItemLeft
                      }
                    >

                      <span
                        className={
                          styles.summaryIconWrap
                        }
                        style={{
                          background: s.iconBg,
                        }}
                      >

                        <Icon
                          size={18}
                          color={s.iconColor}
                        />

                      </span>

                      <div>

                        <div
                          className={
                            styles.summaryItemName
                          }
                        >
                          {s.name}
                        </div>

                        {problemChoice[
                          s.id
                        ] && (

                            <span
                              className={
                                styles.tag
                              }
                            >
                              {
                                problemChoice[
                                s.id
                                ]
                              }
                            </span>

                          )}

                      </div>

                    </div>

                    <div
                      className={
                        styles.summaryItemRight
                      }
                    >

                      <span
                        className={
                          styles.summaryItemPrice
                        }
                      >
                        ₹{s.price}
                      </span>

                      <button
                        type="button"
                        onClick={() =>
                          removeService(s.id)
                        }
                        className={
                          styles.iconBtn
                        }
                      >
                        <X size={16} />
                      </button>

                    </div>

                  </div>

                  {idx <
                    selectedServices.length - 1 && (
                      <div
                        className={
                          styles.divider
                        }
                      />
                    )}

                </div>

              );

            })}

            <div
              className={styles.divider}
            />

            <SummaryRow
              icon={
                <MapPin
                  size={16}
                  className={styles.greenIcon}
                />
              }
              title="Service Address"
              action="Edit"
              onAction={() => {
                const addressInput = document.querySelector(
                  `.${styles.addressInput}`
                );

                if (addressInput) {
                  addressInput.scrollIntoView({
                    behavior: "smooth",
                    block: "center",
                  });

                  setTimeout(() => {
                    addressInput.focus();
                  }, 400);
                }
              }}
            >
              <div className={styles.addressText}>
                {FormData.address || "Enter your service address"}
              </div>
            </SummaryRow>

            <div
              className={styles.divider}
            />

            <SummaryRow
              title="Preferred Date & Time"
              action="Edit"
              onAction={() => setShowDateTimePicker(true)}
            >
              <div className={styles.dateTimeRow}>
                <Calendar size={15} />

                {preferredDate
                  ? formatDate(preferredDate)
                  : "No date selected"}
              </div>

              <div className={styles.dateTimeRow}>
                <Clock size={15} />

                {preferredTime
                  ? preferredTime
                  : "No time selected"}
              </div>
            </SummaryRow>
            <div
              className={styles.divider}
            />
            <div
              className={styles.totalRow}
            >

              <span
                className={styles.totalLabel}
              >
                Estimated Total
              </span>

              <span
                className={styles.totalValue}
              >
                ₹{total}
              </span>

            </div>
            <div
              className={styles.secureBox}
            >

              <ShieldCheck
                size={22}
                className={
                  styles.greenIcon
                }
              />

              <div>

                <div
                  className={
                    styles.secureTitle
                  }
                >
                  Secure Booking
                </div>

                <div
                  className={
                    styles.secureText
                  }
                >
                  Your payment will be collected
                  after the service is completed.
                </div>

              </div>

            </div>

            <button
              type="button"
              className={styles.changeDateBtn}
              onClick={() => setShowDateTimePicker(true)}
            >
              <Calendar size={16} />
              Change Date &amp; Time
            </button>
            {showDateTimePicker && (
              <div className={styles.dateTimePicker}>

                <div className={styles.pickerHeader}>
                  <h3>Choose Date & Time</h3>

                  <button
                    type="button"
                    onClick={() => setShowDateTimePicker(false)}
                    className={styles.closePickerBtn}
                  >
                    <X size={18} />
                  </button>
                </div>

                <label className={styles.pickerLabel}>
                  Preferred Date
                </label>

                <input
                  type="date"
                  value={preferredDate}
                  min={new Date().toISOString().split("T")[0]}
                  onChange={(e) =>
                    setPreferredDate(e.target.value)
                  }
                  className={styles.dateInput}
                />

                <label className={styles.pickerLabel}>
                  Preferred Time
                </label>

                <select
                  value={preferredTime}
                  onChange={(e) =>
                    setPreferredTime(e.target.value)
                  }
                  className={styles.timeSelect}
                >
                  <option value="">
                    Select a time slot
                  </option>

                  <option value="8:00 AM - 10:00 AM">
                    8:00 AM - 10:00 AM
                  </option>

                  <option value="10:00 AM - 12:00 PM">
                    10:00 AM - 12:00 PM
                  </option>

                  <option value="12:00 PM - 2:00 PM">
                    12:00 PM - 2:00 PM
                  </option>

                  <option value="2:00 PM - 4:00 PM">
                    2:00 PM - 4:00 PM
                  </option>

                  <option value="4:00 PM - 6:00 PM">
                    4:00 PM - 6:00 PM
                  </option>

                  <option value="6:00 PM - 8:00 PM">
                    6:00 PM - 8:00 PM
                  </option>
                </select>

                <button
                  type="button"
                  className={styles.locationbtn}
                  disabled={!preferredDate || !preferredTime}
                  onClick={() => {
                    setShowDateTimePicker(false);

                    showNotification(
                      "Date and time updated successfully!",
                      "success"
                    );
                  }}
                >
                  Save Date & Time
                </button>

              </div>
            )}
              </>
            )}
          </div>

        </div>

      </div>
    </>
  );
}