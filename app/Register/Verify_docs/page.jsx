"use client";
import "./VerificationModule.css";
import { useState, useRef } from "react";
import { Geist } from "next/font/google";
import NotificationBanner from "../../../components/NotificationBanner/NotificationBanner";
import {
  ShieldCheck,
  UploadCloud,
  Camera,
  RotateCcw,
  Shield,
  Check,
  ArrowRight,
} from "lucide-react";

const geist = Geist({
  subsets: ["latin"],
});

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
      showNotification("Please click a live selfie.");
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
    }
  };

  // Capture selfie
  const captureSelfie = () => {

    const video = videoRef.current;

    if (!video || !cameraActive) {
      return;
    }

    const canvas = document.createElement("canvas");

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const context = canvas.getContext("2d");

    context.drawImage(
      video,
      0,
      0,
      canvas.width,
      canvas.height
    );

    canvas.toBlob((blob) => {

      if (!blob) {
        return;
      }

      const selfieFile = new File(
        [blob],
        "selfie.jpg",
        {
          type: "image/jpeg",
        }
      );

      setSelfie(selfieFile);

      const previewURL = URL.createObjectURL(selfieFile);
      setSelfiePreview(previewURL);

    }, "image/jpeg");

    const stream = video.srcObject;

    if (stream) {
      stream.getTracks().forEach((track) => {
        track.stop();
      });
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

    if (!file) {
      return;
    }

    if (file.size > 10 * 1024 * 1024) {

      alert("File size must be less than 10MB");

      e.target.value = "";

      return;
    }

    setDocumentFile(file);
  };

  return (

    <div className={geist.className}>
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
      <div className="verification-page">

        <div className="verification-container">

          {/* HEADER */}

          <div className="verification-header">

            <div className="verification-icon">
              <ShieldCheck size={40} />
            </div>

            <h1>
              Identity Verification
            </h1>

            <p>
              Please submit your government document and a live selfie to verify
              your identity.
            </p>

          </div>

          {/* BODY */}

          <div className="verification-body">

            {/* LEFT */}

            <div className="verification-card">

              <h2>
                1. Upload Government Document
              </h2>

              <p className="label">
                Select the type of document
              </p>

              <select
                name="documentType"
                className="dropdown"
                value={documentType}
                onChange={(e) => setDocumentType(e.target.value)}
              >

                <option value="">
                  Select document
                </option>

                <option value="aadhar">
                  Aadhar Card
                </option>

                <option value="pan">
                  PAN Card
                </option>

                <option value="driving-license">
                  Driving License
                </option>

                <option value="passport">
                  Passport
                </option>

              </select>

              <div
                className="upload-box"
                onClick={() => fileInputRef.current?.click()}
              >

                <UploadCloud
                  size={52}
                  strokeWidth={1.5}
                />

                <h3>
                  {documentFile
                    ? documentFile.name
                    : "Click to upload your file"}
                </h3>

                <p>
                  PNG, JPG, JPEG or PDF
                  <br />
                  Maximum file size 10MB
                </p>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".png,.jpg,.jpeg,.pdf"
                  hidden
                  onChange={handleDocumentChange}
                />

              </div>

              <div className="tips-card">

                <h3>
                  Ensure the document is:
                </h3>

                <ul>

                  <li>
                    <Check size={18} />
                    Clear and readable
                  </li>

                  <li>
                    <Check size={18} />
                    All corners are visible
                  </li>

                  <li>
                    <Check size={18} />
                    Not blurred or cropped
                  </li>

                </ul>

              </div>

            </div>

            {/* RIGHT */}

            <div className="verification-card">

              <h2>
                2. Take a Live Selfie
              </h2>

              <p className="label">
                Position your face inside the frame
              </p>

              <div className="camera-container">

                <div className="live-tag">

                  <span className="live-dot"></span>

                  Live

                </div>

                <button
                  type="button"
                  className="camera-button"
                  onClick={startCamera}
                >

                  <Camera size={20} />

                </button>

                <div className="camera-preview">

                  {!selfiePreview && (
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="camera-video"
                    />
                  )}

                  {selfiePreview && (
                    <img
                      src={selfiePreview}
                      alt="Captured selfie"
                      className="selfie-preview"
                    />
                  )}

                  <div className="face-guide">

                    <span className="tl"></span>
                    <span className="tr"></span>
                    <span className="bl"></span>
                    <span className="br"></span>

                  </div>

                </div>

                <div className="camera-tip">

                  <div className="tip-icon">
                    💡
                  </div>

                  <div>

                    <strong>
                      Ensure good lighting and clear visibility
                    </strong>

                    <p>
                      Remove glasses, hat or masks.
                    </p>

                  </div>

                </div>

              </div>

              <div className="capture-controls">

                <button
                  type="button"
                  className="capture-btn"
                  onClick={captureSelfie}
                  disabled={!cameraActive}
                >
                </button>

                <button
                  type="button"
                  className="retake-btn"
                  onClick={retakeSelfie}
                  disabled={!selfie}
                >

                  <RotateCcw size={18} />

                  Retake

                </button>

              </div>

            </div>

          </div>

          {/* FOOTER */}

          <div className="verification-footer">

            <div className="security-message">

              <Shield size={22} />

              <span>
                Your information is secure and encrypted.
              </span>

            </div>

            <button
              type="button"
              className="submit-btn"
              onClick={handleVerify}
              disabled={submitting}
            >

              {submitting ? "Submitting..." : "Submit Verification"}

              <ArrowRight size={22} />

            </button>

          </div>

        </div>

      </div>

    </div>
  );
}