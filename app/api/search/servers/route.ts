import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/server/db";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q') || '';
  const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);
  const cursor = searchParams.get('cursor');

  if (!q.trim()) {
    return NextResponse.json({
      servers: [],
      hasMore: false,
      nextCursor: null
    });
  }

  try {
    // Use Prisma query for now to ensure it works, then optimize with raw SQL later
    const allServers = await prisma.mcpServer.findMany({
      where: {
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { description: { contains: q, mode: 'insensitive' } },
          { title: { contains: q, mode: 'insensitive' } },
          { maintainerName: { contains: q, mode: 'insensitive' } },
          { aiSummary: { contains: q, mode: 'insensitive' } }
        ]
      },
      select: {
        id: true,
        name: true,
        description: true,
        title: true,
        maintainerName: true,
        aiSummary: true,
        iconUrl: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: [
        { name: 'asc' },
        { updatedAt: 'desc' }
      ],
      take: limit * 2 // Get more to account for duplicates
    });

    // Filter to get only the latest version of each server name
    const latestServersMap = new Map();
    for (const server of allServers) {
      if (!latestServersMap.has(server.name)) {
        latestServersMap.set(server.name, server);
      }
    }

    const uniqueResults = Array.from(latestServersMap.values()).slice(0, limit);
    const hasMore = uniqueResults.length === limit;
    const nextCursor = hasMore ? (cursor ? parseInt(cursor) + limit : limit) : null;

    return NextResponse.json({
      servers: uniqueResults,
      hasMore,
      nextCursor
    });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json(
      { error: 'Search failed' },
      { status: 500 }
    );
  }
}