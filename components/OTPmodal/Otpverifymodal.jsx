"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import styles from "./Otpverifymodal.module.css";
const OTP_LENGTH = 6;
const RESEND_SECONDS = 45;

export default function OtpVerifyModal({
  phoneNumber,
  onClose,
  onVerify,
  onResend
}) {
  const [otp, setOtp] = useState(Array(OTP_LENGTH).fill(""));
  const [secondsLeft, setSecondsLeft] = useState(RESEND_SECONDS);
  const inputsRef = useRef([]);

  // Countdown timer
  useEffect(() => {
    if (secondsLeft <= 0) return;
    const timer = setInterval(() => {
      setSecondsLeft((s) => (s > 0 ? s - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [secondsLeft]);

  // Autofocus first box on mount
  useEffect(() => {
    inputsRef.current[0]?.focus();
  }, []);

  const formatTime = (total) => {
    const m = String(Math.floor(total / 60)).padStart(2, "0");
    const s = String(total % 60).padStart(2, "0");
    return `${m}:${s}`;
  };

  const handleChange = (index, value) => {
    const digit = value.replace(/[^0-9]/g, "").slice(-1);
    const next = [...otp];
    next[index] = digit;
    setOtp(next);

    if (digit && index < OTP_LENGTH - 1) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace") {
      if (otp[index]) {
        const next = [...otp];
        next[index] = "";
        setOtp(next);
      } else if (index > 0) {
        inputsRef.current[index - 1]?.focus();
        const next = [...otp];
        next[index - 1] = "";
        setOtp(next);
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      inputsRef.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < OTP_LENGTH - 1) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/[^0-9]/g, "").slice(0, OTP_LENGTH);
    if (!pasted) return;
    const next = Array(OTP_LENGTH).fill("");
    pasted.split("").forEach((ch, i) => (next[i] = ch));
    setOtp(next);
    const lastIndex = Math.min(pasted.length, OTP_LENGTH) - 1;
    inputsRef.current[lastIndex]?.focus();
  };

  const handleResend = useCallback(() => {
    if (secondsLeft > 0) return;
    setSecondsLeft(RESEND_SECONDS);
    setOtp(Array(OTP_LENGTH).fill(""));
    inputsRef.current[0]?.focus();
    onResend();
  }, [secondsLeft, onResend]);

  const isComplete = otp.every((d) => d !== "");

  const handleVerify = () => {
    if (!isComplete) return;
    onVerify(otp.join(""));
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="otp-title">
        <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
          ✕
        </button>

        <div className={styles.iconWrap}>
          <ShieldIcon />
        </div>

        <h2 id="otp-title" className={styles.title}>
          Verify Your Number
        </h2>
        <p className={styles.subtitle}>Enter the 6-digit OTP sent to your mobile number</p>

        <div className={styles.phoneRow}>
          <span className={styles.phoneNumber}>{phoneNumber}</span>
        </div>

        <div className={styles.otpRow} onPaste={handlePaste}>
          {otp.map((digit, i) => (
            <input
              key={i}
              ref={(el) => (inputsRef.current[i] = el)}
              className={`${styles.otpBox} ${digit ? styles.otpBoxFilled : ""}`}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
            />
          ))}
        </div>

        <div className={styles.divider} />

        <div className={styles.metaRow}>
          <div className={styles.expiresWrap}>
            <ClockIcon />
            <span>
              Expires in <strong>{formatTime(secondsLeft)}</strong>
            </span>
          </div>
          <div className={styles.resendWrap}>
            <span className={styles.resendLabel}>Didn't receive OTP? </span>
            <button
              className={styles.resendBtn}
              onClick={handleResend}
              disabled={secondsLeft > 0}
            >
              Resend OTP
            </button>
          </div>
        </div>

        <button
          className={styles.verifyBtn}
          onClick={handleVerify}
          disabled={!isComplete}
        >
          Verify OTP <ArrowIcon />
        </button>

        <div className={styles.secureRow}>
          <LockIcon />
          <span>Your information is secure and encrypted</span>
        </div>
      </div>
    </div>
  );
}

function ShieldIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2l8 3v6c0 5-3.5 8.5-8 11-4.5-2.5-8-6-8-11V5l8-3z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  );
}


function ClockIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 3" />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14" />
      <path d="M13 6l6 6-6 6" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="10" width="16" height="10" rx="2" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
    </svg>
  );
}
