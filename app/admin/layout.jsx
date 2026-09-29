import { getAdminSession } from "@/lib/adminAuth";
import AdminLayoutClient from "./AdminLayoutClient";

export const metadata = {
    title: "SmartServe Admin Control Center",
    description: "Centralized Management & Operations Dashboard",
};

export default async function AdminLayout({ children }) {
    const authResult = await getAdminSession();
    const admin = authResult?.admin || null;

    const safeAdmin = admin
        ? {
              id: admin.id?.toString() || admin._id?.toString() || "",
              name: admin.name ? String(admin.name) : "",
              email: admin.email ? String(admin.email) : "",
              phone: admin.phone ? String(admin.phone) : "",
              role: admin.role ? String(admin.role) : "admin",
              isActive: Boolean(admin.isActive),
              status: admin.status ? String(admin.status) : "",
          }
        : null;

    return (
        <AdminLayoutClient admin={safeAdmin}>
            {children}
        </AdminLayoutClient>
    );
}