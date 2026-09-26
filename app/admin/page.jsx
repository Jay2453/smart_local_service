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

    return <AdminDashboardView admin={authResult.admin} />;
}
