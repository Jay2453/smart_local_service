"use client";
import "./VerificationModule.css";
import { useState, useRef } from "react";
import NotificationBanner from "../../../components/NotificationBanner/NotificationBanner";
import {
  ShieldCheck,
  UploadCloud,
  Camera,
  RotateCcw,
  CheckCircle2,
  ArrowRight,
  FileCheck,
  AlertCircle,
  Lock,
  Sparkles,
} from "lucide-react";

export default function Page() {
  const videoRef = useRef(null);
  const fileInputRef = useRef(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [selfie, setSelfie] = useState(null);
  const [selfiePreview, setSelfiePreview] = useState("");
  const [documentType, setDocumentType] = useState("");
  const [documentFile, setDocumentFile] = useState(null);

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

  const [submitting, setSubmitting] = useState(false);

  const handleVerify = async () => {
    if (!documentType) {
      showNotification("Please select a valid document type.");
      return;
    }
    if (!documentFile) {
      showNotification("Please upload a valid government document.");
      return;
    }
    if (!selfie) {
      showNotification("Please capture a live selfie to confirm your identity.");
      return;
    }

    try {
      setSubmitting(true);
      showNotification("Submitting verification documents...", "success");

      const formPayload = new FormData();
      formPayload.append("documentType", documentType);
      formPayload.append("document", documentFile);
      formPayload.append("selfie", selfie);

      const res = await fetch("/api/provider/verify-docs", {
        method: "POST",
        body: formPayload,
      });

      const data = await res.json();
      if (!res.ok) {
        showNotification(data.message || "Failed to submit documents.");
        setSubmitting(false);
        return;
      }

      showNotification(data.message || "Verification submitted successfully!", "success");
      setTimeout(() => {
        window.location.href = "/Serviceprovider";
      }, 1200);
    } catch (err) {
      console.error("Verification upload error:", err);
      showNotification("Something went wrong during submission.");
      setSubmitting(false);
    }
  };

  // Start camera
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
        },
        audio: false,
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setCameraActive(true);
      }
    } catch (error) {
      console.error("Camera error:", error);
      showNotification("Could not access camera. Please check permissions.");
    }
  };

  // Capture selfie
  const captureSelfie = () => {
    const video = videoRef.current;
    if (!video || !cameraActive) return;

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const context = canvas.getContext("2d");
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob((blob) => {
      if (!blob) return;
      const selfieFile = new File([blob], "selfie.jpg", {
        type: "image/jpeg",
      });

      setSelfie(selfieFile);
      const previewURL = URL.createObjectURL(selfieFile);
      setSelfiePreview(previewURL);
    }, "image/jpeg");

    const stream = video.srcObject;
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }

    video.srcObject = null;
    setCameraActive(false);
  };

  // Retake selfie
  const retakeSelfie = () => {
    setSelfie(null);
    if (selfiePreview) {
      URL.revokeObjectURL(selfiePreview);
    }
    setSelfiePreview("");
    startCamera();
  };

  // Handle document selection
  const handleDocumentChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      showNotification("File size must be less than 10MB");
      e.target.value = "";
      return;
    }

    setDocumentFile(file);
  };

  return (
    <div className="verification-page-wrapper">
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

      <div className="verification-container">
        {/* HEADER */}
        <div className="verification-header">
          <div className="verification-icon-badge">
            <ShieldCheck size={36} color="#04B204" />
          </div>
          <span className="verification-badge">
            <Sparkles size={14} /> Service Provider Trust Verification
          </span>
          <h1 className="verification-title">Identity & Document Verification</h1>
          <p className="verification-subtitle">
            SmartServe requires all service providers to submit government identity verification to unlock customer bookings and maintain our trust standards.
          </p>
        </div>

        {/* BODY */}
        <div className="verification-body-grid">
          {/* STEP 1: DOCUMENT UPLOAD */}
          <div className="verification-card">
            <div className="card-step-header">
              <span className="step-num-badge">01</span>
              <div>
                <h2 className="step-title">Government Document</h2>
                <p className="step-desc">Upload a valid photo ID issued by the government</p>
              </div>
            </div>

            <div className="doc-select-group">
              <label>Select Document Type</label>
              <select
                name="documentType"
                className="doc-dropdown"
                value={documentType}
                onChange={(e) => setDocumentType(e.target.value)}
              >
                <option value="">Select identity document...</option>
                <option value="aadhar">Aadhaar Card (Front & Back)</option>
                <option value="pan">PAN Card</option>
                <option value="driving-license">Driving License</option>
                <option value="passport">Passport</option>
              </select>
            </div>

            <div
              className={`upload-dropzone ${documentFile ? 'file-uploaded' : ''}`}
              onClick={() => fileInputRef.current?.click()}
            >
              <UploadCloud size={44} className="upload-icon" />
              <div className="upload-text-block">
                <h3 className="upload-main-text">
                  {documentFile ? documentFile.name : "Click to select or drag & drop document"}
                </h3>
                <p className="upload-sub-text">
                  PNG, JPG, JPEG or PDF (Max size: 10MB)
                </p>
              </div>
              {documentFile && (
                <div className="uploaded-indicator">
                  <CheckCircle2 size={16} color="#16A34A" />
                  <span>File Selected</span>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept=".png,.jpg,.jpeg,.pdf"
                hidden
                onChange={handleDocumentChange}
              />
            </div>

            <div className="tips-box">
              <div className="tips-header">
                <FileCheck size={16} color="#04B204" />
                <span>Document Guidelines</span>
              </div>
              <ul className="tips-list">
                <li>Clear and all 4 corners visible</li>
                <li>Full name matches your registration name</li>
                <li>No blur or glare obscuring details</li>
              </ul>
            </div>
          </div>

          {/* STEP 2: LIVE SELFIE */}
          <div className="verification-card">
            <div className="card-step-header">
              <span className="step-num-badge">02</span>
              <div>
                <h2 className="step-title">Live Selfie Confirmation</h2>
                <p className="step-desc">Match your live face with the submitted photo ID</p>
              </div>
            </div>

            <div className="camera-frame-container">
              <div className="camera-viewport">
                {!cameraActive && !selfiePreview && (
                  <div className="camera-placeholder">
                    <Camera size={48} className="camera-standby-icon" />
                    <p className="placeholder-text">Click below to activate your camera</p>
                    <button
                      type="button"
                      className="start-cam-btn"
                      onClick={startCamera}
                    >
                      <Camera size={16} />
                      <span>Start Camera</span>
                    </button>
                  </div>
                )}

                {cameraActive && (
                  <>
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="camera-live-video"
                    />
                    <div className="live-camera-tag">
                      <span className="live-dot-pulse" />
                      <span>Live Video</span>
                    </div>
                    <div className="face-guide-frame">
                      <span className="corner-tl" />
                      <span className="corner-tr" />
                      <span className="corner-bl" />
                      <span className="corner-br" />
                    </div>
                  </>
                )}

                {selfiePreview && (
                  <div className="selfie-preview-wrap">
                    <img
                      src={selfiePreview}
                      alt="Captured selfie"
                      className="selfie-captured-img"
                    />
                    <div className="captured-badge">
                      <CheckCircle2 size={16} color="#ffffff" />
                      <span>Photo Captured</span>
                    </div>
                  </div>
                )}
              </div>

              {cameraActive && (
                <div className="camera-active-controls">
                  <button
                    type="button"
                    className="capture-shutter-btn"
                    onClick={captureSelfie}
                    title="Take Photo"
                  >
                    <div className="shutter-inner" />
                  </button>
                  <span className="shutter-label">Click to Capture</span>
                </div>
              )}

              {selfiePreview && (
                <div className="camera-retake-controls">
                  <button
                    type="button"
                    className="retake-action-btn"
                    onClick={retakeSelfie}
                  >
                    <RotateCcw size={16} />
                    <span>Retake Photo</span>
                  </button>
                </div>
              )}
            </div>

            <div className="tips-box selfie-tips">
              <div className="tips-header">
                <AlertCircle size={16} color="#04B204" />
                <span>Selfie Tips</span>
              </div>
              <ul className="tips-list">
                <li>Good lighting facing your camera</li>
                <li>Remove sunglasses, caps, or face coverings</li>
                <li>Keep neutral expression inside the frame</li>
              </ul>
            </div>
          </div>
        </div>

        {/* FOOTER ACTION BAR */}
        <div className="verification-action-bar">
          <div className="security-guarantee">
            <Lock size={20} color="#04B204" />
            <div>
              <p className="sec-title">256-Bit Encrypted & Privacy Protected</p>
              <p className="sec-sub">Documents are used strictly for provider identity checks and never shared publicly.</p>
            </div>
          </div>

          <button
            type="button"
            className="submit-verification-btn"
            onClick={handleVerify}
            disabled={submitting}
          >
            <span>{submitting ? "Submitting Documents..." : "Submit Verification"}</span>
            <ArrowRight size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}