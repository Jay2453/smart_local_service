'use client';
import { useState } from 'react';
import OtpVerifyModal from '../../components/OTPmodal/Otpverifymodal';
import NotificationBanner from '../../components/NotificationBanner/NotificationBanner';
import './register.css';
import {
  User,
  Phone,
  Mail,
  Lock,
  Eye,
  EyeOff,
  MapPin,
  Home,
  ArrowRight,
  Briefcase,
  Star,
  Target,
  ChevronUp,
  ChevronDown,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  Compass,
} from 'lucide-react';

const Register = () => {
  const [FormData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    password: "",
    confirmpassword: "",
    role: "",
    address: "",
    Profession: "",
    Experience: "",
    ServiceRadius: "",
    latitude: "",
    longitude: "",
  });
  const [IsServiceprovider, setIsServiceprovider] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [workerDetailsOpen, setWorkerDetailsOpen] = useState(true);
  const [Showoverlay, setShowoverlay] = useState(false);
  const [detectingLocation, setDetectingLocation] = useState(false);
  const [Notification, setNotification] = useState({
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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleOTPVerify = async (otp) => {
    try {
      const response = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phone: FormData.phone,
          otp: otp,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        showNotification(data.message || "OTP verification failed.");
        return;
      }

      console.log("OTP verified successfully");
      await handleRegistration();
    } catch (error) {
      console.error("OTP verification error:", error);
      showNotification("Could not verify OTP.");
    }
  };

  const handleResend = async () => {
    try {
      const response = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phone: FormData.phone,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        showNotification(data.message || "Failed to resend OTP.");
        return;
      }

      if (data.otp) {
        showNotification(`Your OTP is ${data.otp}`, "success");
      }
    } catch (error) {
      console.error("RESEND OTP ERROR:", error);
      showNotification("Could not resend OTP.");
    }
  };

  const handleContinue = async () => {
    if (
      !FormData.name ||
      !FormData.phone ||
      !FormData.email ||
      !FormData.password ||
      !FormData.confirmpassword
    ) {
      showNotification("Please fill in all required fields.");
      return;
    }

    if (FormData.phone.length !== 10) {
      showNotification("Please enter a valid 10-digit mobile number.");
      return;
    }

    if (
      IsServiceprovider &&
      (!FormData.ServiceRadius ||
        !FormData.Profession ||
        !FormData.Experience ||
        !FormData.address)
    ) {
      showNotification("Please complete all Service Provider fields.");
      return;
    }

    if (FormData.password !== FormData.confirmpassword) {
      showNotification("Passwords do not match.");
      return;
    }

    try {
      const checkResponse = await fetch("/api/auth/check-registration", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: FormData.email,
          phone: FormData.phone,
        }),
      });

      const checkData = await checkResponse.json();

      if (!checkResponse.ok) {
        showNotification(checkData.message || "Registration check failed.");
        return;
      }

      const otpResponse = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phone: FormData.phone,
        }),
      });

      const otpData = await otpResponse.json();

      if (!otpResponse.ok) {
        showNotification(otpData.message || "Failed to send OTP.");
        return;
      }

      if (otpData.otp) {
        showNotification(`Your OTP is ${otpData.otp}`, "success");
      }

      setShowoverlay(true);
    } catch (error) {
      console.error("Continue error:", error);
      showNotification("Something went wrong. Please try again.");
    }
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      showNotification("Location is not supported by your browser.", "error");
      return;
    }

    setDetectingLocation(true);
    showNotification("Detecting your location...", "success");

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;

        try {
          const response = await fetch(
            `/api/location/reverse-geocode?lat=${latitude}&lon=${longitude}`
          );

          const data = await response.json();

          if (!response.ok) {
            showNotification(data.message || "Unable to find your address.", "error");
            setDetectingLocation(false);
            return;
          }

          setFormData((prev) => ({
            ...prev,
            address: data.address,
            latitude: latitude,
            longitude: longitude,
          }));

          showNotification("Location detected successfully!", "success");
        } catch (error) {
          console.error("Reverse geocoding error:", error);
          showNotification("Unable to get your address.", "error");
        } finally {
          setDetectingLocation(false);
        }
      },
      (error) => {
        setDetectingLocation(false);
        console.error("Location error:", error);
        if (error.code === 1) {
          showNotification("Location permission denied. Please allow access.", "error");
        } else if (error.code === 2) {
          showNotification("Unable to detect your location.", "error");
        } else if (error.code === 3) {
          showNotification("Location request timed out.", "error");
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  const handleRegistration = async () => {
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: FormData.name,
          phone: FormData.phone,
          email: FormData.email,
          password: FormData.password,
          role: IsServiceprovider ? "serviceprovider" : "customer",
          address: FormData.address,
          Proffesion: FormData.Profession,
          Experience: FormData.Experience,
          ServiceRadius: FormData.ServiceRadius,
          latitude: FormData.latitude,
          longitude: FormData.longitude,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        showNotification(data.message || "Registration failed.");
        return;
      }

      console.log("Registration successful:", data);

      if (IsServiceprovider) {
        window.location.href = "/Register/Verify_docs";
      } else {
        window.location.href = "/Dashboard";
      }
    } catch (error) {
      console.error("Registration failed: ", error);
      showNotification("Something went wrong with registration.");
    }
  };

  return (
    <div className="register-page-wrapper">
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

      {/* OTP verification module */}
      {Showoverlay && (
        <OtpVerifyModal
          phoneNumber={`+91 ${FormData.phone}`}
          onClose={() => setShowoverlay(false)}
          onVerify={handleOTPVerify}
          IsServiceprovider={IsServiceprovider}
          onResend={handleResend}
        />
      )}

      <div className="register-container">
        <div className="register-header-bar">
          <span className="register-badge">
            <Sparkles size={14} color="#04B204" />
            Join SmartServe Network
          </span>
          <h1 className="register-main-title">Create Your Account</h1>
          <p className="register-main-sub">
            Join thousands of satisfied customers and verified service experts.
          </p>
        </div>

        <div className="register-layout">
          {/* PERSONAL INFO COLUMN */}
          <div className="register-card main-info-card">
            <div className="card-section-heading">
              <div className="section-icon-wrap">
                <User size={20} color="#04B204" />
              </div>
              <div>
                <h2 className="section-heading-text">Personal Information</h2>
                <p className="section-subtext">Tell us about yourself to get started</p>
              </div>
            </div>

            <div className="form-grid">
              <div className="form-group full-span">
                <label>Full Name</label>
                <div className="input-wrapper">
                  <User className="input-icon" size={18} />
                  <input
                    type="text"
                    name="name"
                    placeholder="Enter your full name"
                    value={FormData.name}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Mobile Number</label>
                <div className="input-wrapper phone-wrapper">
                  <Phone className="input-icon" size={18} />
                  <span className="country-code">+91</span>
                  <span className="divider-line" />
                  <input
                    type="tel"
                    name="phone"
                    placeholder="10-digit number"
                    maxLength={10}
                    onChange={handleChange}
                    value={FormData.phone}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Email Address</label>
                <div className="input-wrapper">
                  <Mail className="input-icon" size={18} />
                  <input
                    type="email"
                    placeholder="name@example.com"
                    onChange={handleChange}
                    value={FormData.email}
                    name="email"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Create Password</label>
                <div className="input-wrapper">
                  <Lock className="input-icon" size={18} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    placeholder="At least 6 characters"
                    value={FormData.password}
                    onChange={handleChange}
                  />
                  <button
                    type="button"
                    className="eye-btn"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label="Toggle password"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label>Confirm Password</label>
                <div className="input-wrapper">
                  <Lock className="input-icon" size={18} />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    name="confirmpassword"
                    placeholder="Repeat password"
                    value={FormData.confirmpassword}
                    onChange={handleChange}
                  />
                  <button
                    type="button"
                    className="eye-btn"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    aria-label="Toggle confirm password"
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            </div>

            {/* Service Provider Toggle */}
            <div className={`worker-selection-card ${IsServiceprovider ? 'active-provider-mode' : ''}`}>
              <label className="worker-checkbox-label">
                <input
                  type="checkbox"
                  checked={IsServiceprovider}
                  onChange={() => setIsServiceprovider(!IsServiceprovider)}
                />
                <div className="custom-check-box">
                  {IsServiceprovider && <CheckCircle2 size={16} color="#ffffff" />}
                </div>
                <div className="checkbox-text-block">
                  <span className="checkbox-title">I am a Service Provider / Worker</span>
                  <span className="checkbox-sub">Check this to offer your skills and get customer bookings</span>
                </div>
              </label>
            </div>

            {!IsServiceprovider && (
              <div className="submit-section">
                <button type="button" className="continue-btn" onClick={handleContinue}>
                  <span>Continue to Verification</span>
                  <ArrowRight size={18} />
                </button>
                <p className="footer-safe">
                  <ShieldCheck size={14} /> Your personal information is safe and never shared.
                </p>
              </div>
            )}
          </div>

          {/* WORKER DETAILS ACCORDION / CARD (Smoothly visible when selected) */}
          {IsServiceprovider && (
            <div className="register-card worker-sidebar-card">
              <div
                className="card-section-heading accordion-trigger"
                onClick={() => setWorkerDetailsOpen(!workerDetailsOpen)}
              >
                <div className="section-icon-wrap green-icon-wrap">
                  <Briefcase size={20} color="#04B204" />
                </div>
                <div className="flex-1">
                  <h2 className="section-heading-text">Provider Profile Details</h2>
                  <p className="section-subtext">Information shown to local customers</p>
                </div>
                <button type="button" className="accordion-arrow">
                  {workerDetailsOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </button>
              </div>

              {workerDetailsOpen && (
                <div className="worker-body-section">
                  <div className="info-banner">
                    <CheckCircle2 size={18} className="info-banner-icon" />
                    <p>Accurate details help us match you with nearby customers in need of your services.</p>
                  </div>

                  <div className="form-group full-span">
                    <label>
                      <Briefcase size={15} className="label-icon" /> Profession / Category
                    </label>
                    <div className="input-wrapper">
                      <select value={FormData.Profession} name="Profession" onChange={handleChange}>
                        <option value="">Select your service profession</option>
                        <option value="plumbing">Plumbing Services</option>
                        <option value="electrical">Electrical Repairs</option>
                        <option value="carpentry">Carpentry & Woodwork</option>
                        <option value="painting">House & Commercial Painting</option>
                        <option value="pest">Pest Control Services</option>
                        <option value="appliance">Appliance Repair & Servicing</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-grid">
                    <div className="form-group">
                      <label>
                        <Star size={15} className="label-icon" /> Years of Experience
                      </label>
                      <div className="input-wrapper">
                        <select value={FormData.Experience} name="Experience" onChange={handleChange}>
                          <option value="">Select experience</option>
                          <option value="0-1">Less than 1 Year</option>
                          <option value="1-3">1 - 3 Years</option>
                          <option value="3-5">3 - 5 Years</option>
                          <option value="5+">5+ Years</option>
                        </select>
                      </div>
                    </div>

                    <div className="form-group">
                      <label>
                        <Target size={15} className="label-icon" /> Service Area / Radius
                      </label>
                      <div className="input-wrapper">
                        <select value={FormData.ServiceRadius} name="ServiceRadius" onChange={handleChange}>
                          <option value="">Select service range</option>
                          <option value="in 5km">Within 5 km</option>
                          <option value="in 10km">Within 10 km</option>
                          <option value="in 15km">Within 15 km</option>
                          <option value="in 25km">Within 25 km</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="form-group full-span address-field-group">
                    <div className="address-header-row">
                      <label>
                        <MapPin size={15} className="label-icon" /> Your Operating Base Address
                      </label>
                      <button
                        type="button"
                        className="location-btn"
                        onClick={getCurrentLocation}
                        disabled={detectingLocation}
                      >
                        <Compass size={14} />
                        <span>{detectingLocation ? "Detecting..." : "Auto-detect Location"}</span>
                      </button>
                    </div>

                    <div className="input-wrapper">
                      <Home size={18} className="input-icon" />
                      <input
                        type="text"
                        name="address"
                        placeholder="Street, Landmark, City or Area"
                        value={FormData.address}
                        onChange={handleChange}
                      />
                    </div>
                  </div>

                  <div className="submit-section">
                    <button type="button" className="continue-btn" onClick={handleContinue}>
                      <span>Continue to Verification</span>
                      <ArrowRight size={18} />
                    </button>
                    <p className="footer-safe">
                      <ShieldCheck size={14} /> Next step: Quick ID Document & Selfie Verification
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Register;
