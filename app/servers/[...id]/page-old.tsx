"use client";

import { useState, useEffect } from "react";

// Force dynamic rendering to avoid SSR issues with auth
export const dynamic = 'force-dynamic';
import { useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Star, ArrowLeft, Globe, Code, History, Copy, Check, Package } from "lucide-react";
import { KeycardLogo } from "@/components/keycard-logo";
import { ReviewDialog, UserProfile } from "@/components/auth/user-profile";
import { InstallationInstructions } from "@/components/installation/InstallationInstructions";
import { VersionsTab } from "@/components/VersionsTab";
import { PackageDetails } from "@/components/PackageDetails";
import { RemoteDetails } from "@/components/RemoteDetails";
import { RepositoryDetails } from "@/components/RepositoryDetails";

interface ServerDetails {
  server: {
    name: string;
    description: string;
    title?: string;
    version: string;
    websiteUrl?: string;
    icons?: Array<{ src: string }>;
    repository?: {
      url: string;
      source: string;
      id?: string;
      subfolder?: string;
    };
    packages?: Array<{
      registryType: string;
      registryBaseUrl: string;
      identifier: string;
      version: string;
      transport: any;
      runtimeHint?: string;
      packageArguments?: any[];
      environmentVariables?: Array<{
        name: string;
        description?: string;
        isRequired?: boolean;
        isSecret?: boolean;
        default?: string;
        format?: string;
        choices?: string[];
      }>;
    }>;
    remotes?: Array<{ 
      type: string; 
      url: string;
      headers?: Array<{
        name: string;
        description?: string;
        isRequired?: boolean;
        isSecret?: boolean;
        default?: string;
        format?: string;
        choices?: string[];
      }>;
    }>;
    _meta: {
      "io.modelcontextprotocol.registry/publisher-provided": {
        maintainerName?: string;
        maintainerUrl?: string;
        authenticationType?: string;
        dynamicClientRegistration: boolean;
        category?: string;
        aiSummary?: string;
      };
    };
  };
  _meta: {
    "io.modelcontextprotocol.registry/official": {
      status: string;
      publishedAt: string;
      updatedAt: string;
      isLatest: boolean;
    };
  };
  reviews: Array<{
    id: string;
    rating: number;
    comment?: string;
    createdAt: string;
    user?: {
      name?: string;
      image?: string;
    };
  }>;
}

