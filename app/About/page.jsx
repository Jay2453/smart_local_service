import Image from "next/image";
import './about.css';
import {
    ShieldCheck,
    BadgeIndianRupee,
    Headset
} from "lucide-react";
 
export default function About() {
    return (
        <section className="about-section">

            <div className="about-left">

                <h1 className="about-heading">
                    We&apos;re on a Mission to
                    <br />
                    Make Local Services
                    <br />
                    <span>Smarter & Safer.</span>
                </h1>

                <p className="about-description">
                    SmartServe connects you with verified professionals
                    who are skilled, trusted, and ready to help.
                    Our platform is built to bring transparency,
                    convenience, and safety to every service experience.
                </p>

                <div className="about-features">

                    <div className="feature-card">

                        <div className="feature-icon">
                            <ShieldCheck size={36} />
                        </div>

                        <div>

                            <h3 className="manropefont">Verified Professionals</h3>

                            <p className="parafont">
                                Every worker is background checked
                                and identity verified.
                            </p>

                        </div>

                    </div>

                    <div className="feature-card">

                        <div className="feature-icon">
                            <BadgeIndianRupee size={36}/>
                        </div>

                        <div>

                            <h3 className="manropefont">Transparent Pricing</h3>

                            <p className="parafont">
                                Clear upfront pricing with
                                no hidden charges.
                            </p>

                        </div>

                    </div>

                    <div className="feature-card">

                        <div className="feature-icon">
                            <Headset size={36}/>
                        </div>

                        <div>

                            <h3 className="manropefont">24/7 Support</h3>

                            <p className="parafont">
                                Our support team is available
                                whenever you need help.
                            </p>

                        </div>

                    </div>

                </div>

            </div>

            <div className="about-right">

                <Image
                    src="/images/family service.png"
                    alt="Worker"
                    fill
                    style={{objectFit:"cover", objectPosition: 'center top'}}
                />

            </div>

        </section>
    );
}