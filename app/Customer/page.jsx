"use client";
import Navbar from '@/components/Navbar/Navbar';
import React, { useState, useRef } from "react";
import {
  Hammer,
  Zap,
  WashingMachine,
  Droplets,
  Bug,
  PaintRoller,
  Grid2x2,
  MapPin,
  Crosshair,
  Calendar,
  Clock,
  ShieldCheck,
  X,
  Plus,
  Camera,
  ChevronRight,
} from "lucide-react";
import styles from "./customer.module.css";

// ---- Static catalogue -------------------------------------------------

const SERVICES = [
  {
    id: "carpentry",
    name: "Carpentry",
    icon: Hammer,
    iconBg: "#EAF0FB",
    iconColor: "#3B5EDB",
    price: 549,
    problems: ["Furniture Repair", "Door/Window Fix", "Assembly", "Polishing", "Other"],
  },
  {
    id: "electrical",
    name: "Electrical",
    icon: Zap,
    iconBg: "#FDF3DC",
    iconColor: "#E3A008",
    price: 399,
    problems: ["Wiring Issue", "Switch/Socket", "Fan Repair", "Tap Repair", "Short Circuit", "Other"],
  },
  {
    id: "appliance",
    name: "Appliance Repair",
    icon: WashingMachine,
    iconBg: "#F1EEFC",
    iconColor: "#7C5CE0",
    price: 599,
    problems: ["Not Turning On", "Noise Issue", "Cooling Problem", "Installation", "Other"],
  },
  {
    id: "plumbing",
    name: "Plumbing",
    icon: Droplets,
    iconBg: "#E7F5EE",
    iconColor: "#1F8A55",
    price: 499,
    problems: ["Leakage", "Pipe Blockage", "Low Water Pressure", "Tap Repair", "Drainage Issue", "Other"],
  },
  {
    id: "pest",
    name: "Pest Control",
    icon: Bug,
    iconBg: "#FCE9EE",
    iconColor: "#D6396B",
    price: 699,
    problems: ["Cockroach", "Termite", "Rodents", "Mosquito", "Other"],
  },
  {
    id: "painting",
    name: "Painting",
    icon: PaintRoller,
    iconBg: "#EFEEFC",
    iconColor: "#5B4FCF",
    price: 799,
    problems: ["Wall Touch-up", "Full Room", "Waterproofing", "Other"],
  },
];

// ---- Small building blocks --------------------------------------------

function ServiceCard({ service, selected, onToggle }) {
  const Icon = service.icon;
  return (
    <button
      type="button"
      onClick={() => onToggle(service.id)}
      aria-pressed={selected}
      className={`${styles.serviceCard} ${selected ? styles.serviceCardSelected : ""}`}
    >
      <span className={styles.serviceIconWrap} style={{ background: service.iconBg }}>
        <Icon size={24} color={service.iconColor} strokeWidth={2} />
      </span>
      <span className={styles.serviceName}>{service.name}</span>
    </button>
  );
}

function Pill({ label, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`${styles.pill} ${active ? styles.pillActive : ""}`}
    >
      {label}
    </button>
  );
}

function SectionLabel({ children }) {
  return <div className={styles.sectionLabel}>{children}</div>;
}

function SummaryRow({ icon, title, action, children }) {
  return (
    <div>
      <div className={styles.summaryRowHead}>
        <div className={styles.summaryRowTitle}>
          {icon}
          {title}
        </div>
        <button type="button" className={styles.linkBtn}>
          {action}
        </button>
      </div>
      <div className={styles.summaryRowBody}>
        {icon ? <span className={styles.summaryRowSpacer} /> : null}
        <div style={{ flex: 1 }}>{children}</div>
      </div>
    </div>
  );
}

// ---- Main component -----------------------------------------------------

