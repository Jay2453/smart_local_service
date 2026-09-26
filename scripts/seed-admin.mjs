/**
 * SmartServe — Admin Seed Script
 *
 * Creates the initial administrator account and seeds platform defaults.
 *
 * Usage:
 *   node scripts/seed-admin.js
 *   npm run seed:admin
 *
 * Required environment variables (set in .env.local):
 *   MONGODB_URI      — MongoDB connection string
 *   ADMIN_NAME       — Display name for the administrator
 *   ADMIN_EMAIL      — Email address for the administrator
 *   ADMIN_PASSWORD   — Strong password (NEVER hardcode this)
 *
 * Optional:
 *   ADMIN_PHONE      — Phone number (defaults to "0000000000")
 */

import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import fs from "fs";
import path from "path";

// ---------------------------------------------------------------------------
// Load .env.local / .env into process.env (standalone — no dotenv dependency)
// ---------------------------------------------------------------------------
function loadEnv() {
    const envPaths = [
        path.resolve(process.cwd(), ".env.local"),
        path.resolve(process.cwd(), ".env"),
    ];

    for (const envPath of envPaths) {
        if (fs.existsSync(envPath)) {
            const content = fs.readFileSync(envPath, "utf-8");
            const lines = content.split("\n");
            for (const line of lines) {
                const trimmed = line.trim();
                if (trimmed && !trimmed.startsWith("#")) {
                    const eqIdx = trimmed.indexOf("=");
                    if (eqIdx > 0) {
                        const key = trimmed.substring(0, eqIdx).trim();
                        const val = trimmed
                            .substring(eqIdx + 1)
                            .trim()
                            .replace(/^['"]|['"]$/g, "");
                        if (!process.env[key]) {
                            process.env[key] = val;
                        }
                    }
                }
            }
        }
    }
}

loadEnv();

// ---------------------------------------------------------------------------
// Validate required environment variables
// ---------------------------------------------------------------------------
const MONGODB_URI = process.env.MONGODB_URI;
const ADMIN_NAME = process.env.ADMIN_NAME;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL
    ? process.env.ADMIN_EMAIL.toLowerCase().trim()
    : undefined;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

const missing = [];
if (!MONGODB_URI) missing.push("MONGODB_URI");
if (!ADMIN_NAME) missing.push("ADMIN_NAME");
if (!ADMIN_EMAIL) missing.push("ADMIN_EMAIL");
if (!ADMIN_PASSWORD) missing.push("ADMIN_PASSWORD");

if (missing.length > 0) {
    console.error("==================================================================");
    console.error("ERROR: The following required environment variables are missing:");
    console.error(`  ${missing.join(", ")}`);
    console.error("");
    console.error("Set them in your .env.local file before running this script.");
    console.error("See .env.example for the full list of required variables.");
    console.error("==================================================================");
    process.exit(1);
}

// ---------------------------------------------------------------------------
// Inline schemas — keeps the script standalone (no project import needed)
// ---------------------------------------------------------------------------
const userSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true },
        phone: { type: String, required: true, trim: true },
        email: {
            type: String,
            required: true,
            trim: true,
            unique: true,
            lowercase: true,
        },
        password: { type: String, required: true },
        role: {
            type: String,
            enum: ["customer", "serviceprovider", "admin"],
            required: true,
        },
        isActive: { type: Boolean, default: true },
        status: {
            type: String,
            enum: ["active", "suspended", "deactivated"],
            default: "active",
        },
        deactivatedReason: { type: String, default: "" },
        deactivatedAt: { type: Date, default: null },
    },
    { timestamps: true }
);

userSchema.index({ email: 1, role: 1 });
userSchema.index({ role: 1, isActive: 1 });

