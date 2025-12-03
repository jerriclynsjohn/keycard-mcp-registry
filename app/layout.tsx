import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Note: SupplyMono font not available, using default mono font

const supplySans = localFont({
  src: [
    {
      path: "./fonts/Supply_UltraLight.woff2",
      weight: "100",
      style: "normal",
    },
    {
      path: "./fonts/Supply_Light.woff2",
      weight: "200",
      style: "normal",
    },
    {
      path: "./fonts/Supply_Regular.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "./fonts/Supply_Medium.woff2",
      weight: "500",
      style: "normal",
    },
    {
      path: "./fonts/Supply_Bold.woff2",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-supply-sans",
});

export const metadata: Metadata = {
  title: "Keycard MCP Registry",
  description: "Discover and review Model Context Protocol servers with Keycard's unified identity infrastructure",
  keywords: ["MCP", "Model Context Protocol", "servers", "registry", "AI agents", "identity", "security"],
  authors: [{ name: "Keycard Labs" }],
  icons: {
    icon: '/favicon.png',
    shortcut: '/favicon.png',
    apple: '/favicon.png',
  },
  openGraph: {
    title: "Keycard MCP Registry",
    description: "Discover and review Model Context Protocol servers with Keycard's unified identity infrastructure",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Keycard MCP Registry",
    description: "Discover and review Model Context Protocol servers with Keycard's unified identity infrastructure",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${supplySans.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
