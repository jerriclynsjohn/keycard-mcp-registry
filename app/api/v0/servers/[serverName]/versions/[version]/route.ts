import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/server/db";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ serverName: string; version: string }> }
) {
  const params = await context.params;
  const serverName = decodeURIComponent(params.serverName);
  const version = decodeURIComponent(params.version);

  // Handle "latest" version
  let versionToFind = version;
  if (version === "latest") {
    // Get the latest version for this server
    const latestServer = await prisma.mcpServer.findFirst({
      where: { name: serverName },
      orderBy: { updatedAt: "desc" },
    });

    if (!latestServer) {
      return NextResponse.json({ error: "Server not found" }, { status: 404 });
    }

    versionToFind = latestServer.version;
  }

  const server = await prisma.mcpServer.findUnique({
    where: {
      name_version: {
        name: serverName,
        version: versionToFind,
      },
    },
  });

  if (!server) {
    return NextResponse.json({ error: "Server or version not found" }, { status: 404 });
  }

  // Check if this is the latest version
  const latestServer = await prisma.mcpServer.findFirst({
    where: { name: serverName },
    orderBy: { updatedAt: "desc" },
  });

  const isLatest = latestServer?.id === server.id;

  const transformedServer = {
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
        isLatest,
      },
    },
  };

  return NextResponse.json(transformedServer);
}

export async function DELETE() {
  // For now, return not implemented as this is optional
  return NextResponse.json(
    { error: "Deletion is not supported by this registry" },
    { status: 501 }
  );
}