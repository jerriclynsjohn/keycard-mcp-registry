import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/server/db";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const cursor = searchParams.get("cursor");
  const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);

  const where: any = {
    // Show all servers
  };

  const totalCount = await prisma.mcpServer.count({ where });

  const servers = await prisma.mcpServer.findMany({
    where,
    take: limit + 1, // +1 to check if there are more
    ...(cursor && {
      cursor: { id: cursor },
      skip: 1, // skip the cursor
    }),
    orderBy: { id: "asc" },
  });

  const hasNextPage = servers.length > limit;
  const serversToReturn = hasNextPage ? servers.slice(0, limit) : servers;
  const nextCursor = hasNextPage ? serversToReturn[serversToReturn.length - 1].id : null;

  const transformedServers = serversToReturn.map((server) => ({
    server: {
      name: server.name,
      description: server.description || "",
      title: server.category || undefined,
      version: "1.0.0", // default version
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