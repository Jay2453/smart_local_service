'use client';
import { useState } from 'react';
import OtpVerifyModal from '../../components/OTPmodal/Otpverifymodal';
import NotificationBanner from '../../components/NotificationBanner/NotificationBanner';
import './register.css';
import {
  FiUser,
  FiPhone,
  FiMail,
  FiLock,
  FiEye,
  FiEyeOff,
  FiMapPin,
  FiHome,
  FiArrowRight,
  FiBriefcase,
  FiStar,
  FiTarget,
  FiChevronUp,
  FiChevronDown,
  FiCheckCircle,
} from 'react-icons/fi';

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
        showNotification(data.message);
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
        showNotification(data.message);
        return;
      }

      if (data.otp) {
        showNotification(
          `Your OTP is ${data.otp}`,
          "success"
        );
      }

    } catch (error) {
      console.error("RESEND OTP ERROR:", error);
      showNotification("Could not resend OTP.");
    }
  };

  const handleContinue = async () => {
    // Check form fields
    if (
      !FormData.name ||
      !FormData.phone ||
      !FormData.email ||
      !FormData.password ||
      !FormData.confirmpassword
    ) {
      showNotification("Please fill in all the required fields.");
      return;
    }
    if (IsServiceprovider && (!FormData.ServiceRadius || !FormData.Profession || !FormData.Experience || !FormData.address)) {
      showNotification("Please fill in the required Service Provider Fields.");
      return;
    }

    // Check passwords
    if (FormData.password !== FormData.confirmpassword) {
      showNotification("Passwords do not match.");
      return;
    }

    try {

      // Check email and phone in database
      const checkResponse = await fetch(
        "/api/auth/check-registration",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: FormData.email,
            phone: FormData.phone,
          }),
        }
      );

      const checkData = await checkResponse.json();

      if (!checkResponse.ok) {
        showNotification(checkData.message);
        return;
      }

      // Only now generate OTP
      const otpResponse = await fetch(
        "/api/auth/send-otp",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            phone: FormData.phone,
          }),
        }
      );

      const otpData = await otpResponse.json();

      if (!otpResponse.ok) {
        showNotification(otpData.message);
        return;
      }

      if (otpData.otp) {
        showNotification(
          `Your OTP is ${otpData.otp}`,
          "success"
        );
      }

      // Open OTP modal
      setShowoverlay(true);

    } catch (error) {
      console.error("Continue error:", error);
      showNotification("Something went wrong. Please try again.");
    }
  };

 const getCurrentLocation = () => {

    if (!navigator.geolocation) {
        showNotification(
            "Location is not supported by your browser.",
            "error"
        );
        return;
    }

    showNotification(
        "Detecting your location...",
        "success"
    );

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
                    showNotification(
                        data.message || "Unable to find your address.",
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

                console.error("Reverse geocoding error:", error);

                showNotification(
                    "Unable to get your address.",
                    "error"
                );
            }
        },

        (error) => {
            console.error("Location error:", error);
            if (error.code === 1) {
                showNotification(
                    "Location permission denied. Please allow access.",
                    "error"
                );
            }

            else if (error.code === 2) {
                showNotification(
                    "Unable to detect your location.",
                    "error"
                );
            }

            else if (error.code === 3) {
                showNotification(
                    "Location request timed out.",
                    "error"
                );
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
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        showNotification(data.message);
        return;
      }

      console.log("Registration successful:", data);

      if (IsServiceprovider) {
        window.location.href = "/Register/Verify_docs";
      } else {
        window.location.href = "/Dashboard";
      }

    } catch (error) {
      console.error("Registeration failed: ", error);
      showNotification("Something went wrong. ");
    }
  };

  //////////////////////////////////////////////////

  return (
    <div>

      {Notification.show && (
        <NotificationBanner message={Notification.message}
          type={Notification.type}
          onClose={() =>
            setNotification({
              show: false,
              message: "",
              type: "error",
            })
          } />
      )}

      {/* OTP verification module */}
      {Showoverlay &&
        <OtpVerifyModal
          phoneNumber={`+91 ${FormData.phone}`}
          onClose={() => setShowoverlay(false)}
          onVerify={handleOTPVerify}
          IsServiceprovider={IsServiceprovider}
          onResend={handleResend}
        />
      }

      {/* Registeration Model */}
      <div className="masterregister">
        <div className="register-layout">
          {/* LEFT COLUMN */}
          <div className="content">
            <h1 className="registertitle">Create an Account</h1>

            {/* Personal Information */}
            <div className="personalinfo section-header">
              <FiUser className="section-icon" />
              <h2>Personal Information</h2>
            </div>
            <p className="paratext">Tell us about yourself</p>

            <div className="form">
              <div className="form-grid">
                <div className="form-group">
                  <label>Full Name</label>
                  <div className="input-wrapper">
                    <FiUser className="input-icon" />
                    <input type="text" placeholder="username" name="name" value={FormData.name} onChange={handleChange} />
                  </div>
                </div>

                <div className="form-group">
                  <label>Mobile Number</label>
                  <div className="input-wrapper phone-wrapper">
                    <FiPhone className="input-icon" />
                    <span className="country-code">+91</span>
                    <span className="divider-line" />
                    <input type="tel" name="phone" onChange={handleChange} value={FormData.phone} />
                  </div>
                </div>

                <div className="form-group">
                  <label>Email Address</label>
                  <div className="input-wrapper">
                    <FiMail className="input-icon" />
                    <input type="email" placeholder="user@gmail.com" onChange={handleChange} value={FormData.email} name="email" />
                  </div>
                </div>

                <div className="form-group">
                  <label>Create Password</label>
                  <div className="input-wrapper">
                    <FiLock className="input-icon" />
                    <input type={showPassword ? 'text' : 'password'} name='password' value={FormData.password} onChange={handleChange} />
                    <button
                      type="button"
                      className="eye-btn"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <FiEye /> : <FiEyeOff />}
                    </button>
                  </div>
                </div>

                <div className="form-group">
                  <label>Confirm Password</label>
                  <div className="input-wrapper">
                    <FiLock className="input-icon" />
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      name="confirmpassword"
                      value={FormData.confirmpassword}
                      onChange={handleChange}
                    />
                    <button
                      type="button"
                      className="eye-btn"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? <FiEye /> : <FiEyeOff />}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Worker checkbox */}
            <label className="worker-checkbox">
              <input
                type="checkbox"
                checked={IsServiceprovider}
                onChange={() => setIsServiceprovider(!IsServiceprovider)}
              />
              <span className="custom-checkbox">
                {IsServiceprovider && <FiCheckCircle className="check-icon" />}
              </span>
              <div className="checkbox-text">
                <p className="checkbox-title">I am a service provider / worker</p>
                <p className="checkbox-sub">Tick this if you offer services on SmartServe</p>
              </div>
            </label>

            <button type="button" className="continue-btn" onClick={handleContinue}>
              Continue <FiArrowRight />
            </button>

            <p className="footer-safe">
              <FiLock size={12} /> Your information is safe with us and will never be shared.
            </p>
          </div>

          {/* RIGHT COLUMN */}
          {IsServiceprovider && (
            <div className="worker-sidebar">
              <button
                type="button"
                className="worker-header"
                onClick={() => setWorkerDetailsOpen(!workerDetailsOpen)}
              >
                <FiBriefcase className="worker-header-icon" />
                <h3>
                  Worker Details <span>(Will appear when checked)</span>
                </h3>
                {workerDetailsOpen ? <FiChevronUp /> : <FiChevronDown />}
              </button>

              {workerDetailsOpen && (
                <div className="worker-body">
                  <div className="info-banner">
                    <FiCheckCircle className="info-icon" />
                    <p>Provide your work details so customers can find you easily.</p>
                  </div>

                  <div className="form-group">
                    <label>
                      <FiMapPin className="label-icon" /> Profession / Category
                    </label>
                    <div className="input-wrapper">
                      <span className="input-emoji">🛠️</span>
                      <select value={FormData.Profession} name='Profession' onChange={handleChange}>
                        <option>Select profession</option>
                        <option value="Plumbing">Plumbing</option>
                        <option value="Electrical">Electrical</option>
                        <option value="Carpentry">Carpentry</option>
                        <option value="Painting">Painting</option>
                        <option value="Pest control">Pest Control</option>
                        <option value="ApplianceRepair">Appliance Repair</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-group">
                    <label>
                      <FiStar className="label-icon" /> Years of Experience
                    </label>
                    <div className="input-wrapper">
                      <FiStar className="input-icon" />
                      <select value={FormData.Experience} name='Experience' onChange={handleChange}>
                        <option>Select Experience Time</option>
                        <option value="0-1">Less than 1 Year</option>
                        <option value="1-3">1-3 Years</option>
                        <option value="3-5">3-5 Years</option>
                        <option value="5+">5+ Years</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-group">
                    <label>
                      <FiTarget className="label-icon" /> Service Area / Radius
                    </label>
                    <div className="input-wrapper">
                      <FiTarget className="input-icon" />
                      <select value={FormData.ServiceRadius} name='ServiceRadius' onChange={handleChange}>
                        <option>Select Service Range</option>
                        <option value="in 5km">Within 5 km</option>
                        <option value="in 10km">Within 10 km</option>
                        <option value="in 15km">Within 15 km</option>
                        <option value="in 25km">Within 25 km</option>
                      </select>
                    </div>
                    <p className="hint-text">Within how many km you provide service</p>
                  </div>

                  <div className="form-group full-width">
                    <div className="personalinfo section-header">
                      <label>
                        <FiMapPin className="section-icon" /> Address
                      </label>
                    </div>
                    <div className="input-wrapper">
                      <FiHome className="input-icon "/>
                      <input
                        type="text"
                        name="address"
                        placeholder=""
                        value={FormData.address}
                        onChange={handleChange}
                      />
                    </div>
                    <button className='location-btn' type='button' onClick={getCurrentLocation}>
                      Use curent location
                    </button>
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

