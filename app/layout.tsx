import type { Metadata } from "next";
import "./global.css";
import Footer from '@/components/Footer/Footer.jsx';
import { Manrope } from "next/font/google";
import Navbar from "@/components/Navbar/Navbar";
//We could have used usestate here for login overlay problem, but for that u have to make it a client component but layout is private and hence cant be made client components.

const manrope = Manrope({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Smart Local Services",
  description: "Smart local services designed to help",
};

export default function RootLayout({children}: Readonly<{children: React.ReactNode;}>) {

  return (
    
    <html lang="en">

      <body className={manrope.className}>
        <Navbar/>
        {children}
        <Footer />

      </body>

    </html>
  );
}