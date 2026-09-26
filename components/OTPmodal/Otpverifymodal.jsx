"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import styles from "./Otpverifymodal.module.css";
import { ShieldCheck, Clock, ArrowRight, Lock, RotateCcw, X } from "lucide-react";

const OTP_LENGTH = 6;
const RESEND_SECONDS = 45;

export default function OtpVerifyModal({
  phoneNumber,
  onClose,
  onVerify,
  onResend,
}) {
  const [otp, setOtp] = useState(Array(OTP_LENGTH).fill(""));
  const [secondsLeft, setSecondsLeft] = useState(RESEND_SECONDS);
  const [isVerifying, setIsVerifying] = useState(false);
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

  const handleVerify = async () => {
    if (!isComplete || isVerifying) return;
    setIsVerifying(true);
    try {
      await onVerify(otp.join(""));
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="otp-title"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className={styles.closeBtn}
          onClick={onClose}
          aria-label="Close"
        >
          <X size={18} />
        </button>

        <div className={styles.iconWrap}>
          <ShieldCheck size={28} color="#04B204" />
        </div>

        <h2 id="otp-title" className={styles.title}>
          Verify Your Mobile Number
        </h2>
        <p className={styles.subtitle}>
          We have sent a 6-digit verification code to
        </p>

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
              aria-label={`Digit ${i + 1}`}
            />
          ))}
        </div>

        <div className={styles.metaRow}>
          <div className={styles.expiresWrap}>
            <Clock size={15} className={styles.metaIcon} />
            <span>
              Expires in <strong>{formatTime(secondsLeft)}</strong>
            </span>
          </div>
          <div className={styles.resendWrap}>
            <button
              type="button"
              className={styles.resendBtn}
              onClick={handleResend}
              disabled={secondsLeft > 0}
            >
              <RotateCcw size={14} />
              <span>{secondsLeft > 0 ? `Resend in ${secondsLeft}s` : "Resend OTP"}</span>
            </button>
          </div>
        </div>

        <button
          type="button"
          className={styles.verifyBtn}
          onClick={handleVerify}
          disabled={!isComplete || isVerifying}
        >
          {isVerifying ? "Verifying..." : "Verify & Continue"}
          <ArrowRight size={18} />
        </button>

        <div className={styles.secureRow}>
          <Lock size={13} />
          <span>Your information is protected with end-to-end encryption</span>
        </div>
      </div>
    </div>
  );
}