export default function ServerDetailsPage() {
  const params = useParams();
  const [server, setServer] = useState<ServerDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedConfig, setCopiedConfig] = useState(false);

  const fetchServer = async () => {
    if (!params.id) return;

    try {
      setLoading(true);
      const id = Array.isArray(params.id) ? params.id.join("/") : params.id;
      const response = await fetch(`/api/servers/${encodeURIComponent(id)}`);
      if (!response.ok) {
        throw new Error("Server not found");
      }
      const data = await response.json();
      setServer(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load server");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (params.id) {
      fetchServer();
    }
  }, [params.id]);

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${
          i < rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
        }`}
      />
    ));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  if (error || !server) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Server Not Found</h1>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button asChild>
            <Link href="/servers">Back to Servers</Link>
          </Button>
        </div>
      </div>
    );
  }

  const averageRating =
    server.reviews.length > 0
      ? server.reviews.reduce((sum, review) => sum + review.rating, 0) / server.reviews.length
      : 0;

  const copyConfig = async () => {
    const serverKey = server.server.name.replace(/[^a-zA-Z0-9_-]/g, '_');
    const pkg = server.server.packages?.[0];
    const remote = server.server.remotes?.[0];
    
    let config: any = {};
    
    if (pkg) {
      const command = pkg.runtimeHint || 'npx';
      const args = command === 'npx' 
        ? [pkg.identifier, ...(pkg.packageArguments || []).map((arg: any) => arg.value || arg)]
        : [pkg.identifier, ...(pkg.packageArguments || []).map((arg: any) => arg.value || arg)].filter(Boolean);
      
      config = {
        mcpServers: {
          [serverKey]: {
            command,
            args,
            ...(pkg.environmentVariables && pkg.environmentVariables.length > 0 && {
              env: pkg.environmentVariables.reduce((acc: any, env: any) => {
                acc[env.name] = env.default || `YOUR_${env.name}`;
                return acc;
              }, {})
            })
          }
        }
      };
    } else if (remote) {
      config = {
        mcpServers: {
          [serverKey]: {
            type: remote.type,
            url: remote.url,
            ...(remote.headers && remote.headers.length > 0 && {
              headers: remote.headers.reduce((acc: any, header: any) => {
                acc[header.name] = header.default || `YOUR_${header.name}`;
                return acc;
              }, {})
            })
          }
        }
      };
    }
    
    try {
      await navigator.clipboard.writeText(JSON.stringify(config, null, 2));
      setCopiedConfig(true);
      setTimeout(() => setCopiedConfig(false), 2000);
    } catch (err) {
      console.error('Failed to copy config:', err);
    }
  };

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
             <Button variant="outline" size="sm" className="hidden md:flex" asChild>
               <a href="https://keycard.ai" target="_blank" rel="noopener noreferrer">
                 Get Early Access
               </a>
             </Button>
             <UserProfile />
           </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <div className="mb-6">
          <Button variant="ghost" asChild className="mb-4">
            <Link href="/" className="flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Servers
            </Link>
          </Button>
        </div>

        {/* Server Details */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Persistent Server Header */}
            <Card>
              <CardHeader>
                <div className="flex items-start gap-4">
                  <img
                    src={server.server.icons?.[0]?.src || "/mcp.png"}
                    alt=""
                    className="w-12 h-12 rounded-lg"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      if (target.src !== "/mcp.png") {
                        target.src = "/mcp.png";
                      }
                    }}
                  />
                  <div className="flex-1">
                    <CardTitle className="text-2xl mb-2">
                      {server.server.title || server.server.name}
                    </CardTitle>
                    <CardDescription className="text-base mb-4">
                      {server.server.description}
                    </CardDescription>
                    <div className="flex flex-wrap items-center gap-2 mb-4">
                      <Badge variant="secondary">
                        {server._meta["io.modelcontextprotocol.registry/official"].status}
                      </Badge>
                      <span className="text-sm text-muted-foreground">•</span>
                      <span className="text-sm text-muted-foreground">v{server.server.version}</span>
                      <span className="text-sm text-muted-foreground">•</span>
                      {(() => {
                        const transportTypes = new Set<string>();
                        
                        // Collect transport types from remotes
                        server.server.remotes?.forEach(remote => {
                          transportTypes.add(remote.type);
                        });
                        
                        // Collect transport types from packages
                        server.server.packages?.forEach(pkg => {
                          const transport = typeof pkg.transport === 'object' ? pkg.transport.type : pkg.transport;
                          transportTypes.add(transport || 'stdio');
                        });
                        
                        return Array.from(transportTypes).map(type => (
                          <Badge key={type} variant="outline" className="flex items-center gap-1">
                            {type === 'stdio' ? <Package className="h-3 w-3" /> : <Globe className="h-3 w-3" />}
                            {type}
                          </Badge>
                        ));
                      })()}
                    </div>

                    {/* Server Information Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-medium mb-1 text-sm">Name</h4>
                        <p className="text-sm text-muted-foreground font-mono">{server.server.name}</p>
                      </div>

                      {server.server.websiteUrl && (
                        <div>
                          <h4 className="font-medium mb-1 text-sm">Website</h4>
                          <a
                            href={server.server.websiteUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-primary hover:underline"
                          >
                            {server.server.websiteUrl}
                          </a>
                        </div>
                      )}

                      {server.server.remotes?.[0] && (
                        <div>
                          <h4 className="font-medium mb-1 text-sm">MCP URL</h4>
                          <p className="text-sm text-muted-foreground font-mono break-all">
                            {server.server.remotes[0].url}
                          </p>
                        </div>
                      )}

                      {server.server._meta["io.modelcontextprotocol.registry/publisher-provided"].maintainerName && (
                        <div>
                          <h4 className="font-medium mb-1 text-sm">Maintainer</h4>
                          <p className="text-sm text-muted-foreground">
                            {server.server._meta["io.modelcontextprotocol.registry/publisher-provided"].maintainerName}
                          </p>
                        </div>
                      )}

                      {server.server._meta["io.modelcontextprotocol.registry/publisher-provided"].category && (
                        <div>
                          <h4 className="font-medium mb-1 text-sm">Category</h4>
                          <p className="text-sm text-muted-foreground">
                            {server.server._meta["io.modelcontextprotocol.registry/publisher-provided"].category}
                          </p>
                        </div>
                      )}

                      {server.server._meta["io.modelcontextprotocol.registry/publisher-provided"].aiSummary && (
                        <div className="md:col-span-2">
                          <h4 className="font-medium mb-1 text-sm">AI Summary</h4>
                          <p className="text-sm text-muted-foreground">
                            {server.server._meta["io.modelcontextprotocol.registry/publisher-provided"].aiSummary}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardHeader>
            </Card>

            {/* Tabs */}
            <Tabs defaultValue="installation" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="installation" className="flex items-center gap-2">
                  <Code className="h-4 w-4" />
                  Installation
                </TabsTrigger>
                <TabsTrigger value="details" className="flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  Details
                </TabsTrigger>
                <TabsTrigger value="versions" className="flex items-center gap-2">
                  <History className="h-4 w-4" />
                  Versions
                </TabsTrigger>
              </TabsList>

              <TabsContent value="installation" className="mt-6">
                <InstallationInstructions server={server.server} />
              </TabsContent>

              <TabsContent value="details" className="mt-6 space-y-6">
                

                {/* Repository Information - Only show if repository data exists */}
                {server.server.repository && (
                  <RepositoryDetails repository={server.server.repository} />
                )}

                {/* Package Details - Only show if packages exist */}
                {server.server.packages && server.server.packages.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Package Configuration</h3>
                    <PackageDetails packages={server.server.packages} />
                  </div>
                )}

                {/* Remote Connection Details - Only show if remotes exist */}
                {server.server.remotes && server.server.remotes.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Remote Connections</h3>
                    <RemoteDetails remotes={server.server.remotes} />
                  </div>
                )}

                {/* Metadata Summary - Always show as it should always have data */}
                <Card>
                  <CardHeader>
                    <CardTitle>Registry Metadata</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Published:</span>
                        <p className="text-muted-foreground">
                          {new Date(server._meta["io.modelcontextprotocol.registry/official"].publishedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div>
                        <span className="font-medium">Last Updated:</span>
                        <p className="text-muted-foreground">
                          {new Date(server._meta["io.modelcontextprotocol.registry/official"].updatedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div>
                        <span className="font-medium">Status:</span>
                        <p className="text-muted-foreground capitalize">
                          {server._meta["io.modelcontextprotocol.registry/official"].status}
                        </p>
                      </div>
                      <div>
                        <span className="font-medium">Version Status:</span>
                        <p className="text-muted-foreground">
                          {server._meta["io.modelcontextprotocol.registry/official"].isLatest ? 'Latest Version' : 'Older Version'}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="versions" className="mt-6">
                <VersionsTab serverName={server.server.name} />
              </TabsContent>
            </Tabs>

            

            {/* Reviews */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  Reviews
                  {server.reviews.length > 0 && (
                    <Badge variant="secondary">{server.reviews.length}</Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {server.reviews.length === 0 ? (
                  <p className="text-muted-foreground">No reviews yet.</p>
                ) : (
                  <div className="space-y-4">
                    {server.reviews.map((review) => (
                      <div key={review.id} className="border-b border-border/40 last:border-0 pb-4 last:pb-0">
                        <div className="flex items-center gap-3 mb-2">
                          <Avatar className="w-8 h-8">
                            <AvatarImage src={review.user?.image} />
                            <AvatarFallback>
                              {review.user?.name?.charAt(0) || "A"}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm">
                                {review.user?.name || "Anonymous"}
                              </span>
                              <div className="flex items-center">
                                {renderStars(review.rating)}
                              </div>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {new Date(review.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        {review.comment && (
                          <p className="text-sm text-muted-foreground ml-11">
                            {review.comment}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                <div className="mt-6 pt-4 border-t border-border/40">
                  <ReviewDialog
                    serverId={server.server.name}
                    onReviewSubmitted={fetchServer}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Rating Summary */}
            {server.reviews.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Rating</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl font-bold">{averageRating.toFixed(1)}</span>
                    <div className="flex items-center">
                      {renderStars(Math.round(averageRating))}
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Based on {server.reviews.length} review{server.reviews.length !== 1 ? "s" : ""}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button 
                  className="w-full" 
                  variant="outline"
                  onClick={copyConfig}
                >
                  {copiedConfig ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
                  {copiedConfig ? 'Copied!' : 'Copy Basic Config'}
                </Button>
                {server.server.remotes?.[0] && (
                  <Button className="w-full" variant="outline" asChild>
                    <a
                      href={server.server.remotes[0].url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Connect to Server
                    </a>
                  </Button>
                )}
                {server.server.websiteUrl && (
                  <Button className="w-full" variant="outline" asChild>
                    <a
                      href={server.server.websiteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Visit Website
                    </a>
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}