const platformSettingSchema = new mongoose.Schema(
    {
        key: { type: String, required: true, unique: true, trim: true },
        value: { type: mongoose.Schema.Types.Mixed, required: true },
        category: { type: String, default: "general" },
        label: { type: String, default: "" },
        description: { type: String, default: "" },
        isPublic: { type: Boolean, default: false },
        updatedBy: { type: mongoose.Schema.Types.ObjectId, default: null },
    },
    { timestamps: true }
);

const serviceSchema = new mongoose.Schema(
    {
        serviceId: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            lowercase: true,
        },
        name: { type: String, required: true, trim: true },
        category: {
            type: String,
            required: true,
            trim: true,
            default: "Home Services",
        },
        description: { type: String, required: true, trim: true },
        icon: { type: String, default: "Wrench" },
        image: { type: String, default: "/images/plumber.png" },
        alt: { type: String, default: "" },
        basePrice: { type: Number, required: true, min: 0, default: 499 },
        tasks: [
            {
                name: String,
                problem: String,
                price: Number,
                description: String,
                isActive: { type: Boolean, default: true },
            },
        ],
        isActive: { type: Boolean, default: true },
        displayOrder: { type: Number, default: 0 },
    },
    { timestamps: true }
);

// ---------------------------------------------------------------------------
// Default platform settings (seeded idempotently)
// ---------------------------------------------------------------------------
const DEFAULT_SETTINGS = [
    {
        key: "platform_name",
        value: "SmartServe",
        category: "general",
        label: "Platform Name",
        description: "The public name of the local service marketplace.",
    },
    {
        key: "support_email",
        value: "support@smartserve.com",
        category: "general",
        label: "Support Email",
        description: "Public email for customer and provider support.",
    },
    {
        key: "support_phone",
        value: "+91 98765 43210",
        category: "general",
        label: "Support Phone",
        description: "Hotline number for escalations.",
    },
    {
        key: "default_commission_percent",
        value: 10,
        category: "finance",
        label: "Default Commission (%)",
        description:
            "Platform fee charged on completed service bookings.",
    },
    {
        key: "cancellation_window_hours",
        value: 2,
        category: "booking",
        label: "Free Cancellation Window (Hours)",
        description:
            "Window before service time where cancellation is free.",
    },
    {
        key: "cancellation_fee",
        value: 50,
        category: "finance",
        label: "Cancellation Fee (₹)",
        description: "Standard penalty fee for late cancellation.",
    },
    {
        key: "require_provider_verification",
        value: true,
        category: "provider",
        label: "Require Provider Verification",
        description:
            "Whether provider verification is mandatory for receiving booking dispatches.",
    },
    {
        key: "maintenance_mode",
        value: false,
        category: "security",
        label: "Maintenance Mode",
        description:
            "Temporarily pause customer bookings for system maintenance.",
    },
    {
        key: "broadcast_notifications_enabled",
        value: true,
        category: "notifications",
        label: "Broadcast Notifications",
        description:
            "Allow system-wide announcements to customers and providers.",
    },
];

