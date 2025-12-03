"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Tag } from "lucide-react";

interface VersionInfo {
  server: {
    name: string;
    version: string;
    description: string;
    title?: string;
  };
  _meta: {
    "io.modelcontextprotocol.registry/official": {
      status: string;
      publishedAt: string;
      updatedAt: string;
      isLatest: boolean;
    };
  };
}

interface VersionsTabProps {
  serverName: string;
}

export function VersionsTab({ serverName }: VersionsTabProps) {
  const [versions, setVersions] = useState<VersionInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchVersions();
  }, [serverName]);

  const fetchVersions = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/v0/servers/${encodeURIComponent(serverName)}/versions`);
      if (!response.ok) {
        throw new Error('Failed to fetch versions');
      }
      const data = await response.json();
      setVersions(data.servers || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load versions');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Version History</CardTitle>
          <CardDescription>Loading version history...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-muted rounded w-1/4 mb-2"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Version History</CardTitle>
          <CardDescription>Failed to load version history</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={fetchVersions} variant="outline">
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (versions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Version History</CardTitle>
          <CardDescription>All available versions of this MCP server</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-muted-foreground">No version history available.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Version History</CardTitle>
        <CardDescription>
          All available versions of this MCP server ({versions.length} versions)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {versions.map((version, index) => (
            <div
              key={`${version.server.name}-${version.server.version}`}
              className={`border rounded-lg p-4 ${
                version._meta["io.modelcontextprotocol.registry/official"].isLatest
                  ? 'border-primary bg-primary/5'
                  : 'border-border'
              }`}
            >
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Tag className="h-4 w-4" />
                  <span className="font-mono font-medium">{version.server.version}</span>
                  {version._meta["io.modelcontextprotocol.registry/official"].isLatest && (
                    <Badge variant="default" className="text-xs">Latest</Badge>
                  )}
                  <Badge
                    variant={version._meta["io.modelcontextprotocol.registry/official"].status === 'active' ? 'secondary' : 'outline'}
                    className="text-xs"
                  >
                    {version._meta["io.modelcontextprotocol.registry/official"].status}
                  </Badge>
                </div>

                {version.server.title && (
                  <p className="text-sm text-muted-foreground mb-2">
                    {version.server.title}
                  </p>
                )}

                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    <span>
                      Published {new Date(version._meta["io.modelcontextprotocol.registry/official"].publishedAt).toLocaleDateString()}
                    </span>
                  </div>
                  {version._meta["io.modelcontextprotocol.registry/official"].updatedAt !== version._meta["io.modelcontextprotocol.registry/official"].publishedAt && (
                    <div className="flex items-center gap-1">
                      <span>
                        Updated {new Date(version._meta["io.modelcontextprotocol.registry/official"].updatedAt).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}