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

  const server = await prisma.mcpServer.findUnique({
    where: { name: id },
    include: {
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
      name: server.name,
      description: server.description || "",
      title: server.category || undefined,
      version: "1.0.0",
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

  const server = await prisma.mcpServer.findUnique({
    where: { name: id },
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