"use client";
import Navbar from '@/components/Navbar/Navbar';
import React, { useState } from "react";
import {
  Bell,
  ChevronDown,
  ChevronRight,
  ShoppingBag,
  Briefcase,
  Calendar,
  Wallet,
  MapPin,
  User,
  Droplets,
  Zap,
  CheckCircle2,
  Star,
  Shield,
} from "lucide-react";
import styles from "./ProviderDashboard.module.css";

// ---- Static data --------------------------------------------------------

const STATS = [
  {
    id: "requests",
    label: "New Requests",
    value: 8,
    note: "+2 from yesterday",
    noteColor: "green",
    icon: ShoppingBag,
    iconBg: "#E7F5EE",
    iconColor: "#1F8A55",
  },
  {
    id: "accepted",
    label: "Accepted Jobs",
    value: 3,
    note: "2 in progress",
    noteColor: "purple",
    icon: Briefcase,
    iconBg: "#F1EEFC",
    iconColor: "#7C5CE0",
  },
  {
    id: "today",
    label: "Today's Jobs",
    value: 2,
    note: "Next: 4:30 PM",
    noteColor: "blue",
    icon: Calendar,
    iconBg: "#E9F1FE",
    iconColor: "#3B82F6",
  },
  {
    id: "earnings",
    label: "Earnings (This Month)",
    value: "₹18,450",
    note: "+12% from last month",
    noteColor: "green",
    icon: Wallet,
    iconBg: "#FDF3DC",
    iconColor: "#E3A008",
  },
];

const REQUESTS = [
  {
    id: "r1",
    category: "Plumbing",
    title: "Tap Leakage",
    customer: "Ankit Sharma",
    distance: "2.4 km away",
    time: "Today, 4:30 PM",
    description: "Water has been leaking from the kitchen tap since yesterday.",
    priceLow: 500,
    priceHigh: 800,
    icon: Droplets,
    iconBg: "#E7F5EE",
    iconColor: "#1F8A55",
    photos: 2,
  },
  {
    id: "r2",
    category: "Electrical",
    title: "Switch Board Issue",
    customer: "Priya Mehta",
    distance: "1.8 km away",
    time: "Today, 6:00 PM",
    description: "Switch board is sparking and some sockets not working.",
    priceLow: 400,
    priceHigh: 700,
    icon: Zap,
    iconBg: "#FDF3DC",
    iconColor: "#E3A008",
    photos: 1,
  },
];

const SCHEDULE = [
  {
    id: "s1",
    title: "Tap Leakage",
    customer: "Ankit Sharma",
    time: "4:30 PM",
    distance: "2.4 km",
    icon: Droplets,
    iconBg: "#E7F5EE",
    iconColor: "#1F8A55",
  },
  {
    id: "s2",
    title: "Pipe Installation",
    customer: "Neha Patel",
    time: "7:00 PM",
    distance: "3.1 km",
    icon: Droplets,
    iconBg: "#E9F1FE",
    iconColor: "#3B82F6",
  },
];

const REVIEWS = [
  {
    id: "rev1",
    name: "Ankit Sharma",
    date: "8 Aug 2024",
    rating: 5,
    quote: "Very professional and fixed the leakage quickly. Great service!",
    avatarInitial: "A",
  },
  {
    id: "rev2",
    name: "Priya Mehta",
    date: "7 Aug 2024",
    rating: 5,
    quote: "On time, polite and did a perfect job. Highly recommended.",
    avatarInitial: "P",
  },
];

// ---- Small building blocks ----------------------------------------------

function StatCard({ stat }) {
  const Icon = stat.icon;
  return (
    <div className={styles.statCard}>
      <span className={styles.statIconWrap} style={{ background: stat.iconBg }}>
        <Icon size={20} color={stat.iconColor} />
      </span>
      <div className={styles.statLabel}>{stat.label}</div>
      <div className={styles.statValue}>{stat.value}</div>
      <div className={`${styles.statNote} ${styles[`note_${stat.noteColor}`]}`}>
        {stat.note}
      </div>
    </div>
  );
}

function RequestCard({ request }) {
  const Icon = request.icon;
  return (
    <div className={styles.requestCard}>
      <div className={styles.requestTop}>
        <span className={styles.requestIconWrap} style={{ background: request.iconBg }}>
          <Icon size={22} color={request.iconColor} />
        </span>

        <div className={styles.requestInfo}>
          <div className={styles.requestCategory}>{request.category}</div>
          <div className={styles.requestTitle}>{request.title}</div>
          <div className={styles.requestMetaRow}>
            <User size={14} />
            {request.customer}
          </div>
          <div className={styles.requestMetaRow}>
            <MapPin size={14} />
            {request.distance}
            <span className={styles.metaDot}>•</span>
            <Calendar size={14} />
            {request.time}
          </div>
        </div>

        <div className={styles.priceBox}>
          <div className={styles.priceValue}>
            ₹{request.priceLow} - ₹{request.priceHigh}
          </div>
          <div className={styles.priceLabel}>Estimated Price</div>
        </div>
      </div>

      <p className={styles.requestDescription}>{request.description}</p>

      <div className={styles.requestBottom}>
        <div className={styles.photoStrip}>
          {Array.from({ length: request.photos }).map((_, i) => (
            <div key={i} className={styles.photoThumb} />
          ))}
        </div>

        <div className={styles.requestActions}>
          <button type="button" className={styles.viewDetailsBtn}>
            View Details
          </button>
          <button type="button" className={styles.acceptBtn}>
            <CheckCircle2 size={16} />
            Accept Request
          </button>
        </div>
      </div>
    </div>
  );
}

