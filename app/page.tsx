import type { Metadata } from "next";
import ServersPage from "./servers-page.tsx";

export const metadata: Metadata = {
  title: "MCP Subregistry - Discover MCP Servers",
  description: "Find and review Model Context Protocol servers for your applications. Browse featured servers, read reviews, and discover new tools.",
  keywords: ["MCP", "Model Context Protocol", "servers", "registry", "AI tools"],
  openGraph: {
    title: "MCP Subregistry - Discover MCP Servers",
    description: "Find and review Model Context Protocol servers for your applications.",
    type: "website",
  },
};

export default function Home() {
  return <ServersPage />;
}
