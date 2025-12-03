import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/server/db";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ serverName: string }> }
) {
  const params = await context.params;
  const serverName = decodeURIComponent(params.serverName);

  const servers = await prisma.mcpServer.findMany({
    where: { name: serverName },
    orderBy: { updatedAt: "desc" }, // Newest first as per spec
  });

  if (servers.length === 0) {
    return NextResponse.json({ error: "Server not found" }, { status: 404 });
  }

  const transformedServers = servers.map((server) => ({
    server: {
      name: server.name,
      description: server.description || "",
      title: server.category || undefined,
      version: server.version,
      websiteUrl: server.documentationUrl || server.maintainerUrl || undefined,
      icons: server.iconUrl ? [{ src: server.iconUrl }] : undefined,
      remotes: server.mcpUrl ? [{ type: "streamable-http", url: server.mcpUrl }] : undefined,
      _meta: {
        "io.modelcontextprotocol.registry/publisher-provided": {
          maintainerName: server.maintainerName,
          maintainerUrl: server.maintainerUrl,
          authenticationType: server.authenticationType,
          dynamicClientRegistration: server.dynamicClientRegistration,
          category: server.category,
          aiSummary: server.aiSummary,
        },
      },
    },
    _meta: {
      "io.modelcontextprotocol.registry/official": {
        status: server.status === "approved" ? "active" : "deprecated",
        publishedAt: server.createdAt.toISOString(),
        updatedAt: server.updatedAt.toISOString(),
        isLatest: servers[0].id === server.id, // First one is latest
      },
    },
  }));

  return NextResponse.json({
    servers: transformedServers,
  });
}