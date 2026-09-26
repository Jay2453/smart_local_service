import { getAdminSession } from "@/lib/adminAuth";
import AdminLayoutClient from "./AdminLayoutClient";

export const metadata = {
    title: "SmartServe Admin Control Center",
    description: "Centralized Management & Operations Dashboard",
};

export default async function AdminLayout({ children }) {
    const authResult = await getAdminSession();
    const admin = authResult?.admin || null;

    return (
        <AdminLayoutClient admin={admin}>
            {children}
        </AdminLayoutClient>
    );
}
