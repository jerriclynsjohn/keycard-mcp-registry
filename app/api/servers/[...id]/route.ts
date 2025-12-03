import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/server/db";
import { auth } from "@/lib/server/auth";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string[] }> }
) {
  const params = await context.params;
  const encodedId = params.id.join("/");
  const id = decodeURIComponent(encodedId);

  const server = await prisma.mcpServer.findFirst({
    where: { name: id },
    orderBy: { updatedAt: "desc" }, // Get latest version
    include: {
      repository: true,
      packages: {
        include: {
          environmentVariables: true,
        },
      },
      remotes: {
        include: {
          headers: true,
        },
      },
      reviews: {
        include: {
          user: {
            select: {
              name: true,
              image: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      },
    },
  });

  if (!server) {
    return NextResponse.json({ error: "Server not found" }, { status: 404 });
  }

  const transformedServer = {
    server: {
      $schema: server.schema,
      name: server.name,
      description: server.description || "",
      title: server.title,
      version: server.version,
      websiteUrl: server.websiteUrl,
      icons: server.icons || undefined,
      repository: server.repository ? {
        url: server.repository.url,
        source: server.repository.source,
        id: server.repository.repoId,
        subfolder: server.repository.subfolder,
      } : undefined,
      packages: server.packages?.map(pkg => ({
        registryType: pkg.registryType,
        registryBaseUrl: pkg.registryBaseUrl,
        identifier: pkg.identifier,
        version: pkg.version,
        fileSha256: pkg.fileSha256,
        runtimeHint: pkg.runtimeHint,
        transport: pkg.transport,
        runtimeArguments: pkg.runtimeArguments,
        packageArguments: pkg.packageArguments,
        environmentVariables: pkg.environmentVariables?.map(env => ({
          name: env.name,
          description: env.description,
          isRequired: env.isRequired,
          isSecret: env.isSecret,
          default: env.default,
          format: env.format,
          choices: env.choices,
        })),
      })),
      remotes: server.remotes?.map(remote => ({
        type: remote.type,
        url: remote.url,
        headers: remote.headers?.map(header => ({
          name: header.name,
          description: header.description,
          isRequired: header.isRequired,
          isSecret: header.isSecret,
          default: header.default,
          format: header.format,
          choices: header.choices,
        })),
      })),
      _meta: {
        "io.modelcontextprotocol.registry/publisher-provided": server.publisherMeta || {
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
      "io.modelcontextprotocol.registry/official": server.officialMeta || {
        status: server.mcpStatus || "active",
        publishedAt: server.createdAt.toISOString(),
        updatedAt: server.updatedAt.toISOString(),
        isLatest: true,
      },
    },
    reviews: server.reviews.map((review) => ({
      id: review.id,
      rating: review.rating,
      comment: review.comment,
      createdAt: review.createdAt.toISOString(),
      user: {
        name: review.user?.name,
        image: review.user?.image,
      },
    })),
  };

  return NextResponse.json(transformedServer);
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string[] }> }
) {
  const params = await context.params;
  const encodedId = params.id.join("/");
  const id = decodeURIComponent(encodedId);
  const session = await auth.api.getSession({ headers: request.headers });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { rating, comment } = await request.json();

  if (!rating || rating < 1 || rating > 5) {
    return NextResponse.json({ error: "Invalid rating" }, { status: 400 });
  }

  const server = await prisma.mcpServer.findFirst({
    where: { name: id },
    orderBy: { updatedAt: "desc" }, // Get latest version
  });

  if (!server) {
    return NextResponse.json({ error: "Server not found" }, { status: 404 });
  }

  // Create review
  await prisma.review.create({
    data: {
      rating,
      comment,
      serverId: server.id,
      userId: session.user.id,
    },
  });

  // Update average rating
  const reviews = await prisma.review.findMany({
    where: { serverId: server.id },
    select: { rating: true },
  });

  const averageRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

  await prisma.mcpServer.update({
    where: { id: server.id },
    data: { averageRating },
  });

  return NextResponse.json({ success: true });
}