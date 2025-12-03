// Import prisma dynamically to avoid initialization issues

interface EnvironmentVariableData {
  name: string;
  description?: string;
  isRequired?: boolean;
  isSecret?: boolean;
  default?: string;
  format?: string;
  choices?: string[];
}

interface PackageData {
  registryType: string;
  registryBaseUrl?: string;
  identifier: string;
  version?: string;
  fileSha256?: string;
  runtimeHint?: string;
  transport: any;
  runtimeArguments?: any[];
  packageArguments?: any[];
  environmentVariables?: EnvironmentVariableData[];
}

interface HeaderData {
  name: string;
  description?: string;
  isRequired?: boolean;
  isSecret?: boolean;
  default?: string;
  format?: string;
  choices?: string[];
}

interface RemoteData {
  type: string;
  url: string;
  headers?: HeaderData[];
}

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
    packages?: PackageData[];
    remotes?: RemoteData[];
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
  console.log("Starting sync process...");
  const { prisma } = await import("./server/db");

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
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data: { servers: OfficialServer[]; metadata: { nextCursor: string | null } } = await response.json();
    console.log(`Fetched ${data.servers.length} servers`);

    for (const item of data.servers) {
      await syncServer(item);
    }

    cursor = data.metadata.nextCursor;
  } while (cursor);
}

async function syncServer(item: OfficialServer) {
  const { prisma } = await import("./server/db");
  const server = item.server;
  const meta = item._meta["io.modelcontextprotocol.registry/official"];

  // Only sync if it has remotes or packages (servers with installation methods)
  if ((!server.remotes || server.remotes.length === 0) && (!server.packages || server.packages.length === 0)) {
    return;
  }

  // Map to our schema
  const mapped = {
    name: server.name,
    version: server.version || "1.0.0",
    description: server.description || "",
    category: server.title || "",
    mcpUrl: server.remotes?.[0]?.url || "",
    isOfficial: true,
    status: meta.status === "active" ? "approved" : "pending",
    updatedAt: new Date(meta.updatedAt),
  };

  // Find existing server or create new one
  let dbServer = await prisma.mcpServer.findFirst({
    where: {
      name: server.name,
      version: mapped.version,
    },
  });

  if (dbServer) {
    // Update existing server
    dbServer = await prisma.mcpServer.update({
      where: { id: dbServer.id },
      data: mapped,
    });
  } else {
    // Create new server
    dbServer = await prisma.mcpServer.create({
      data: mapped,
    });
  }

  // Store repository, packages, remotes, and related data - fail fast on errors
  if (server.repository) {
    await syncRepository(server, dbServer.id);
  }

  if (server.packages && server.packages.length > 0) {
    for (const pkg of server.packages) {
      if (pkg.version) {
        await syncPackage(pkg, dbServer.id);
      }
    }
  }

  if (server.remotes && server.remotes.length > 0) {
    for (const remote of server.remotes) {
      await syncRemote(remote, dbServer.id);
    }
  }
}

async function syncRepository(server: OfficialServer['server'], serverId: string) {
  const { prisma } = await import("./server/db");

  if (!server.repository || !server.repository.url) return;

  const repoData = {
    url: server.repository.url,
    source: server.repository.source || "",
    repoId: server.repository.id || null,
    subfolder: server.repository.subfolder || null,
    serverId,
  };

  await prisma.repository.upsert({
    where: { serverId },
    update: repoData,
    create: repoData,
  });
}

async function syncPackage(pkg: PackageData, serverId: string) {
  const { prisma } = await import("./server/db");

  const packageData = {
    registryType: pkg.registryType,
    registryBaseUrl: pkg.registryBaseUrl || null,
    identifier: pkg.identifier,
    version: pkg.version!,
    fileSha256: pkg.fileSha256 || null,
    runtimeHint: pkg.runtimeHint || null,
    transport: pkg.transport,
    runtimeArguments: pkg.runtimeArguments || undefined,
    packageArguments: pkg.packageArguments || undefined,
    serverId,
  };

  const dbPackage = await prisma.package.upsert({
    where: {
      serverId_registryType_identifier_version: {
        serverId,
        registryType: pkg.registryType,
        identifier: pkg.identifier,
        version: pkg.version,
      },
    },
    update: packageData,
    create: packageData,
  });

  // Sync environment variables if they exist
  if (pkg.environmentVariables && Array.isArray(pkg.environmentVariables)) {
    for (const envVar of pkg.environmentVariables) {
      await syncEnvironmentVariable(envVar, dbPackage.id);
    }
  }
}

async function syncEnvironmentVariable(envVar: EnvironmentVariableData, packageId: string) {
  const { prisma } = await import("./server/db");

  const envData = {
    name: envVar.name,
    description: envVar.description || null,
    isRequired: envVar.isRequired || false,
    isSecret: envVar.isSecret || false,
    default: envVar.default || null,
    format: envVar.format || null,
    choices: envVar.choices || undefined,
    packageId,
  };

  await prisma.environmentVariable.upsert({
    where: {
      packageId_name: {
        packageId,
        name: envVar.name,
      },
    },
    update: envData,
    create: envData,
  });
}

async function syncRemote(remote: RemoteData, serverId: string) {
  const { prisma } = await import("./server/db");

  const remoteData = {
    type: remote.type,
    url: remote.url,
    serverId,
  };

  const dbRemote = await prisma.remote.upsert({
    where: {
      serverId_type_url: {
        serverId,
        type: remote.type,
        url: remote.url,
      },
    },
    update: remoteData,
    create: remoteData,
  });

  // Sync headers if they exist
  if (remote.headers && Array.isArray(remote.headers)) {
    for (const header of remote.headers) {
      await syncHeader(header, dbRemote.id);
    }
  }
}

async function syncHeader(header: HeaderData, remoteId: string) {
  const { prisma } = await import("./server/db");

  const headerData = {
    name: header.name,
    description: header.description || null,
    isRequired: header.isRequired || false,
    isSecret: header.isSecret || false,
    default: header.default || null,
    format: header.format || null,
    choices: header.choices || undefined,
    remoteId,
  };

  await prisma.header.upsert({
    where: {
      remoteId_name: {
        remoteId,
        name: header.name,
      },
    },
    update: headerData,
    create: headerData,
  });
}