import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { KeycardLogo } from "@/components/keycard-logo";
import { UserProfile } from "@/components/auth/user-profile";
import { HeaderSearch } from "@/components/HeaderSearch";
import { Globe, Package, Cpu, ArrowRight } from "lucide-react";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { prisma } from "@/lib/server/db";

export const metadata: Metadata = {
  title: "Keycard MCP Registry - Discover MCP Servers",
  description: "Find and review Model Context Protocol servers for your applications. Browse featured servers, read reviews, and discover new tools with Keycard's unified identity infrastructure.",
  keywords: ["MCP", "Model Context Protocol", "servers", "registry", "AI agents", "identity", "security", "Keycard"],
  openGraph: {
    title: "Keycard MCP Registry - Discover MCP Servers",
    description: "Find and review Model Context Protocol servers for your applications with Keycard's unified identity infrastructure.",
    type: "website",
  },
};

interface Server {
  server: {
    name: string;
    description: string;
    title?: string;
    version: string;
    icons?: Array<{ src: string }>;
    remotes?: Array<{ type: string; url: string }>;
    packages?: Array<any>;
  };
  _meta: {
    "io.modelcontextprotocol.registry/official": {
      status: string;
      publishedAt: string;
    };
  };
}

async function getServers(page: number, limit: number = 36, search?: string) {
  let allServers;

  if (search?.trim()) {
    // Use raw SQL for full-text search when searching
    const searchQuery = `
      SELECT DISTINCT ON (s.name) s.*, p.transport as package_transport, r.type as remote_type, r.url as remote_url
      FROM "McpServer" s
      LEFT JOIN "Package" p ON s.id = p."serverId"
      LEFT JOIN "Remote" r ON s.id = r."serverId"
      WHERE to_tsvector('english',
        coalesce(s.name, '') || ' ' ||
        coalesce(s.description, '') || ' ' ||
        coalesce(s.title, '') || ' ' ||
        coalesce(s."maintainerName", '') || ' ' ||
        coalesce(s."aiSummary", '')
      ) @@ plainto_tsquery('english', $1)
      ORDER BY s.name, s."updatedAt" DESC
    `;

    allServers = await prisma.$queryRawUnsafe(searchQuery, [search.trim()]);
  } else {
    // Regular query when not searching
    allServers = await prisma.mcpServer.findMany({
      include: {
        packages: true,
        remotes: true,
      },
      orderBy: [
        { name: 'asc' },
        { updatedAt: 'desc' }
      ]
    });

    // Group by name and get latest for each when not searching
    const latestServersMap = new Map();
    for (const server of allServers) {
      if (!latestServersMap.has(server.name)) {
        latestServersMap.set(server.name, server);
      }
    }
    allServers = Array.from(latestServersMap.values());
  }

  const totalCount = Array.isArray(allServers) ? allServers.length : 0;
  const totalPages = Math.ceil(totalCount / limit);

  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const serversToReturn = Array.isArray(allServers) ? allServers.slice(startIndex, endIndex) : [];

  const transformedServers: Server[] = serversToReturn.map((server: any) => ({
    server: {
      name: server.name,
      description: server.description || "",
      title: server.category || undefined,
      version: server.version,
      websiteUrl: server.documentationUrl || server.maintainerUrl || undefined,
      icons: server.iconUrl ? [{ src: server.iconUrl }] : undefined,
      remotes: server.remotes?.length > 0 ? server.remotes.map((r: any) => ({ type: r.type, url: r.url })) : (server.mcpUrl ? [{ type: "streamable-http", url: server.mcpUrl }] : undefined),
      packages: server.packages?.length > 0 ? server.packages.map((p: any) => ({ transport: p.transport })) : undefined,
    },
    _meta: {
      "io.modelcontextprotocol.registry/official": {
        status: server.status === "approved" ? "active" : "deprecated",
        publishedAt: server.createdAt.toISOString(),
      },
    },
  }));

  return { servers: transformedServers, totalCount, totalPages, currentPage: page };
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string }>;
}) {
  const params = await searchParams;
  const page = parseInt(params.page || '1', 10);
  const search = params.search;
  const { servers, totalCount, totalPages, currentPage } = await getServers(page, 36, search);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/40">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
           <div className="flex items-center gap-8">
             <Link href="/" className="flex items-center">
               <KeycardLogo />
             </Link>
             <nav className="hidden md:flex items-center gap-6">
               <Link href="/" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
                 MCP Registry
               </Link>
             </nav>
           </div>
           <div className="flex items-center gap-4">
             <HeaderSearch />
             <Button variant="outline" size="sm" className="hidden md:flex" asChild>
               <a href="https://keycard.ai" target="_blank" rel="noopener noreferrer">
                 Get Early Access
               </a>
             </Button>
             <UserProfile />
           </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              MCP Server Registry
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Discover and integrate Model Context Protocol servers for your AI applications
            </p>
          </div>

           {/* Stats */}
           <div className="flex justify-center gap-8 mb-12">
             <div className="text-center">
               <div className="text-3xl font-bold text-primary">{totalCount}</div>
               <div className="text-sm text-muted-foreground">MCP Servers</div>
             </div>
           </div>

           {/* Search Results Header */}
           {search && (
             <div className="flex items-center justify-between mb-6">
               <div className="flex items-center gap-4">
                 <h2 className="text-lg font-semibold">
                   Search results for "{search}"
                 </h2>
                 <Badge variant="secondary">
                   {totalCount} result{totalCount !== 1 ? 's' : ''}
                 </Badge>
               </div>
               <Button variant="outline" size="sm" asChild>
                 <Link href="/">
                   Clear search
                 </Link>
               </Button>
             </div>
           )}

           {/* Servers Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {servers.map((item) => (
              <Card key={`${item.server.name}-${item.server.version}`}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <img
                      src={item.server.icons?.[0]?.src || "/mcp.png"}
                      alt=""
                      className="w-6 h-6"
                    />
                    {item.server.title || item.server.name}
                  </CardTitle>
                  <CardDescription>
                    {item.server.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {/* Status and Transport Badges */}
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="secondary">
                        {item._meta["io.modelcontextprotocol.registry/official"].status}
                      </Badge>
                      {(() => {
                        const transportTypes = new Set<string>();
                        
                        item.server.remotes?.forEach(remote => {
                          transportTypes.add(remote.type);
                        });
                        
                        item.server.packages?.forEach(pkg => {
                          transportTypes.add(pkg.transport?.type || 'stdio');
                        });
                        
                        return Array.from(transportTypes).map(type => (
                          <Badge key={type} variant="outline" className="flex items-center gap-1">
                            {type === 'stdio' ? <Package className="h-3 w-3" /> : <Globe className="h-3 w-3" />}
                            {type}
                          </Badge>
                        ));
                      })()}
                    </div>

                    {/* Version and Date */}
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Cpu className="h-3 w-3" />
                        v{item.server.version}
                      </span>
                      <span>
                        {new Date(item._meta["io.modelcontextprotocol.registry/official"].publishedAt).toLocaleDateString()}
                      </span>
                    </div>

                    <Button asChild className="w-full" variant="outline">
                      <Link href={`/servers/${encodeURIComponent(item.server.name)}`}>
                        View Details
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious 
                    href={currentPage > 1 ? `/?page=${currentPage - 1}` : undefined}
                    aria-disabled={currentPage <= 1}
                    className={currentPage <= 1 ? "pointer-events-none opacity-50" : ""}
                  />
                </PaginationItem>

                {/* First page */}
                {currentPage > 2 && (
                  <PaginationItem>
                    <PaginationLink href="/?page=1">1</PaginationLink>
                  </PaginationItem>
                )}

                {/* Left ellipsis */}
                {currentPage > 3 && (
                  <PaginationItem>
                    <PaginationEllipsis />
                  </PaginationItem>
                )}

                {/* Page numbers around current */}
                {Array.from({ length: Math.min(3, totalPages) }, (_, i) => {
                  let pageNum;
                  if (currentPage === 1) {
                    pageNum = i + 1;
                  } else if (currentPage === totalPages) {
                    pageNum = totalPages - 2 + i;
                  } else {
                    pageNum = currentPage - 1 + i;
                  }
                  
                  if (pageNum < 1 || pageNum > totalPages) return null;
                  
                  return (
                    <PaginationItem key={pageNum}>
                      <PaginationLink 
                        href={`/?page=${pageNum}`}
                        isActive={pageNum === currentPage}
                      >
                        {pageNum}
                      </PaginationLink>
                    </PaginationItem>
                  );
                })}

                {/* Right ellipsis */}
                {currentPage < totalPages - 2 && (
                  <PaginationItem>
                    <PaginationEllipsis />
                  </PaginationItem>
                )}

                {/* Last page */}
                {currentPage < totalPages - 1 && (
                  <PaginationItem>
                    <PaginationLink href={`/?page=${totalPages}`}>{totalPages}</PaginationLink>
                  </PaginationItem>
                )}

                <PaginationItem>
                  <PaginationNext 
                    href={currentPage < totalPages ? `/?page=${currentPage + 1}` : undefined}
                    aria-disabled={currentPage >= totalPages}
                    className={currentPage >= totalPages ? "pointer-events-none opacity-50" : ""}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </div>
      </div>
    </div>
  );
}
