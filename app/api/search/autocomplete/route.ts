import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/server/db";

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q') || '';

  if (!q.trim()) {
    return NextResponse.json({ suggestions: [] });
  }

  try {
    // Get all matching servers, then group by name to get latest version
    const allMatchingServers = await prisma.mcpServer.findMany({
      where: {
        name: {
          contains: q,
          mode: 'insensitive'
        }
      },
      select: {
        id: true,
        name: true,
        description: true,
        iconUrl: true,
        updatedAt: true
      },
      orderBy: [
        { name: 'asc' },
        { updatedAt: 'desc' }
      ]
    });

    // Group by name and get the latest version for each
    const latestServersMap = new Map();
    for (const server of allMatchingServers) {
      if (!latestServersMap.has(server.name)) {
        latestServersMap.set(server.name, server);
      }
    }

    const suggestions = Array.from(latestServersMap.values()).slice(0, 8);

    return NextResponse.json({ suggestions });
  } catch (error) {
    console.error('Autocomplete error:', error);
    return NextResponse.json(
      { error: 'Autocomplete failed' },
      { status: 500 }
    );
  }
}