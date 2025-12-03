"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Server {
  server: {
    name: string;
    description: string;
    title?: string;
    icons?: Array<{ src: string }>;
  };
  _meta: {
    "io.modelcontextprotocol.registry/official": {
      status: string;
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

  useEffect(() => {
    fetchServers(true);
  }, []);

  const fetchServers = async (reset = false) => {
    if (reset) {
      setLoading(true);
      setServers([]);
      setNextCursor(null);
    } else {
      setLoadingMore(true);
    }

    const response = await fetch(`/api/servers`);
    const data: ServersResponse = await response.json();

    if (reset) {
      setServers(data.servers);
      setTotalCount(data.metadata.totalCount);
    } else {
      setServers(prev => [...prev, ...data.servers]);
    }

    setNextCursor(data.metadata.nextCursor);
    setLoading(false);
    setLoadingMore(false);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold">
            MCP Subregistry
          </Link>
          <nav className="flex items-center gap-4">
            <span className="text-sm font-medium text-muted-foreground">
              MCP Servers
            </span>
          </nav>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
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
                  <Card key={item.server.name}>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        {item.server.icons?.[0] && (
                          <img
                            src={item.server.icons[0].src}
                            alt=""
                            className="w-6 h-6"
                          />
                        )}
                        {item.server.title || item.server.name}
                      </CardTitle>
                      <CardDescription>
                        {item.server.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="secondary">
                          {item._meta["io.modelcontextprotocol.registry/official"].status}
                        </Badge>
                      </div>
                      <Button asChild className="w-full">
                        <Link href={`/servers/${item.server.name.replace("/", "%2F")}`}>
                          View Details
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Load More Button */}
              {nextCursor && (
                <div className="text-center py-8">
                  <Button
                    onClick={() => fetchServers(false)}
                    disabled={loadingMore}
                    variant="outline"
                  >
                    {loadingMore ? "Loading..." : "Load More"}
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