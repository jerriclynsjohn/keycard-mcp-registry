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
import { Star, ArrowLeft, Globe, Code, History } from "lucide-react";
import { KeycardLogo } from "@/components/keycard-logo";
import { ReviewDialog, UserProfile } from "@/components/auth/user-profile";
import { InstallationInstructions } from "@/components/installation/InstallationInstructions";

interface ServerDetails {
  server: {
    name: string;
    description: string;
    title?: string;
    version: string;
    websiteUrl?: string;
    icons?: Array<{ src: string }>;
    packages?: Array<{
      registryType: string;
      registryBaseUrl: string;
      identifier: string;
      version: string;
      transport: any;
    }>;
    remotes?: Array<{ type: string; url: string }>;
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
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                      <span>Version {server.server.version}</span>
                      <Badge variant="secondary">
                        {server._meta["io.modelcontextprotocol.registry/official"].status}
                      </Badge>
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
                
                {/* Technical Details */}
                <Card>
                  <CardHeader>
                    <CardTitle>Technical Details</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium mb-2">Transport Types</h4>
                        <div className="flex gap-2">
                          {server.server.remotes?.map((remote, index) => (
                            <Badge key={index} variant="outline">
                              {remote.type}
                            </Badge>
                          ))}
                          {server.server.packages?.map((pkg, index) => (
                            <Badge key={index} variant="outline">
                              {pkg.transport?.type || 'stdio'}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      {server.server.packages && server.server.packages.length > 0 && (
                        <div>
                          <h4 className="font-medium mb-2">Packages</h4>
                          <div className="space-y-2">
                            {server.server.packages.map((pkg, index) => (
                              <div key={index} className="flex items-center gap-2 p-2 bg-muted rounded">
                                <Badge variant="secondary">{pkg.registryType}</Badge>
                                <code className="text-sm">{pkg.identifier}@{pkg.version}</code>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div>
                        <h4 className="font-medium mb-2">Metadata</h4>
                        <div className="text-sm space-y-1">
                          <p><strong>Published:</strong> {new Date(server._meta["io.modelcontextprotocol.registry/official"].publishedAt).toLocaleDateString()}</p>
                          <p><strong>Updated:</strong> {new Date(server._meta["io.modelcontextprotocol.registry/official"].updatedAt).toLocaleDateString()}</p>
                          <p><strong>Status:</strong> {server._meta["io.modelcontextprotocol.registry/official"].status}</p>
                          <p><strong>Is Latest:</strong> {server._meta["io.modelcontextprotocol.registry/official"].isLatest ? 'Yes' : 'No'}</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="versions" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Version History</CardTitle>
                    <CardDescription>
                      All available versions of this MCP server
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8">
                      <p className="text-muted-foreground mb-4">
                        Version history will be available soon. For now, only the latest version is shown.
                      </p>
                      <Button variant="outline" disabled>
                        Load Version History
                      </Button>
                    </div>
                  </CardContent>
                </Card>
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