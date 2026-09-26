import Image from "next/image";
import "./about.css";
import {
  ShieldCheck,
  ReceiptText,
  HeadphonesIcon,
  CheckCircle2,
} from "lucide-react";

export default function About() {
  return (
    <section className="about-container">
      <div className="about-left">
        <span className="about-tag">ABOUT SMARTSERVE</span>

        <h2 className="about-heading">
          Making Local Services <br />
          <span>Simple, Reliable & Safe.</span>
        </h2>

        <p className="about-description">
          SmartServe is built to eliminate the stress of finding reliable help for your home. We connect households with background-verified, skilled local service providers through a transparent, high-trust digital platform.
        </p>

        <div className="about-features">
          <div className="about-feature-item">
            <div className="feature-icon-box">
              <ShieldCheck size={26} color="#04B204" />
            </div>
            <div>
              <h3 className="feature-title">Verified Professionals</h3>
              <p className="feature-desc">
                Connect with vetted service professionals who undergo government identity and skill verification.
              </p>
            </div>
          </div>

          <div className="about-feature-item">
            <div className="feature-icon-box">
              <ReceiptText size={26} color="#04B204" />
            </div>
            <div>
              <h3 className="feature-title">Transparent Service</h3>
              <p className="feature-desc">
                Clear service breakdown and straightforward upfront pricing with zero hidden convenience fees.
              </p>
            </div>
          </div>

          <div className="about-feature-item">
            <div className="feature-icon-box">
              <HeadphonesIcon size={26} color="#04B204" />
            </div>
            <div>
              <h3 className="feature-title">Reliable Support</h3>
              <p className="feature-desc">
                Effortlessly manage, reschedule, or get help on your bookings with our dedicated support team.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="about-right">
        <div className="about-image-wrapper">
          <Image
            src="/images/family service.png"
            alt="SmartServe reliable home service experience"
            fill
            sizes="(max-width: 900px) 100vw, 50vw"
            style={{ objectFit: "cover", objectPosition: "center top" }}
            className="about-main-image"
          />
          <div className="about-floating-badge">
            <div className="badge-check">
              <CheckCircle2 size={22} color="#ffffff" />
            </div>
            <div>
              <p className="badge-number">10,000+ Services</p>
              <p className="badge-sub">Successfully Delivered</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}