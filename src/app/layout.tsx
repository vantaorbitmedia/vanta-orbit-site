import type { Metadata } from "next";
import { Orbitron, Space_Grotesk } from "next/font/google";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

const orbitron = Orbitron({
  variable: "--font-orbitron",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://vantaorbitmedia.local"),
  title: {
    default: "Vanta Orbit Media",
    template: "%s | Vanta Orbit Media",
  },
  description:
    "Cinematic space, science, and unknown-universe stories with videos and deeper written breakdowns.",
  openGraph: {
    title: "Vanta Orbit Media",
    description: "Exploring the universe. One fact at a time.",
    images: ["/vanta-banner.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${spaceGrotesk.variable} ${orbitron.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-black text-white">
        <Navbar />
        {children}
        <Footer />
      </body>
    </html>
  );
}
