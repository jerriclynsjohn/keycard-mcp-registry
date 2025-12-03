"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star, ArrowLeft } from "lucide-react";
import { KeycardLogo } from "@/components/keycard-logo";

interface ServerDetails {
  server: {
    name: string;
    description: string;
    title?: string;
    version: string;
    websiteUrl?: string;
    icons?: Array<{ src: string }>;
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
            {/* Server Header */}
            <Card>
              <CardHeader>
                <div className="flex items-start gap-4">
                  {server.server.icons?.[0] && (
                    <img
                      src={server.server.icons[0].src}
                      alt=""
                      className="w-12 h-12 rounded-lg"
                    />
                  )}
                  <div className="flex-1">
                    <CardTitle className="text-2xl mb-2">
                      {server.server.title || server.server.name}
                    </CardTitle>
                    <CardDescription className="text-base mb-4">
                      {server.server.description}
                    </CardDescription>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>Version {server.server.version}</span>
                      <Badge variant="secondary">
                        {server._meta["io.modelcontextprotocol.registry/official"].status}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardHeader>
            </Card>

            {/* Server Info */}
            <Card>
              <CardHeader>
                <CardTitle>Server Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium mb-1">Name</h4>
                  <p className="text-sm text-muted-foreground font-mono">{server.server.name}</p>
                </div>

                {server.server.websiteUrl && (
                  <div>
                    <h4 className="font-medium mb-1">Website</h4>
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
                    <h4 className="font-medium mb-1">MCP URL</h4>
                    <p className="text-sm text-muted-foreground font-mono break-all">
                      {server.server.remotes[0].url}
                    </p>
                  </div>
                )}

                {server.server._meta["io.modelcontextprotocol.registry/publisher-provided"].maintainerName && (
                  <div>
                    <h4 className="font-medium mb-1">Maintainer</h4>
                    <p className="text-sm text-muted-foreground">
                      {server.server._meta["io.modelcontextprotocol.registry/publisher-provided"].maintainerName}
                    </p>
                  </div>
                )}

                {server.server._meta["io.modelcontextprotocol.registry/publisher-provided"].category && (
                  <div>
                    <h4 className="font-medium mb-1">Category</h4>
                    <p className="text-sm text-muted-foreground">
                      {server.server._meta["io.modelcontextprotocol.registry/publisher-provided"].category}
                    </p>
                  </div>
                )}

                {server.server._meta["io.modelcontextprotocol.registry/publisher-provided"].aiSummary && (
                  <div>
                    <h4 className="font-medium mb-1">AI Summary</h4>
                    <p className="text-sm text-muted-foreground">
                      {server.server._meta["io.modelcontextprotocol.registry/publisher-provided"].aiSummary}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

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