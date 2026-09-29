import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/adminAuth";
import AdminDashboardView from "./AdminDashboardView";

export const metadata = {
    title: "Admin Console | SmartServe",
    description: "SmartServe Administrative Control Panel",
};

export default async function AdminRootPage() {
    const authResult = await getAdminSession();

    if (!authResult || !authResult.admin) {
        redirect("/admin/login");
    }

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

return <AdminDashboardView admin={safeAdmin} />;
}