function ScheduleItem({ item }) {
  const Icon = item.icon;
  return (
    <div className={styles.scheduleItem}>
      <span className={styles.scheduleIconWrap} style={{ background: item.iconBg }}>
        <Icon size={18} color={item.iconColor} />
      </span>
      <div className={styles.scheduleInfo}>
        <div className={styles.scheduleTitle}>{item.title}</div>
        <div className={styles.scheduleCustomer}>{item.customer}</div>
      </div>
      <div className={styles.scheduleMeta}>
        <div className={styles.scheduleTime}>{item.time}</div>
        <div className={styles.scheduleDistance}>
          <MapPin size={12} />
          {item.distance}
        </div>
      </div>
    </div>
  );
}

function ReviewItem({ review }) {
  return (
    <div className={styles.reviewItem}>
      <div className={styles.reviewAvatar}>{review.avatarInitial}</div>
      <div className={styles.reviewBody}>
        <div className={styles.reviewHead}>
          <div className={styles.stars}>
            {Array.from({ length: review.rating }).map((_, i) => (
              <Star key={i} size={13} fill="#F5A524" color="#F5A524" />
            ))}
          </div>
          <span className={styles.reviewDate}>{review.date}</span>
        </div>
        <p className={styles.reviewQuote}>&ldquo;{review.quote}&rdquo;</p>
        <div className={styles.reviewer}>— {review.name}</div>
      </div>
    </div>
  );
}

// ---- Main component ------------------------------------------------------

export default function ProviderDashboard() {
  const [online, setOnline] = useState(true);

  return (
    <>
    <Navbar/>
    <div className={styles.page}>

      <div className={styles.content}>
        {/* Greeting row */}
        <div className={styles.greetingRow}>
          <div>
            <h1 className={styles.greeting}>Good Morning, Rahul 👋</h1>
            <p className={styles.greetingSub}>
              Here&apos;s what&apos;s happening with your services today.
            </p>
          </div>

          <button
            type="button"
            className={styles.onlineToggle}
            onClick={() => setOnline((v) => !v)}
          >
            <span
              className={styles.onlineDot}
              style={{ background: online ? "#22C55E" : "#A1A1AA" }}
            />
            {online ? "Online" : "Offline"}
            <ChevronDown size={16} />
          </button>
        </div>

        {/* Stat cards */}
        <div className={styles.statGrid}>
          {STATS.map((s) => (
            <StatCard key={s.id} stat={s} />
          ))}
        </div>

        {/* Main grid */}
        <div className={styles.mainGrid}>
          {/* Left: requests */}
          <div className={styles.leftCol}>
            <div className={styles.panel}>
              <div className={styles.panelHead}>
                <span className={styles.panelTitle}>New Service Requests</span>
                <button type="button" className={styles.viewAllBtn}>
                  View All <ChevronRight size={15} />
                </button>
              </div>

              <div className={styles.requestList}>
                {REQUESTS.map((r) => (
                  <RequestCard key={r.id} request={r} />
                ))}
              </div>
            </div>
          </div>

          {/* Right: sidebar */}
          <div className={styles.rightCol}>
            <div className={styles.panel}>
              <div className={styles.panelHead}>
                <span className={styles.panelTitle}>Today&apos;s Schedule</span>
                <button type="button" className={styles.viewAllLink}>
                  View All
                </button>
              </div>
              <div className={styles.scheduleList}>
                {SCHEDULE.map((s) => (
                  <ScheduleItem key={s.id} item={s} />
                ))}
              </div>
            </div>

            <div className={styles.panel}>
              <div className={styles.panelHead}>
                <span className={styles.panelTitle}>Recent Reviews</span>
                <button type="button" className={styles.viewAllLink}>
                  View All
                </button>
              </div>
              <div className={styles.reviewList}>
                {REVIEWS.map((r) => (
                  <ReviewItem key={r.id} review={r} />
                ))}
              </div>
            </div>

            <div className={styles.tipBanner}>
              <span className={styles.tipIconWrap}>
                <Shield size={20} color="#FFFFFF" />
              </span>
              <div>
                <div className={styles.tipTitle}>Keep Your Rating High!</div>
                <p className={styles.tipText}>
                  Good reviews bring more customers and more earnings.
                </p>
                <button type="button" className={styles.tipLink}>
                  View Tips <ChevronRight size={14} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}
