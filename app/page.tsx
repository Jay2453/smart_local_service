"use client";
import "./page.css";
import Image from "next/image";
import {
  ArrowRight,
  Star,
  Search,
  UserCheck,
  CalendarCheck,
  Sparkles,
  ShieldCheck,
  FileCheck2,
  Lock,
  Headphones,
  CheckCircle2,
} from "lucide-react";
import About from "@/app/About/page";
import Service from "@/app/Services/page";

export default function Home() {
  const handleAction = (type: string) => {
    window.dispatchEvent(
      new CustomEvent("service-action", {
        detail: { type },
      })
    );
  };

  return (
    <main className="mainback">
      <div className="page">
        {/* HERO SECTION */}
        <section className="hero-section">
          <div className="hero-container">
            <div className="hero-content">
              <div className="hero-badge">
                <span className="badge-pulse" />
                <Sparkles size={14} className="badge-icon" />
                <span>India&apos;s Trusted Local Services Network</span>
              </div>

              <h1 className="title">
                Find Trusted Local <br className="hero-br" />
                Experts.&nbsp;
                <span className="spanclr">
                  Anytime, Anywhere.
                </span>
              </h1>

              <p className="para">
                From plumbing and electrical repairs to carpentry and deep cleaning — connect with background-verified professionals in your neighborhood with upfront pricing and guaranteed quality.
              </p>

              <div className="hero-buttons">
                <button
                  type="button"
                  className="customer-btn"
                  onClick={() => handleAction("book")}
                >
                  <div className="btn-text">
                    <span className="btn-heading">Book a Service</span>
                    <span className="btn-sub">Find Skilled Professionals</span>
                  </div>
                  <div className="btn-icon-wrap">
                    <ArrowRight size={22} strokeWidth={2.4} />
                  </div>
                </button>

                <button
                  type="button"
                  className="worker-btn"
                  onClick={() => handleAction("offer")}
                >
                  <div className="btn-text">
                    <span className="btn-heading">Offer a Service</span>
                    <span className="btn-sub">Grow Your Local Business</span>
                  </div>
                  <div className="btn-icon-wrap worker-icon-wrap">
                    <ArrowRight size={22} strokeWidth={2.4} />
                  </div>
                </button>
              </div>

              {/* Trust & Social Proof Indicator */}
              <div className="trust-section">
                <div className="customers" aria-label="Customer Avatars">
                  <Image
                    src="/images/21yrsoldwomen.png"
                    alt="Customer review profile"
                    width={44}
                    height={44}
                    className="customer-img"
                  />
                  <Image
                    src="/images/foreigner.png"
                    alt="Customer review profile"
                    width={44}
                    height={44}
                    className="customer-img"
                  />
                  <Image
                    src="/images/22yrsold.png"
                    alt="Customer review profile"
                    width={44}
                    height={44}
                    className="customer-img"
                  />
                  <Image
                    src="/images/oldlady.png"
                    alt="Customer review profile"
                    width={44}
                    height={44}
                    className="customer-img"
                  />
                  <Image
                    src="/images/oldman.png"
                    alt="Customer review profile"
                    width={44}
                    height={44}
                    className="customer-img"
                  />
                </div>

                <div className="trust-content">
                  <p className="trust-text">
                    Trusted by <strong>5,000+</strong> happy customers
                  </p>
                  <div className="rating">
                    <div className="stars" aria-label="5 star rating">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          fill="#F59E0B"
                          color="#F59E0B"
                          size={16}
                        />
                      ))}
                    </div>
                    <span className="rating-score">4.8 / 5.0</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="hero-media">
              <div className="hero-image-card">
                <Image
                  src="/images/homebackground.png"
                  alt="SmartServe Professional Services at home"
                  width={560}
                  height={440}
                  className="hero-main-img"
                  priority
                />
                <div className="hero-floating-card top-card">
                  <div className="floating-icon-wrap green-wrap">
                    <ShieldCheck size={20} color="#04B204" />
                  </div>
                  <div>
                    <p className="floating-title">100% Verified Pros</p>
                    <p className="floating-desc">Govt ID & Skill Checked</p>
                  </div>
                </div>

                <div className="hero-floating-card bottom-card">
                  <div className="floating-icon-wrap amber-wrap">
                    <CheckCircle2 size={20} color="#16A34A" />
                  </div>
                  <div>
                    <p className="floating-title">Instant Booking</p>
                    <p className="floating-desc">Guaranteed On-time arrival</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SERVICES SECTION */}
        <section id="services" className="scrollcontrol section-wrapper">
          <Service />
        </section>

        {/* HOW IT WORKS SECTION */}
        <section id="how-it-works" className="scrollcontrol section-wrapper how-it-works-section">
          <div className="section-header-center">
            <span className="section-eyebrow">SIMPLE & TRANSPARENT</span>
            <h2 className="section-title">
              How <span className="spanclr">SmartServe</span> Works
            </h2>
            <p className="section-subtitle">
              Book a verified professional for your home in just 4 quick and effortless steps.
            </p>
          </div>

          <div className="steps-container">
            <div className="step-card">
              <div className="step-badge">01</div>
              <div className="step-icon-box">
                <Search size={28} color="#04B204" />
              </div>
              <h3 className="step-title">Choose a Service</h3>
              <p className="step-desc">
                Select from plumbing, electrical, carpentry, painting, appliances, or pest control.
              </p>
            </div>

            <div className="step-connector" />

            <div className="step-card">
              <div className="step-badge">02</div>
              <div className="step-icon-box">
                <UserCheck size={28} color="#04B204" />
              </div>
              <h3 className="step-title">Find a Professional</h3>
              <p className="step-desc">
                Browse rated, identity-verified professionals available in your specific neighborhood.
              </p>
            </div>

            <div className="step-connector" />

            <div className="step-card">
              <div className="step-badge">03</div>
              <div className="step-icon-box">
                <CalendarCheck size={28} color="#04B204" />
              </div>
              <h3 className="step-title">Book a Time</h3>
              <p className="step-desc">
                Pick a convenient date and time slot with transparent upfront pricing.
              </p>
            </div>

            <div className="step-connector" />

            <div className="step-card">
              <div className="step-badge">04</div>
              <div className="step-icon-box">
                <Sparkles size={28} color="#04B204" />
              </div>
              <h3 className="step-title">Get the Service</h3>
              <p className="step-desc">
                Your skilled expert arrives on time, completes the job, and ensures your satisfaction.
              </p>
            </div>
          </div>
        </section>

        {/* ABOUT US SECTION */}
        <section id="about" className="scrollcontrol section-wrapper">
          <About />
        </section>

        {/* TRUST & SAFETY SECTION */}
        <section id="safety" className="section-wrapper safety-section">
          <div className="safety-container">
            <div className="section-header-center">
              <span className="section-eyebrow">YOUR PEACE OF MIND</span>
              <h2 className="section-title">
                Safety & Trust Built into <span className="spanclr">Every Booking</span>
              </h2>
              <p className="section-subtitle">
                We implement comprehensive safety standards so you can invite professionals into your home with total confidence.
              </p>
            </div>

            <div className="safety-grid">
              <div className="safety-card">
                <div className="safety-icon-wrap">
                  <FileCheck2 size={28} color="#04B204" />
                </div>
                <h3 className="safety-card-title">Government Document Verification</h3>
                <p className="safety-card-desc">
                  Every provider submits official government documents (Aadhaar, PAN, License) reviewed before receiving jobs.
                </p>
              </div>

              <div className="safety-card">
                <div className="safety-icon-wrap">
                  <ShieldCheck size={28} color="#04B204" />
                </div>
                <h3 className="safety-card-title">Live Identity Check</h3>
                <p className="safety-card-desc">
                  Providers complete live selfie and biometric identity confirmation matching their submitted credentials.
                </p>
              </div>

              <div className="safety-card">
                <div className="safety-icon-wrap">
                  <Lock size={28} color="#04B204" />
                </div>
                <h3 className="safety-card-title">Secure Booking & Pricing</h3>
                <p className="safety-card-desc">
                  Clear upfront estimates with zero surprise fees. Transparent tracking from booking confirmation to completion.
                </p>
              </div>

              <div className="safety-card">
                <div className="safety-icon-wrap">
                  <Headphones size={28} color="#04B204" />
                </div>
                <h3 className="safety-card-title">Dedicated Customer Care</h3>
                <p className="safety-card-desc">
                  Our customer support team is always ready to assist with rescheduling, queries, or service resolution.
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}