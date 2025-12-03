import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/server/db";
import { auth } from "@/lib/server/auth";

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