export default function BookService() {
  const [address, setAddress] = useState("");
  const [multiService, setMultiService] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [activeProblemTab, setActiveProblemTab] = useState("");
  const [problemChoice, setProblemChoice] = useState({});
  const [description, setDescription] = useState("");
  const [photos, setPhotos] = useState([
    { id: "p1", label: "Pipe under sink" },
    { id: "p2", label: "Wall pipe" },
  ]);
  const fileInputRef = useRef(null);

  const selectedServices = SERVICES.filter((s) => selectedIds.includes(s.id));

  function toggleService(id) {
    setSelectedIds((prev) => {
      let next;
      if (prev.includes(id)) {
        next = prev.filter((x) => x !== id);
      } else if (multiService) {
        next = [...prev, id];
      } else {
        next = [id];
      }
      if (next.length && !next.includes(activeProblemTab)) {
        setActiveProblemTab(next[0]);
      }
      if (!next.length) setActiveProblemTab(null);
      return next;
    });
  }

  function removeService(id) {
    toggleService(id);
  }

  function setProblem(serviceId, problem) {
    setProblemChoice((prev) => ({ ...prev, [serviceId]: problem }));
  }

  function handleFiles(e) {
    const files = Array.from(e.target.files || []);
    const additions = files.slice(0, 4 - photos.length).map((f, i) => ({
      id: `${Date.now()}-${i}`,
      label: f.name,
    }));
    setPhotos((prev) => [...prev, ...additions]);
    e.target.value = "";
  }

  function removePhoto(id) {
    setPhotos((prev) => prev.filter((p) => p.id !== id));
  }

  const total = selectedServices.reduce((sum, s) => sum + s.price, 0);
  const activeService = SERVICES.find((s) => s.id === activeProblemTab);

  return (
    <>
    <Navbar/>
    <div className={styles.page}>
      <div className={styles.grid}>
  
        {/* ---------------- LEFT: FORM ---------------- */}
        <div className={styles.card}>
          <h1 className={styles.title}>Book a Service</h1>
          <p className={styles.subtitle}>
            Select the service(s) you need and tell us about the issue.
          </p>

          {/* 1. Address */}
          <SectionLabel>1. Service Address</SectionLabel>
          <div className={styles.addressBox}>
            <MapPin size={18} color="#A1A1AA" />
            <input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Enter your complete address"
              className={styles.addressInput}
            />
            <Crosshair size={18} className={styles.greenIcon} />
          </div>

          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={multiService}
              onChange={(e) => setMultiService(e.target.checked)}
              className={styles.checkbox}
            />
            Choose multiple services at a time
          </label>

          {/* 2. Services */}
          <div className={styles.sectionSpacer}>
            <SectionLabel>2. Select Service(s)</SectionLabel>
          </div>
          <div className={styles.serviceGrid}>
            {SERVICES.map((s) => (
              <ServiceCard
                key={s.id}
                service={s}
                selected={selectedIds.includes(s.id)}
                onToggle={toggleService}
              />
            ))}
          </div>

          {/* 3. Describe issue */}
          <div className={styles.describeSection}>
            <div className={styles.describeHead}>
              <SectionLabel>3. Describe the Issue</SectionLabel>
              <button
                type="button"
                onClick={() => {
                  setSelectedIds([]);
                  setDescription("");
                  setPhotos([]);
                  setProblemChoice({});
                  setActiveProblemTab(null);
                }}
                className={styles.linkBtn}
              >
                Clear all
              </button>
            </div>

            {selectedServices.length === 0 && (
              <p className={styles.emptyHint}>
                Select a service above to describe your issue.
              </p>
            )}

            {selectedServices.length > 0 && (
              <>
                {selectedServices.length > 1 && (
                  <div className={styles.pillRow}>
                    {selectedServices.map((s) => (
                      <Pill
                        key={s.id}
                        label={s.name}
                        active={activeProblemTab === s.id}
                        onClick={() => setActiveProblemTab(s.id)}
                      />
                    ))}
                  </div>
                )}

                {activeService && (
                  <div className={styles.problemBlock}>
                    <div className={styles.fieldLabel}>
                      Related Problem ({activeService.name})
                    </div>
                    <div className={styles.pillRow}>
                      {activeService.problems.map((p) => (
                        <Pill
                          key={p}
                          label={p}
                          active={problemChoice[activeService.id] === p}
                          onClick={() => setProblem(activeService.id, p)}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            <div className={styles.fieldBlock}>
              <div className={styles.fieldLabel}>Briefly describe your issue</div>
              <textarea
                value={description}
                maxLength={500}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Write a brief description of the issue..."
                rows={4}
                className={styles.textarea}
              />
              <div className={styles.charCount}>{description.length}/500</div>
            </div>

            <div className={styles.fieldBlock}>
              <div className={styles.fieldLabel}>
                Upload Photos <span className={styles.optionalLabel}>(Optional)</span>
              </div>
              <div className={styles.photoRow}>
                <label className={styles.uploadTile}>
                  <Camera size={20} color="#A1A1AA" />
                  <span className={styles.uploadTitle}>Click to upload photos</span>
                  <span>PNG, JPG, JPEG up to 5MB</span>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg"
                    multiple
                    onChange={handleFiles}
                    className={styles.hiddenInput}
                  />
                </label>

                {photos.map((p) => (
                  <div key={p.id} className={styles.photoThumb} title={p.label}>
                    <span className={styles.photoLabel}>{p.label}</span>
                    <button
                      type="button"
                      onClick={() => removePhoto(p.id)}
                      className={styles.photoRemoveBtn}
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}

                {photos.length < 4 && (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className={styles.addPhotoBtn}
                  >
                    <Plus size={20} />
                  </button>
                )}
              </div>
            </div>
          </div>

          <button
            type="button"
            disabled={selectedServices.length === 0 || !address}
            className={styles.submitBtn}
          >
            Book Service <ChevronRight size={18} />
          </button>
        </div>

        {/* ---------------- RIGHT: SUMMARY ---------------- */}
        <div className={styles.summaryCard}>
          <div className={styles.summaryHeader}>
            <Calendar size={20} className={styles.greenIcon} />
            <span className={styles.summaryHeaderTitle}>Booking Summary</span>
          </div>

          <div className={styles.summaryCount}>
            Selected Services ({selectedServices.length})
          </div>

          {selectedServices.length === 0 && (
            <p className={styles.emptyHint}>No services selected yet.</p>
          )}

          {selectedServices.map((s, idx) => {
            const Icon = s.icon;
            return (
              <div key={s.id}>
                <div className={styles.summaryItem}>
                  <div className={styles.summaryItemLeft}>
                    <span className={styles.summaryIconWrap} style={{ background: s.iconBg }}>
                      <Icon size={18} color={s.iconColor} />
                    </span>
                    <div>
                      <div className={styles.summaryItemName}>{s.name}</div>
                      {problemChoice[s.id] && (
                        <span className={styles.tag}>{problemChoice[s.id]}</span>
                      )}
                    </div>
                  </div>
                  <div className={styles.summaryItemRight}>
                    <span className={styles.summaryItemPrice}>₹{s.price}</span>
                    <button
                      type="button"
                      onClick={() => removeService(s.id)}
                      className={styles.iconBtn}
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>
                {idx < selectedServices.length - 1 && <div className={styles.divider} />}
              </div>
            );
          })}

          <div className={styles.divider} />

          <SummaryRow
            icon={<MapPin size={16} className={styles.greenIcon} />}
            title="Service Address"
            action="Edit"
          >
            <div className={styles.addressText}>
              {address ||
                "A-102, Green View Apartments, E-Block, PDEU Road, Gandhinagar - 382007"}
            </div>
          </SummaryRow>

          <div className={styles.divider} />

          <SummaryRow title="Preferred Date & Time" action="Edit">
            <div className={styles.dateTimeRow}>
              <Calendar size={15} /> 24 May 2024, Friday
            </div>
            <div className={styles.dateTimeRow}>
              <Clock size={15} /> 10:00 AM - 12:00 PM
            </div>
          </SummaryRow>

          <div className={styles.divider} />

          <div className={styles.totalRow}>
            <span className={styles.totalLabel}>Estimated Total</span>
            <span className={styles.totalValue}>₹{total}</span>
          </div>

          <div className={styles.secureBox}>
            <ShieldCheck size={22} className={styles.greenIcon} />
            <div>
              <div className={styles.secureTitle}>Secure Booking</div>
              <div className={styles.secureText}>
                Your payment will be collected after the service is completed.
              </div>
            </div>
          </div>

          <button type="button" className={styles.changeDateBtn}>
            <Calendar size={16} /> Change Date &amp; Time
          </button>
        </div>
      </div>
    </div>
    </>
  );
}
