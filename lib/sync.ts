import { prisma } from "./server/db";

interface OfficialServer {
  server: {
    $schema?: string;
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
    packages?: Array<{
      registryType: string;
      registryBaseUrl: string;
      identifier: string;
      version: string;
      fileSha256?: string;
      runtimeHint?: string;
      transport: any;
      runtimeArguments?: any[];
      packageArguments?: any[];
      environmentVariables?: Array<{
        name: string;
        description?: string;
        isRequired?: boolean;
        isSecret?: boolean;
        default?: string;
        format?: string;
        choices?: string[];
      }>;
    }>;
    remotes?: Array<{
      type: string;
      url: string;
      headers?: Array<{
        name: string;
        description?: string;
        isRequired?: boolean;
        isSecret?: boolean;
        default?: string;
        format?: string;
        choices?: string[];
      }>;
    }>;
    _meta?: any;
  };
  _meta: {
    "io.modelcontextprotocol.registry/official": {
      status: string;
      publishedAt: string;
      updatedAt: string;
      isLatest: boolean;
    };
    "io.modelcontextprotocol.registry/publisher-provided"?: any;
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
      await syncServer(item);
    }

    cursor = data.metadata.nextCursor;
  } while (cursor);
}

async function syncServer(item: OfficialServer) {
  const server = item.server;
  const meta = item._meta["io.modelcontextprotocol.registry/official"];

  // Only sync if it has remotes or packages (servers with installation methods)
  if ((!server.remotes || server.remotes.length === 0) && (!server.packages || server.packages.length === 0)) return;

  // Map to our schema
  const mapped = {
    name: server.name,
    version: server.version || "1.0.0",
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
    mcpStatus: meta.status,
    websiteUrl: server.websiteUrl,
    schema: server.$schema,
    title: server.title,
    icons: server.icons,
    aiSummary: server._meta?.["io.modelcontextprotocol.registry/publisher-provided"]?.aiSummary,
    publisherMeta: server._meta?.["io.modelcontextprotocol.registry/publisher-provided"] || undefined,
    officialMeta: meta,
    updatedAt: new Date(meta.updatedAt),
  };

  // Create server (handle duplicates at application level for now)
  const createdServer = await prisma.mcpServer.create({
    data: mapped,
  }).catch(async (error) => {
    if (error.code === 'P2002') {
      // Unique constraint violation - find existing and update
      const existing = await prisma.mcpServer.findFirst({
        where: { name: server.name },
      });
      if (existing) {
        return await prisma.mcpServer.update({
          where: { id: existing.id },
          data: mapped,
        });
      }
    }
    throw error;
  });

  // TODO: Store repository, packages, remotes, and related data
  // Temporarily disabled due to Prisma client generation issues
  console.log(`Server ${server.name} synced successfully (basic data only)`);
}