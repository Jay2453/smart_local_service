import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifySession } from "@/lib/auth";
import ProviderDashboardUI from "./ProviderDashboardUI";

export default async function ProviderDashboard() {

    const cookieStore = await cookies();
    const token = cookieStore.get("smartserve_session")?.value;

    if (!token) {
        redirect("/?login=required");
    }

    const session = await verifySession(token);

    if (!session || session.role !== "serviceprovider") {
        redirect("/?login=required");
    }
 
    return <ProviderDashboardUI />;
}