import React from "react";
import "./service.css";
import Image from "next/image";
import {
  Wrench,
  Zap,
  Hammer,
  Paintbrush,
  Refrigerator,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";

const SERVICES_DATA = [
  {
    id: "plumbing",
    name: "Plumbing",
    image: "/images/plumber.png",
    alt: "Plumbing services",
    icon: Wrench,
    description: "Leak repairs, pipe installations, bathroom fittings & more.",
    tasks: ["Leak Repair & Detection", "Pipe Installation & Fitting", "Faucet & Shower Repair"],
  },
  {
    id: "electrical",
    name: "Electrical",
    image: "/images/electrician.png",
    alt: "Electrical services",
    icon: Zap,
    description: "Wiring, fan installation, switch repair & electrical safety.",
    tasks: ["Wiring & Rewiring", "Light & Fan Installation", "Switch & Socket Repair"],
  },
  {
    id: "carpentry",
    name: "Carpentry",
    image: "/images/carpenter.png",
    alt: "Carpentry services",
    icon: Hammer,
    description: "Furniture repair, custom woodwork, doors & window locks.",
    tasks: ["Furniture Repair & Build", "Wood Polishing & Finish", "Door & Window Fitting"],
  },
  {
    id: "painting",
    name: "Painting",
    image: "/images/painter.png",
    alt: "Painting services",
    icon: Paintbrush,
    description: "Interior & exterior painting with premium waterproof finishes.",
    tasks: ["Interior Home Painting", "Exterior Wall Painting", "Waterproofing & Textures"],
  },
  {
    id: "appliance",
    name: "Appliance Repair",
    image: "/images/repairs.png",
    alt: "Appliance repair services",
    icon: Refrigerator,
    description: "Fast diagnostics and repair service for all home appliances.",
    tasks: ["Washing Machine Repair", "Refrigerator Servicing", "Microwave & AC Repair"],
  },
  {
    id: "pest",
    name: "Pest Control",
    image: "/images/pesting.png",
    alt: "Pest control services",
    icon: ShieldCheck,
    description: "Safe and odorless protection against all household pests.",
    tasks: ["Cockroach & Ant Control", "Termite Prevention", "Rodent Management"],
  },
];

export default function Service() {
  return (
    <div className="services-container">
      <div className="services-header">
        <span className="services-tag">OUR SERVICES</span>
        <h2 className="servehead">
          Expert Services, Right at <span className="servespan">Your Doorstep</span>
        </h2>
        <p className="subserve">
          From quick fixes to complete installations, find trusted, background-verified professionals for every home care need.
        </p>
      </div>

      <div className="services-grid">
        {SERVICES_DATA.map((service) => {
          const Icon = service.icon;
          return (
            <article key={service.id} className="service-card">
              <div className="service-image-box">
                <Image
                  src={service.image}
                  alt={service.alt}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  className="service-img"
                />
                <div className="service-image-overlay" />
                <div className="service-icon-badge">
                  <Icon size={22} color="#04B204" strokeWidth={2} />
                </div>
              </div>

              <div className="service-info">
                <h3 className="servicename">{service.name}</h3>
                <p className="infopara">{service.description}</p>
                <div className="service-divider" />
                <ul className="service-tasks">
                  {service.tasks.map((task, idx) => (
                    <li key={idx}>
                      <CheckCircle2 size={14} className="task-check-icon" />
                      <span>{task}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
