import type { Metadata } from "next";
import { Figtree } from "next/font/google";
import "./globals.css";
import Header from "./components/ui/Header";
import Footer from "./components/ui/Footer";
import { AuthProvider } from "@/lib/contexts/AuthContext";

const figtree = Figtree({
  variable: "--font-figtree",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Perhimpunan Indonesia NUS | PINUS",
  description:
    "Perhimpunan Indonesia at NUS (PINUS) is a student organization dedicated to fostering a strong sense of community among Indonesian students at the National University of Singapore (NUS).",
  metadataBase: new URL("https://pinusonline.org/"),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${figtree.className} antialiased`}>
        <AuthProvider>
          <Header />
          {children}
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}
