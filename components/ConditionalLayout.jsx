"use client";

import { usePathname } from "next/navigation";
import Navbar from "./Navbar/Navbar";
import Footer from "./Footer/Footer";

export default function ConditionalLayout({ children }) {
    const pathname = usePathname();

    const isAdminRoute = pathname === "/admin" || pathname.startsWith("/admin/");

    if (isAdminRoute) {
        return children;
    }

    return (
        <>
            <Navbar />
            {children}
            <Footer />
        </>
    );
}