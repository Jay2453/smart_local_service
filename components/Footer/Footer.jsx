import React from 'react';
import Link from 'next/link';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="footer">

      <div className="footer-container">

        {/* Logo Section */}

        <div className="footer-section">

          <h2 className="footer-logo">SmartServe</h2>

          <p className="footer-desc">
            Connecting skilled professionals with customers through
            a trusted, smart and AI-powered local services platform.
          </p>

        </div>

        {/* Quick Links */}

        <div className="footer-section">

          <h3>Quick Links</h3>

          <ul>

            <li><Link href="/">Home</Link></li>

            <li><Link href="/#services">Services</Link></li>

            <li><Link href="/">How it Works</Link></li>

            <li><Link href="/#about">About Us</Link></li>

            <li><Link href="/">Contact</Link></li>

          </ul>

        </div>

        {/* Services */}

        <div className="footer-section">

          <h3>Popular Services</h3>

          <ul>

            <li>Electrician</li>

            <li>Plumber</li>

            <li>Carpenter</li>

            <li>Painter</li>

            <li>Cleaning</li>

          </ul>

        </div>

        {/* Contact */}

        <div className="footer-section">

          <h3>Contact</h3>

          <p>📍 Gujarat, India</p>

          <p>📞 +91 XXXXX XXXXX</p>

          <p>✉ smartserve@gmail.com</p>

        </div>

      </div>

      <hr />

      <div className="copyright">

        © 2026 SmartServe. All Rights Reserved.

      </div>

    </footer>
  )
}

export default Footer;