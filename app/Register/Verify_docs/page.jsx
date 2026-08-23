"use client";
import "./VerificationModule.css";
import { Geist } from "next/font/google";
import {
  ShieldCheck,
  UploadCloud,
  Camera,
  RotateCcw,
  Shield,
  Check,
  ChevronDown,
  ArrowRight,
} from "lucide-react";

const geist = Geist({
  subsets: ["latin"],
});

export default function Page() {
  return (
    <div className={geist.className}>
      <div className="verification-page">
        <div className="verification-container">

          {/* HEADER */}

          <div className="verification-header">
            <div className="verification-icon">
              <ShieldCheck size={40} />
            </div>

            <h1>Identity Verification</h1>

            <p>
              Please submit your government document and a live selfie to verify
              your identity.
            </p>
          </div>

          {/* BODY */}

          <div className="verification-body">

            {/* LEFT */}

            <div className="verification-card">

              <h2>1. Upload Government Document</h2>

              <p className="label">
                Select the type of document
              </p>

              <div className="dropdown">
                <span>Aadhaar Card</span>
                <ChevronDown size={22} />
              </div>

              <div className="upload-box">
                <UploadCloud size={52} strokeWidth={1.5} />

                <h3>Click to upload or drag & drop</h3>

                <p>
                  PNG, JPG, JPEG or PDF
                  <br />
                  Maximum file size 10MB
                </p>
              </div>

              <div className="tips-card">

                <h3>Ensure the document is:</h3>

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

              <h2>2. Take a Live Selfie</h2>

              <p className="label">
                Position your face inside the frame
              </p>

              <div className="camera-container">

                <div className="live-tag">
                  <span className="live-dot"></span>
                  Live
                </div>

                <button className="camera-button">
                  <Camera size={20} />
                </button>

                <div className="camera-preview">

                  <div className="face-guide">
                    <span className="tl"></span>
                    <span className="tr"></span>
                    <span className="bl"></span>
                    <span className="br"></span>
                  </div>

                  <div className="camera-placeholder">
                    Camera Preview
                  </div>

                </div>

                <div className="camera-tip">

                  <div className="tip-icon">💡</div>

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

                <button className="capture-btn"></button>

                <button className="retake-btn">
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
              <span>Your information is secure and encrypted.</span>
            </div>

            <button className="submit-btn">
              Submit Verification
              <ArrowRight size={22} />
            </button>

          </div>

        </div>
      </div>
    </div>
  );
}