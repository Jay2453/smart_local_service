"use client";
import "./page.css";
import Image from "next/image";
import {
  ArrowRight,
  Star,
} from "lucide-react";
import About from "@/app/About/page";
import Service from "@/app/Services/page";

export default function Home() {

  return (
    <>
      <main className="mainback">

        <div className='page'>

          <section className="homepage">

            <div className="homeback">
              <Image
                src="/images/homebackground.png"
                alt="Home background image"
                fill
                style={{ objectFit: "cover" }}
              />
            </div>

            <div className="mainbox">

              <h1 className="title">
                Find Trusted Local <br />
                Experts.&nbsp;
                <span className="spanclr">
                  Anytime, &nbsp;Anywhere
                </span>.
              </h1>

              <p className="para1 para">
                From plumding to painting, electricians to carpenters -
              </p>

              <p className="para2 para">
                find skilled professioinals near you and get the job done right.
              </p>

              <div className="hero-buttons">

                <button
                  className="customer-btn"
                  onClick={() => window.dispatchEvent(
                    new CustomEvent("service-action", {
                      detail: { type: "book" }
                    })
                  )}
                >
                  <div className="btn-text">
                    <h3>Book a Service</h3>
                    <p>Book Skilled Professionals</p>
                  </div>

                  <ArrowRight
                    size={34}
                    strokeWidth={2.2}
                  />
                </button>

                <button
                  className="worker-btn"
                  onClick={() => window.dispatchEvent(
                    new CustomEvent("service-action", {
                      detail: { type: "offer" }
                    })
                  )}
                >
                  <div className="btn-text">
                    <h3>Offer a Service</h3>
                    <p>Reach More Customers</p>
                  </div>

                  <ArrowRight
                    size={34}
                    strokeWidth={2.2}
                  />
                </button>

              </div>

              <div className="trust-section">

                <div className="customers">

                  <Image
                    src="/images/21yrsoldwomen.png"
                    alt=""
                    width={52}
                    height={52}
                    className="customer-img"
                  />

                  <Image
                    src="/images/foreigner.png"
                    alt=""
                    width={52}
                    height={52}
                    className="customer-img"
                  />

                  <Image
                    src="/images/22yrsold.png"
                    alt=""
                    width={52}
                    height={52}
                    className="customer-img"
                  />

                  <Image
                    src="/images/oldlady.png"
                    alt=""
                    width={52}
                    height={52}
                    className="customer-img"
                  />

                  <Image
                    src="/images/oldman.png"
                    alt=""
                    width={52}
                    height={52}
                    className="customer-img"
                  />

                </div>

                <div className="trust-content">

                  <p>
                    Trusted by 5,000+ customers
                  </p>

                  <div className="rating">

                    <div className="stars">

                      <Star
                        fill="#FFC107"
                        color="#FFC107"
                        size={20}
                      />

                      <Star
                        fill="#FFC107"
                        color="#FFC107"
                        size={20}
                      />

                      <Star
                        fill="#FFC107"
                        color="#FFC107"
                        size={20}
                      />

                      <Star
                        fill="#FFC107"
                        color="#FFC107"
                        size={20}
                      />

                      <Star
                        fill="#FFC107"
                        color="#FFC107"
                        size={20}
                      />

                    </div>

                    <span>
                      4.8/5
                    </span>

                  </div>

                </div>

              </div>

            </div>

            <section
              id="services"
              className="scrollcontrol"
            >
              <Service />
            </section>

            <section
              id="about"
              className="scrollcontrol"
            >
              <About />
            </section>

          </section>

        </div>

      </main>
    </>
  );
}