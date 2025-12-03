import type { Metadata } from "next";
import ServersPage from "./servers-page";

export const metadata: Metadata = {
  title: "Keycard MCP Registry - Discover MCP Servers",
  description: "Find and review Model Context Protocol servers for your applications. Browse featured servers, read reviews, and discover new tools with Keycard's unified identity infrastructure.",
  keywords: ["MCP", "Model Context Protocol", "servers", "registry", "AI agents", "identity", "security", "Keycard"],
  openGraph: {
    title: "Keycard MCP Registry - Discover MCP Servers",
    description: "Find and review Model Context Protocol servers for your applications with Keycard's unified identity infrastructure.",
    type: "website",
  },
};

export default function Home() {
  return <ServersPage />;
}