// ---------------------------------------------------------------------------
// Initial services catalogue (seeded idempotently)
// ---------------------------------------------------------------------------
const INITIAL_SERVICES = [
    {
        serviceId: "plumbing",
        name: "Plumbing",
        category: "Home Repair",
        image: "/images/plumber.png",
        alt: "Plumbing services",
        icon: "Wrench",
        description:
            "Leak repairs, pipe installations, bathroom fittings & more.",
        basePrice: 499,
        displayOrder: 1,
        tasks: [
            {
                name: "Leak Repair & Detection",
                problem: "Leak Repair & Detection",
                price: 349,
                description:
                    "Fix leaking faucets, pipe joints, and hidden water leakages.",
            },
            {
                name: "Pipe Installation & Fitting",
                problem: "Pipe Installation & Fitting",
                price: 599,
                description:
                    "New PVC/CPVC pipe connections, bathroom and kitchen lines.",
            },
            {
                name: "Faucet & Shower Repair",
                problem: "Faucet & Shower Repair",
                price: 299,
                description:
                    "Shower head replacement, mixer tap repairs, valve fitting.",
            },
        ],
    },
    {
        serviceId: "electrical",
        name: "Electrical",
        category: "Home Repair",
        image: "/images/electrician.png",
        alt: "Electrical services",
        icon: "Zap",
        description:
            "Wiring, fan installation, switch repair & electrical safety.",
        basePrice: 399,
        displayOrder: 2,
        tasks: [
            {
                name: "Wiring & Rewiring",
                problem: "Wiring & Rewiring",
                price: 699,
                description:
                    "Complete room wiring, short-circuit diagnostics, MCB replacement.",
            },
            {
                name: "Light & Fan Installation",
                problem: "Light & Fan Installation",
                price: 249,
                description:
                    "Ceiling fan fitting, decorative lighting, chandelier mounting.",
            },
            {
                name: "Switch & Socket Repair",
                problem: "Switch & Socket Repair",
                price: 199,
                description:
                    "Modular switch repair, high-power socket setup for ACs/geysers.",
            },
        ],
    },
    {
        serviceId: "carpentry",
        name: "Carpentry",
        category: "Woodwork",
        image: "/images/carpenter.png",
        alt: "Carpentry services",
        icon: "Hammer",
        description:
            "Furniture repair, custom woodwork, doors & window locks.",
        basePrice: 449,
        displayOrder: 3,
        tasks: [
            {
                name: "Furniture Repair & Build",
                problem: "Furniture Repair & Build",
                price: 599,
                description:
                    "Bed frame reinforcement, dining table fixes, custom cabinets.",
            },
            {
                name: "Wood Polishing & Finish",
                problem: "Wood Polishing & Finish",
                price: 799,
                description:
                    "PU polish, melamine finish, wood stain restoration.",
            },
            {
                name: "Door & Window Fitting",
                problem: "Door & Window Fitting",
                price: 399,
                description:
                    "Door alignment, mortise lock installation, latch repairs.",
            },
        ],
    },
    {
        serviceId: "painting",
        name: "Painting",
        category: "Renovation",
        image: "/images/painter.png",
        alt: "Painting services",
        icon: "Paintbrush",
        description:
            "Interior & exterior painting with premium waterproof finishes.",
        basePrice: 899,
        displayOrder: 4,
        tasks: [
            {
                name: "Interior Home Painting",
                problem: "Interior Home Painting",
                price: 999,
                description:
                    "Emulsion paint, wall putty application, primer base coats.",
            },
            {
                name: "Exterior Wall Painting",
                problem: "Exterior Wall Painting",
                price: 1499,
                description:
                    "Weather-proof exterior coatings, fungal protection.",
            },
            {
                name: "Waterproofing & Textures",
                problem: "Waterproofing & Textures",
                price: 1299,
                description:
                    "Dampness treatment, terrace waterproofing, designer wall textures.",
            },
        ],
    },
    {
        serviceId: "appliance",
        name: "Appliance Repair",
        category: "Appliances",
        image: "/images/repairs.png",
        alt: "Appliance repair services",
        icon: "Refrigerator",
        description:
            "Fast diagnostics and repair service for all home appliances.",
        basePrice: 499,
        displayOrder: 5,
        tasks: [
            {
                name: "Washing Machine Repair",
                problem: "Washing Machine Repair",
                price: 499,
                description:
                    "Motor inspection, drum alignment, drainage valve replacement.",
            },
            {
                name: "Refrigerator Servicing",
                problem: "Refrigerator Servicing",
                price: 549,
                description:
                    "Gas charging, compressor check, thermostat replacement.",
            },
            {
                name: "Microwave & AC Repair",
                problem: "Microwave & AC Repair",
                price: 599,
                description:
                    "AC filter cleaning, coil replacement, microwave heating issues.",
            },
        ],
    },
    {
        serviceId: "pest",
        name: "Pest Control",
        category: "Cleaning & Pest",
        image: "/images/pesting.png",
        alt: "Pest control services",
        icon: "ShieldCheck",
        description:
            "Safe and odorless protection against all household pests.",
        basePrice: 699,
        displayOrder: 6,
        tasks: [
            {
                name: "Cockroach & Ant Control",
                problem: "Cockroach & Ant Control",
                price: 699,
                description:
                    "Herbal gel treatment, kitchen cabinet disinfection.",
            },
            {
                name: "Termite Prevention",
                problem: "Termite Prevention",
                price: 1199,
                description:
                    "Drill-fill-seal subterranean termite treatment for woodwork.",
            },
            {
                name: "Rodent Management",
                problem: "Rodent Management",
                price: 799,
                description:
                    "Traps, entry point seals, ultrasonic baiting solutions.",
            },
        ],
    },
];

