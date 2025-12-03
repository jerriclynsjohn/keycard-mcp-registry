import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/server/db";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const cursor = searchParams.get("cursor");
  const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);



  // Get latest version for each server name
  const allServers = await prisma.mcpServer.findMany({
    orderBy: [
      { name: 'asc' },
      { updatedAt: 'desc' }
    ]
  });

  // Group by name and get latest for each
  const latestServersMap = new Map();
  for (const server of allServers) {
    if (!latestServersMap.has(server.name)) {
      latestServersMap.set(server.name, server);
    }
  }

  const latestServers = Array.from(latestServersMap.values());
  const totalCount = latestServers.length;

  // Simple pagination using array slicing
  const startIndex = cursor ? parseInt(cursor, 10) || 0 : 0;
  const endIndex = startIndex + limit;
  const serversToReturn = latestServers.slice(startIndex, endIndex);
  const nextCursor = endIndex < latestServers.length ? endIndex.toString() : null;

  const transformedServers = serversToReturn.map((server) => ({
    server: {
      name: server.name,
      description: server.description || "",
      title: server.category || undefined,
      version: server.version, // actual version from database
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
        isLatest: true,
      },
    },
  }));

  return NextResponse.json({
    servers: transformedServers,
    metadata: {
      nextCursor,
      count: serversToReturn.length,
      totalCount,
    },
  });
}