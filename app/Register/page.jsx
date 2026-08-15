'use client';
import React, { useState } from 'react';
import OtpVerifyModal from '../../components/OTPmodal/Otpverifymodal';
import './register.css';
import {
  FiUser,
  FiCalendar,
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
  FiList,
  FiTarget,
  FiChevronUp,
  FiChevronDown,
  FiX,
  FiCheckCircle,
} from 'react-icons/fi';
import { FcGoogle } from 'react-icons/fc';
import { FaApple } from 'react-icons/fa';
import Navbar from '@/components/Navbar/Navbar';

const Register = () => {
  const [IsServiceprovider, setIsServiceprovider] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [workerDetailsOpen, setWorkerDetailsOpen] = useState(true);
  const [Showoverlay, setShowoverlay] = useState(false);
  return (
    <div>

      <Navbar />

      {/* OTP verification module */}
      {Showoverlay &&
        <OtpVerifyModal
          phoneNumber='+91 98567 78903'
          onClose={() => setShowoverlay(false)}
          onVerify={(otp) => console.log('Verifying', otp)}
          IsServiceprovider={IsServiceprovider}
          onResend={() => console.log('resent OTP')}
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
                    <input type="text" placeholder="username" />
                  </div>
                </div>

                <div className="form-group">
                  <label>Date of Birth</label>
                  <div className="input-wrapper">
                    <FiCalendar className="input-icon" />
                    <input type="date" />
                  </div>
                </div>

                <div className="form-group">
                  <label>Mobile Number</label>
                  <div className="input-wrapper phone-wrapper">
                    <FiPhone className="input-icon" />
                    <span className="country-code">+91</span>
                    <span className="divider-line" />
                    <input type="tel" />
                  </div>
                </div>

                <div className="form-group">
                  <label>Email Address</label>
                  <div className="input-wrapper">
                    <FiMail className="input-icon" />
                    <input type="email" placeholder="user@gmail.com" />
                  </div>
                </div>

                <div className="form-group">
                  <label>Create Password</label>
                  <div className="input-wrapper">
                    <FiLock className="input-icon" />
                    <input type={showPassword ? 'text' : 'password'} />
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
                      type={showConfirmPassword ? 'text' : 'password'}
                      defaultValue=""
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

            {/* Address */}
            <div className="personalinfo section-header">
              <FiMapPin className="section-icon" />
              <h2>Address</h2>
            </div>
            <p className="paratext">Where are you located?</p>

            <div className="form">
              <div className="form-grid address-grid">
                <div className="form-group full-width">
                  <label>House / Building / Street</label>
                  <div className="input-wrapper">
                    <FiHome className="input-icon" />
                    <input type="text" placeholder="12, Shanti Nagar, Near Sardar Patel Chowk" />
                  </div>
                </div>

                <div className="form-group">
                  <label>City</label>
                  <div className="input-wrapper">
                    <FiHome className="input-icon" />
                    <input type="text" placeholder="Morbi" />
                  </div>
                </div>

                <div className="form-group">
                  <label>State</label>
                  <div className="input-wrapper">
                    <FiMapPin className="input-icon" />
                    <select defaultValue="Gujarat">
                      <option>Gujarat</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label>PIN Code</label>
                  <div className="input-wrapper">
                    <FiMapPin className="input-icon" />
                    <input type="text" placeholder="6-Digit pincode" />
                  </div>
                </div>
              </div>
            </div>

            <button type="button" className="continue-btn" onClick={() => setShowoverlay(true)}>
              Continue <FiArrowRight />
            </button>

            <div className="divider-row">
              <span className="line" />
              <p>or continue with</p>
              <span className="line" />
            </div>

            <div className="social-row">
              <button type="button" className="social-btn">
                <FcGoogle size={18} /> Continue with Google
              </button>
              <button type="button" className="social-btn">
                <FaApple size={18} /> Continue with Apple
              </button>
            </div>

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
                      <select defaultValue="Carpentry">
                        <option>Plumbing</option>
                        <option>Electrical</option>
                        <option>Carpentry</option>
                        <option>Painting</option>
                        <option>Pest Control</option>
                        <option>Appliance Repair</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-group">
                    <label>
                      <FiStar className="label-icon" /> Years of Experience
                    </label>
                    <div className="input-wrapper">
                      <FiStar className="input-icon" />
                      <select defaultValue="3+ Years">
                        <option>Less than 1 Year</option>
                        <option>1-3 Years</option>
                        <option>3+ Years</option>
                        <option>5+ Years</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-group">
                    <label>
                      <FiTarget className="label-icon" /> Service Area / Radius
                    </label>
                    <div className="input-wrapper">
                      <FiTarget className="input-icon" />
                      <select defaultValue="Within 15 km">
                        <option>Within 5 km</option>
                        <option>Within 10 km</option>
                        <option>Within 15 km</option>
                        <option>Within 25 km</option>
                      </select>
                    </div>
                    <p className="hint-text">Within how many km you provide service</p>
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

