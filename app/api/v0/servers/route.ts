import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/server/db";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const cursor = searchParams.get("cursor");
  const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);
  const search = searchParams.get("search");
  const updatedSince = searchParams.get("updated_since");
  const version = searchParams.get("version");

  const where: Record<string, unknown> = {};

  // Add search filter
  if (search) {
    where.name = {
      contains: search,
      mode: "insensitive",
    };
  }

  // Add updated_since filter
  if (updatedSince) {
    where.updatedAt = {
      gte: new Date(updatedSince),
    };
  }

  // Add version filter
  if (version) {
    if (version === "latest") {
      // For latest version, we need to get the most recent version for each server name
      // This is complex in Prisma, so we'll handle it in the query
    } else {
      where.version = version;
    }
  }

  let servers;

  if (version === "latest") {
    // Get latest version for each server name
    const latestVersions = await prisma.$queryRaw`
      SELECT DISTINCT ON (name) * FROM "McpServer"
      WHERE ${search ? prisma.$queryRaw`name ILIKE ${'%' + search + '%'}` : prisma.$queryRaw`TRUE`}
      ${updatedSince ? prisma.$queryRaw`AND "updatedAt" >= ${new Date(updatedSince)}` : prisma.$queryRaw``}
      ORDER BY name, "updatedAt" DESC
    `;

    servers = Array.isArray(latestVersions) ? latestVersions : [];
  } else {
    servers = await prisma.mcpServer.findMany({
      where,
      take: limit + 1, // +1 to check if there are more
      ...(cursor && {
        cursor: { id: cursor },
        skip: 1, // skip the cursor
      }),
      orderBy: { updatedAt: "desc" },
    });
  }

  const hasNextPage = servers.length > limit;
  const serversToReturn = hasNextPage ? servers.slice(0, limit) : servers;
  const nextCursor = hasNextPage ? serversToReturn[serversToReturn.length - 1].id : null;

  const transformedServers = serversToReturn.map((server) => ({
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
        isLatest: true, // For now, assume all are latest
      },
    },
  }));

  return NextResponse.json({
    servers: transformedServers,
    metadata: {
      nextCursor,
      count: serversToReturn.length,
    },
  });
}