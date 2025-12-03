"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Copy, Check, Globe, Shield, ExternalLink, Info } from "lucide-react";
import { useState } from "react";

interface RemoteInfo {
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
}

interface RemoteDetailsProps {
  remotes: RemoteInfo[];
}

export function RemoteDetails({ remotes }: RemoteDetailsProps) {
  const [copiedText, setCopiedText] = useState<string | null>(null);

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedText(label);
      setTimeout(() => setCopiedText(null), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  if (!remotes || remotes.length === 0) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center text-muted-foreground">
            <Globe className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No remote connections available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {remotes.map((remote, index) => (
        <Card key={`${remote.type}-${remote.url}-${index}`}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Globe className="h-5 w-5 text-primary" />
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    Remote Connection
                    <Badge variant="secondary">{remote.type}</Badge>
                  </CardTitle>
                  <CardDescription className="flex items-center gap-2">
                    <a
                      href={remote.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline inline-flex items-center gap-1"
                    >
                      {remote.url}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </CardDescription>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(remote.url, `remote-url-${index}`)}
              >
                {copiedText === `remote-url-${index}` ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </CardHeader>

          <CardContent>
            <div className="space-y-4">
              {/* Connection Details */}
              <div>
                <h4 className="font-medium mb-2">Connection Details</h4>
                <div className="bg-muted p-3 rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="font-medium">Type:</span> {remote.type}
                    </div>
                    <div>
                      <span className="font-medium">URL:</span>
                      <code className="ml-1 bg-background px-1 rounded text-xs">
                        {remote.url}
                      </code>
                    </div>
                  </div>
                </div>
              </div>

              {/* Authentication Headers */}
              {remote.headers && remote.headers.length > 0 && (
                <div>
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Authentication Headers ({remote.headers.length})
                  </h4>
                  <div className="space-y-3">
                    {remote.headers.map((header, headerIndex) => (
                      <div key={headerIndex} className="border rounded-lg p-3 bg-muted/30">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <code className="text-sm font-mono bg-background px-2 py-1 rounded">
                                {header.name}
                              </code>
                              {header.isRequired && <Badge variant="destructive">Required</Badge>}
                              {header.isSecret && <Badge variant="secondary">Secret</Badge>}
                            </div>

                            {header.description && (
                              <p className="text-sm text-muted-foreground mb-2">{header.description}</p>
                            )}

                            <div className="space-y-1 text-xs text-muted-foreground">
                              {header.default && (
                                <div>
                                  <span className="font-medium">Default:</span>
                                  <code className="ml-1 bg-background px-1 rounded">
                                    {header.isSecret ? '••••••••' : header.default}
                                  </code>
                                </div>
                              )}
                              {header.format && (
                                <div>
                                  <span className="font-medium">Format:</span> {header.format}
                                </div>
                              )}
                              {header.choices && header.choices.length > 0 && (
                                <div>
                                  <span className="font-medium">Choices:</span> {header.choices.join(', ')}
                                </div>
                              )}
                            </div>
                          </div>

                          {header.default && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(header.default!, `header-${index}-${headerIndex}`)}
                              className="ml-2"
                            >
                              {copiedText === `header-${index}-${headerIndex}` ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Usage Instructions */}
              <div>
                <h4 className="font-medium mb-2">Usage Instructions</h4>
                <Alert>
                  <Info />
                  <AlertDescription>
                    {remote.type === 'streamable-http' && (
                      <p>This server supports streaming HTTP connections. Use the URL above in your MCP client configuration.</p>
                    )}
                    {remote.type === 'sse' && (
                      <p>This server uses Server-Sent Events (SSE). Connect to the URL above for real-time communication.</p>
                    )}
                    {remote.headers && remote.headers.length > 0 && (
                      <p className="mt-2">
                        <strong>Important:</strong> Include the required authentication headers when connecting to this server.
                      </p>
                    )}
                  </AlertDescription>
                </Alert>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}