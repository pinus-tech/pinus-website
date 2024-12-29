import type { Metadata } from "next";
import { Figtree } from "next/font/google";
import "./globals.css";
import Header from "./components/ui/Header";
import Footer from "./components/ui/Footer";

const figtree = Figtree({
  variable: "--font-figtree",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PINUS Website",
  description: "Developed by pinustech",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${figtree.className} antialiased`}
      >
        <Header />
        {children}
        <Footer />
      </body>
    </html>
  );
}