// ---------------------------------------------------------------------------
// Main seed function
// ---------------------------------------------------------------------------
async function seedAdmin() {
    try {
        console.log("Connecting to MongoDB...");
        await mongoose.connect(MONGODB_URI);
        console.log("Connected to MongoDB successfully.");

        const User =
            mongoose.models.User || mongoose.model("User", userSchema);
        const PlatformSetting =
            mongoose.models.PlatformSetting ||
            mongoose.model("PlatformSetting", platformSettingSchema);
        const Service =
            mongoose.models.Service ||
            mongoose.model("Service", serviceSchema);

        // Ensure indexes
        await User.syncIndexes();

        // ------------------------------------------------------------------
        // 1. Admin account (idempotent — skip if already exists)
        // ------------------------------------------------------------------
        const existingAdmin = await User.findOne({ email: ADMIN_EMAIL });

        if (existingAdmin) {
            console.log(
                `\n[SKIP] Admin account already exists: ${ADMIN_EMAIL}`
            );
            console.log(
                `  Role: ${existingAdmin.role} | Active: ${existingAdmin.isActive} | Status: ${existingAdmin.status}`
            );
        } else {
            console.log("\nHashing administrator password...");
            const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 12);

            const newAdmin = await User.create({
                name: ADMIN_NAME,
                email: ADMIN_EMAIL,
                phone: process.env.ADMIN_PHONE || "0000000000",
                password: hashedPassword,
                role: "admin",
                isActive: true,
                status: "active",
            });

            console.log("[SUCCESS] Admin user created!");
            console.log(`  ID    : ${newAdmin._id}`);
            console.log(`  Name  : ${newAdmin.name}`);
            console.log(`  Email : ${newAdmin.email}`);
            console.log(`  Role  : ${newAdmin.role}`);
        }

        // ------------------------------------------------------------------
        // 2. Platform settings (idempotent — skip existing keys)
        // ------------------------------------------------------------------
        console.log("\nChecking platform settings...");
        for (const setting of DEFAULT_SETTINGS) {
            const exists = await PlatformSetting.findOne({ key: setting.key });
            if (!exists) {
                await PlatformSetting.create(setting);
                console.log(`  + Seeded: ${setting.key}`);
            }
        }
        console.log("Platform settings verified.");

        // ------------------------------------------------------------------
        // 3. Services catalogue (idempotent — skip existing services)
        // ------------------------------------------------------------------
        console.log("\nChecking services catalogue...");
        for (const svc of INITIAL_SERVICES) {
            const exists = await Service.findOne({ serviceId: svc.serviceId });
            if (!exists) {
                await Service.create(svc);
                console.log(`  + Seeded: ${svc.name} (${svc.serviceId})`);
            }
        }
        console.log("Services catalogue verified.");

        // ------------------------------------------------------------------
        console.log("\n==================================================");
        console.log("ADMIN SEED COMPLETED SUCCESSFULLY.");
        console.log("==================================================");
        process.exit(0);
    } catch (error) {
        console.error("Admin seed failed:", error.message || error);
        process.exit(1);
    }
}

seedAdmin();
