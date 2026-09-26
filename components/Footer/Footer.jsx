import React from "react";
import Link from "next/link";
import "./Footer.css";
import {
  MapPin,
  Phone,
  Mail,
  ShieldCheck,
  CheckCircle2,
  Clock,
  ArrowUpRight,
} from "lucide-react";

const Footer = () => {
  return (
    <footer id="contact" className="footer">
      <div className="footer-top-strip">
        <div className="footer-container strip-grid">
          <div className="strip-item">
            <ShieldCheck size={22} color="#04B204" />
            <div>
              <strong>100% Verified Experts</strong>
              <p>Government ID & skill certified</p>
            </div>
          </div>
          <div className="strip-item">
            <CheckCircle2 size={22} color="#04B204" />
            <div>
              <strong>Upfront Pricing</strong>
              <p>Transparent rates, no hidden fees</p>
            </div>
          </div>
          <div className="strip-item">
            <Clock size={22} color="#04B204" />
            <div>
              <strong>Quick Response</strong>
              <p>Local pros ready within hours</p>
            </div>
          </div>
        </div>
      </div>

      <div className="footer-container">
        <div className="footer-main-grid">
          {/* Col 1: Brand */}
          <div className="footer-col brand-col">
            <Link href="/" className="footer-logo-link">
              <span className="footer-brand-title">Smart<span className="footer-brand-green">Serve</span></span>
            </Link>
            <p className="footer-desc">
              India&apos;s modern on-demand marketplace connecting trusted, vetted service professionals with residential customers for seamless home maintenance.
            </p>
            <div className="footer-trust-pill">
              <ShieldCheck size={16} color="#04B204" />
              <span>Safe & Secure Platform</span>
            </div>
          </div>

          {/* Col 2: Quick Links */}
          <div className="footer-col">
            <h3 className="footer-heading">Navigation</h3>
            <ul className="footer-links">
              <li><Link href="/">Home</Link></li>
              <li><Link href="/#services">Services</Link></li>
              <li><Link href="/#how-it-works">How It Works</Link></li>
              <li><Link href="/#about">About Us</Link></li>
              <li><Link href="#contact">Contact Support</Link></li>
            </ul>
          </div>

          {/* Col 3: Services */}
          <div className="footer-col">
            <h3 className="footer-heading">Popular Services</h3>
            <ul className="footer-links">
              <li><Link href="/#services">Plumbing Services</Link></li>
              <li><Link href="/#services">Electrical Repairs</Link></li>
              <li><Link href="/#services">Carpentry & Woodwork</Link></li>
              <li><Link href="/#services">House Painting</Link></li>
              <li><Link href="/#services">Appliance Repair</Link></li>
              <li><Link href="/#services">Pest Control</Link></li>
            </ul>
          </div>

          {/* Col 4: Contact & Help */}
          <div className="footer-col contact-col">
            <h3 className="footer-heading">Get in Touch</h3>
            <ul className="footer-contact-list">
              <li>
                <MapPin size={18} className="contact-icon" />
                <span>Gujarat, India</span>
              </li>
              <li>
                <Phone size={18} className="contact-icon" />
                <span>+91 98765 43210</span>
              </li>
              <li>
                <Mail size={18} className="contact-icon" />
                <span>support@smartserve.in</span>
              </li>
            </ul>
            <div className="footer-work-with-us">
              <span>Are you a skilled worker?</span>
              <Link href="/Register" className="worker-join-link">
                Register as Provider <ArrowUpRight size={14} />
              </Link>
            </div>
          </div>
        </div>

        <div className="footer-bottom-bar">
          <p className="copyright">
            © {new Date().getFullYear()} SmartServe Technologies. All rights reserved.
          </p>
          <div className="footer-legal-links">
            <Link href="#">Privacy Policy</Link>
            <span className="dot">•</span>
            <Link href="#">Terms of Service</Link>
            <span className="dot">•</span>
            <Link href="#">Security</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;