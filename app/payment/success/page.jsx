import { Suspense } from "react";
import PaymentResultClient from "./PaymentResultClient";

export const metadata = {
    title: "Payment Status | SmartServe",
    description: "View the status of your SmartServe service booking payment.",
};

export default function PaymentSuccessPage() {
    return (
        <Suspense fallback={
            <div style={{
                minHeight: "100vh",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: "system-ui, sans-serif",
                background: "#f8fafc",
            }}>
                <p style={{ color: "#64748b" }}>Loading payment status...</p>
            </div>
        }>
            <PaymentResultClient />
        </Suspense>
    );
}
