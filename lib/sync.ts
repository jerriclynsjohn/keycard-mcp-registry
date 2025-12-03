import { prisma } from "./server/db";

interface OfficialServer {
  server: {
    name: string;
    description: string;
    title?: string;
    repository?: {
      url: string;
      source: string;
      id?: string;
      subfolder?: string;
    };
    version: string;
    websiteUrl?: string;
    icons?: Array<{
      src: string;
      mimeType?: string;
      sizes?: string[];
      theme?: string;
    }>;
    packages?: Array<any>;
    remotes?: Array<any>;
    _meta?: any;
  };
  _meta: {
    "io.modelcontextprotocol.registry/official": {
      status: string;
      publishedAt: string;
      updatedAt: string;
      isLatest: boolean;
    };
  };
}

export async function syncFromOfficialRegistry() {
  let cursor: string | null = null;
  let updatedSince: string | null = null;

  // Get the latest updatedAt from our database
  const latestServer = await prisma.mcpServer.findFirst({
    orderBy: { updatedAt: "desc" },
  });

  if (latestServer) {
    updatedSince = latestServer.updatedAt.toISOString();
  }

  do {
    const params = new URLSearchParams();
    if (cursor) params.set("cursor", cursor);
    params.set("limit", "100");
    if (updatedSince) params.set("updated_since", updatedSince);

    const url = `https://registry.modelcontextprotocol.io/v0.1/servers?${params}`;
    const response = await fetch(url);
    const data: { servers: OfficialServer[]; metadata: { nextCursor: string | null } } = await response.json();

    for (const item of data.servers) {
      const server = item.server;
      const meta = item._meta["io.modelcontextprotocol.registry/official"];

      // Only sync if it has remotes (remote servers)
      if (!server.remotes || server.remotes.length === 0) continue;

      // Map to our schema
      const mapped = {
        name: server.name,
        description: server.description,
        category: server.title,
        maintainerName: server._meta?.["io.modelcontextprotocol.registry/publisher-provided"]?.maintainerName,
        maintainerUrl: server._meta?.["io.modelcontextprotocol.registry/publisher-provided"]?.maintainerUrl,
        mcpUrl: server.remotes?.[0]?.url || "",
        documentationUrl: server.websiteUrl,
        iconUrl: server.icons?.[0]?.src,
        authenticationType: server._meta?.["io.modelcontextprotocol.registry/publisher-provided"]?.authenticationType,
        dynamicClientRegistration: server._meta?.["io.modelcontextprotocol.registry/publisher-provided"]?.dynamicClientRegistration,
        isOfficial: true,
        status: meta.status === "active" ? "approved" : "pending",
        aiSummary: server._meta?.["io.modelcontextprotocol.registry/publisher-provided"]?.aiSummary,
        updatedAt: new Date(meta.updatedAt),
      };

      // Upsert
      await prisma.mcpServer.upsert({
        where: { name: server.name },
        update: mapped,
        create: mapped,
      });
    }

    cursor = data.metadata.nextCursor;
  } while (cursor);
}