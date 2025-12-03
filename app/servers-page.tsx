"use client";

import { useState, useEffect } from "react";

// Force dynamic rendering to avoid SSR issues with auth
export const dynamic = 'force-dynamic';
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { KeycardLogo } from "@/components/keycard-logo";
import { UserProfile } from "@/components/auth/user-profile";
import { Globe, Package, Cpu, ArrowRight } from "lucide-react";

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

interface ServersResponse {
  servers: Server[];
  metadata: {
    nextCursor: string | null;
    count: number;
    totalCount: number;
  };
}

export default function ServersPage() {
  const [servers, setServers] = useState<Server[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [hasMoreData, setHasMoreData] = useState(true);

  const fetchServers = async (reset = false) => {
    if (reset) {
      setLoading(true);
      setServers([]);
      setNextCursor(null);
    } else {
      setLoadingMore(true);
    }

    let url = '/api/servers';
    if (!reset && nextCursor) {
      url += `?cursor=${encodeURIComponent(nextCursor)}`;
    }
    const response = await fetch(url);
    const data: ServersResponse = await response.json();

    if (reset) {
      setServers(data.servers);
      setTotalCount(data.metadata.totalCount);
    } else {
      setServers(prev => [...prev, ...data.servers]);
    }

    setNextCursor(data.metadata.nextCursor);
    setHasMoreData(data.metadata.nextCursor !== null);
    setLoading(false);
    setLoadingMore(false);
  };

  useEffect(() => {
    fetchServers(true);
  }, []);

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
             <Button variant="outline" size="sm" className="hidden md:flex">
               Get Early Access
             </Button>
             <UserProfile />
           </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            Discover MCP Servers
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Find and review Model Context Protocol servers for your applications. Browse featured servers, read reviews, and discover new tools with Keycard's MCP Registry.
          </p>
           <Button
             size="lg"
             className="mb-12"
             onClick={() => {
               const serversSection = document.getElementById('servers-section');
               if (serversSection) {
                 serversSection.scrollIntoView({ behavior: 'smooth' });
               }
             }}
           >
             Explore Servers
           </Button>
        </div>
      </section>

      <div id="servers-section" className="container mx-auto px-4 py-8">
        <div className="flex flex-col gap-6">

          {/* Results Count */}
          {!loading && (
            <div className="mb-4">
              <p className="text-sm text-muted-foreground">
                Showing {servers.length} of {totalCount} servers
              </p>
            </div>
          )}

          {/* Server Grid */}
          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {servers.map((item) => (
                  <Card key={`${item.server.name}-${item.server.version}`}>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <img
                          src={item.server.icons?.[0]?.src || "/mcp.png"}
                          alt=""
                          className="w-6 h-6"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            if (target.src !== "/mcp.png") {
                              target.src = "/mcp.png";
                            }
                          }}
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
                             
                             // Collect transport types from remotes
                             item.server.remotes?.forEach(remote => {
                               transportTypes.add(remote.type);
                             });
                             
                             // Collect transport types from packages
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

              {/* Load More Button */}
              {servers.length > 0 && (
                <div className="text-center py-8">
                  <Button
                    onClick={() => fetchServers(false)}
                    disabled={loadingMore || !nextCursor}
                    variant="outline"
                  >
                    {loadingMore ? "Loading..." : nextCursor ? "Load More" : "All Servers Loaded"}
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}