import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifySession } from "@/lib/auth";
import DashboardUI from "./DashboardUI";

export default async function Dashboard() {

    const cookieStore = await cookies();
    const token = cookieStore.get("smartserve_session")?.value;

    if (!token) {
        redirect("/?login=required");
    }

    const session = await verifySession(token);

    if (!session || session.role !== "customer") {
        redirect("/?login=required");
    }
 
    return <DashboardUI />;
}