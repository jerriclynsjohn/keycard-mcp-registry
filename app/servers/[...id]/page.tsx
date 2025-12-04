import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Star, ArrowLeft, Globe, Code, History, Package } from "lucide-react";
import { KeycardLogo } from "@/components/keycard-logo";
import { ReviewDialog, UserProfile } from "@/components/auth/user-profile";
import { InstallationInstructions } from "@/components/installation/InstallationInstructions";
import { VersionsTab } from "@/components/VersionsTab";
import { PackageDetails } from "@/components/PackageDetails";
import { RemoteDetails } from "@/components/RemoteDetails";
import { RepositoryDetails } from "@/components/RepositoryDetails";
import { CopyConfigButton } from "./ServerDetailClient";
import { prisma } from "@/lib/server/db";

async function getServerByName(name: string) {
  const server = await prisma.mcpServer.findFirst({
    where: { name },
    include: {
      packages: {
        include: {
          environmentVariables: true,
        },
      },
      remotes: {
        include: {
          headers: true,
        },
      },
      repository: true,
      reviews: {
        include: {
          user: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      },
    },
    orderBy: {
      updatedAt: 'desc',
    },
  });

  if (!server) {
    return null;
  }

  return {
    server: {
      name: server.name,
      description: server.description || "",
      title: server.category || undefined,
      version: server.version,
      websiteUrl: server.documentationUrl || server.maintainerUrl || undefined,
      icons: server.iconUrl ? [{ src: server.iconUrl }] : undefined,
      repository: server.repository ? {
        url: server.repository.url,
        source: server.repository.source,
        id: server.repository.id || undefined,
        subfolder: server.repository.subfolder || undefined,
      } : undefined,
      packages: server.packages?.map(p => ({
        registryType: p.registryType,
        registryBaseUrl: p.registryBaseUrl || "",
        identifier: p.identifier,
        version: p.version,
        transport: p.transport as any,
        runtimeHint: p.runtimeHint || undefined,
        packageArguments: (p.packageArguments as any[] | undefined) || undefined,
        environmentVariables: p.environmentVariables?.map(e => ({
          name: e.name,
          description: e.description || undefined,
          isRequired: e.isRequired,
          isSecret: e.isSecret,
          default: e.default || undefined,
          format: e.format || undefined,
          choices: (e.choices as string[] | undefined) || undefined,
        })),
      })),
      remotes: server.remotes?.map(r => ({
        type: r.type,
        url: r.url,
        headers: r.headers?.map(h => ({
          name: h.name,
          description: h.description || undefined,
          isRequired: h.isRequired,
          isSecret: h.isSecret,
          default: h.default || undefined,
          format: h.format || undefined,
          choices: h.choices || undefined,
        })),
      })),
      _meta: {
        "io.modelcontextprotocol.registry/publisher-provided": {
          maintainerName: server.maintainerName || undefined,
          maintainerUrl: server.maintainerUrl || undefined,
          authenticationType: server.authenticationType || undefined,
          dynamicClientRegistration: server.dynamicClientRegistration,
          category: server.category || undefined,
          aiSummary: server.aiSummary || undefined,
        },
      },
    },
    _meta: {
      "io.modelcontextprotocol.registry/official": {
        status: server.status === "approved" ? "active" : "deprecated",
        publishedAt: server.createdAt.toISOString(),
        updatedAt: server.updatedAt.toISOString(),
        isLatest: true,
      },
    },
    reviews: server.reviews.map(r => ({
      id: r.id,
      rating: r.rating,
      comment: r.comment || undefined,
      createdAt: r.createdAt.toISOString(),
      user: r.user ? {
        name: r.user.name || undefined,
        image: r.user.image || undefined,
      } : undefined,
    })),
  };
}

export default async function ServerDetailsPage({
  params,
}: {
  params: Promise<{ id: string[] }>;
}) {
  const { id } = await params;
  const serverName = Array.isArray(id) ? id.join("/") : id;
  const serverDetails = await getServerByName(decodeURIComponent(serverName));

  if (!serverDetails) {
    notFound();
  }

  const { server, _meta, reviews } = serverDetails;

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

  const averageRating =
    reviews.length > 0
      ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
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
                    src={server.icons?.[0]?.src || "/mcp.png"}
                    alt=""
                    className="w-12 h-12 rounded-lg"
                  />
                  <div className="flex-1">
                    <CardTitle className="text-2xl mb-2">
                      {server.title || server.name}
                    </CardTitle>
                    <CardDescription className="text-base mb-4">
                      {server.description}
                    </CardDescription>
                    <div className="flex flex-wrap items-center gap-2 mb-4">
                      <Badge variant="secondary">
                        {_meta["io.modelcontextprotocol.registry/official"].status}
                      </Badge>
                      <span className="text-sm text-muted-foreground">•</span>
                      <span className="text-sm text-muted-foreground">v{server.version}</span>
                      <span className="text-sm text-muted-foreground">•</span>
                      {(() => {
                        const transportTypes = new Set<string>();
                        
                        server.remotes?.forEach(remote => {
                          transportTypes.add(remote.type);
                        });
                        
                        server.packages?.forEach(pkg => {
                          const transport = pkg.transport && typeof pkg.transport === 'object' && !Array.isArray(pkg.transport) ? (pkg.transport as { type?: string }).type : null;
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
                        <p className="text-sm text-muted-foreground font-mono">{server.name}</p>
                      </div>

                      {server.websiteUrl && (
                        <div>
                          <h4 className="font-medium mb-1 text-sm">Website</h4>
                          <a
                            href={server.websiteUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-primary hover:underline"
                          >
                            {server.websiteUrl}
                          </a>
                        </div>
                      )}

                      {server.remotes?.[0] && (
                        <div>
                          <h4 className="font-medium mb-1 text-sm">MCP URL</h4>
                          <p className="text-sm text-muted-foreground font-mono break-all">
                            {server.remotes[0].url}
                          </p>
                        </div>
                      )}

                      {server._meta["io.modelcontextprotocol.registry/publisher-provided"].maintainerName && (
                        <div>
                          <h4 className="font-medium mb-1 text-sm">Maintainer</h4>
                          <p className="text-sm text-muted-foreground">
                            {server._meta["io.modelcontextprotocol.registry/publisher-provided"].maintainerName}
                          </p>
                        </div>
                      )}

                      {server._meta["io.modelcontextprotocol.registry/publisher-provided"].category && (
                        <div>
                          <h4 className="font-medium mb-1 text-sm">Category</h4>
                          <p className="text-sm text-muted-foreground">
                            {server._meta["io.modelcontextprotocol.registry/publisher-provided"].category}
                          </p>
                        </div>
                      )}

                      {server._meta["io.modelcontextprotocol.registry/publisher-provided"].aiSummary && (
                        <div className="md:col-span-2">
                          <h4 className="font-medium mb-1 text-sm">AI Summary</h4>
                          <p className="text-sm text-muted-foreground">
                            {server._meta["io.modelcontextprotocol.registry/publisher-provided"].aiSummary}
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
                <InstallationInstructions server={server} />
              </TabsContent>

              <TabsContent value="details" className="mt-6 space-y-6">
                {server.repository && (
                  <RepositoryDetails repository={server.repository} />
                )}

                {server.packages && server.packages.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Package Configuration</h3>
                    <PackageDetails packages={server.packages} />
                  </div>
                )}

                {server.remotes && server.remotes.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Remote Connections</h3>
                    <RemoteDetails remotes={server.remotes} />
                  </div>
                )}

                <Card>
                  <CardHeader>
                    <CardTitle>Registry Metadata</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Published:</span>
                        <p className="text-muted-foreground">
                          {new Date(_meta["io.modelcontextprotocol.registry/official"].publishedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div>
                        <span className="font-medium">Last Updated:</span>
                        <p className="text-muted-foreground">
                          {new Date(_meta["io.modelcontextprotocol.registry/official"].updatedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div>
                        <span className="font-medium">Status:</span>
                        <p className="text-muted-foreground capitalize">
                          {_meta["io.modelcontextprotocol.registry/official"].status}
                        </p>
                      </div>
                      <div>
                        <span className="font-medium">Version Status:</span>
                        <p className="text-muted-foreground">
                          {_meta["io.modelcontextprotocol.registry/official"].isLatest ? 'Latest Version' : 'Older Version'}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="versions" className="mt-6">
                <VersionsTab serverName={server.name} />
              </TabsContent>
            </Tabs>

            {/* Reviews */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  Reviews
                  {reviews.length > 0 && (
                    <Badge variant="secondary">{reviews.length}</Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {reviews.length === 0 ? (
                  <p className="text-muted-foreground">No reviews yet.</p>
                ) : (
                  <div className="space-y-4">
                    {reviews.map((review) => (
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
                  <ReviewDialog serverId={server.name} />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {reviews.length > 0 && (
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
                    Based on {reviews.length} review{reviews.length !== 1 ? "s" : ""}
                  </p>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <CopyConfigButton server={server} />
                {server.remotes?.[0] && (
                  <Button className="w-full" variant="outline" asChild>
                    <a
                      href={server.remotes[0].url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Connect to Server
                    </a>
                  </Button>
                )}
                {server.websiteUrl && (
                  <Button className="w-full" variant="outline" asChild>
                    <a
                      href={server.websiteUrl}
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
