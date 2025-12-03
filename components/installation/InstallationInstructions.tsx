"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Copy, Check } from "lucide-react";

interface InstallationInstructionsProps {
  server: {
    name: string;
    packages?: any[];
    remotes?: any[];
  };
}

export function InstallationInstructions({ server }: InstallationInstructionsProps) {
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

  // Determine transport type
  const hasStdioPackages = server.packages?.some(pkg => pkg.transport?.type === 'stdio');
  const hasStreamableHttp = server.remotes?.some(remote => remote.type === 'streamable-http');
  const hasSse = server.remotes?.some(remote => remote.type === 'sse');

  const getTransportType = () => {
    if (hasStdioPackages) return 'stdio';
    if (hasStreamableHttp) return 'streamable-http';
    if (hasSse) return 'sse';
    return 'unknown';
  };

  const transportType = getTransportType();

  const renderGenericInstructions = () => {
    switch (transportType) {
      case 'stdio':
        return (
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Package Installation</h4>
              <p className="text-sm text-muted-foreground mb-3">
                Install the package using your preferred package manager:
              </p>
              {server.packages?.map((pkg, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{pkg.registryType}</Badge>
                    <code className="text-sm bg-muted px-2 py-1 rounded">
                      {pkg.identifier}@{pkg.version}
                    </code>
                  </div>
                  {pkg.registryType === 'npm' && (
                    <div className="flex items-center gap-2">
                      <code className="text-sm bg-muted px-2 py-1 rounded flex-1">
                        npm install {pkg.identifier}@{pkg.version}
                      </code>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyToClipboard(`npm install ${pkg.identifier}@{pkg.version}`, 'npm install')}
                      >
                        {copiedText === 'npm install' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                  )}
                  {pkg.registryType === 'pypi' && (
                    <div className="flex items-center gap-2">
                      <code className="text-sm bg-muted px-2 py-1 rounded flex-1">
                        pip install {pkg.identifier}=={pkg.version}
                      </code>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyToClipboard(`pip install ${pkg.identifier}==${pkg.version}`, 'pip install')}
                      >
                        {copiedText === 'pip install' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div>
              <h4 className="font-medium mb-2">Environment Variables</h4>
              <p className="text-sm text-muted-foreground">
                Set the following environment variables if required:
              </p>
              {server.packages?.flatMap(pkg => pkg.environmentVariables || []).map((env: any, index: number) => (
                <div key={index} className="mt-2">
                  <div className="flex items-center gap-2">
                    <code className="text-sm bg-muted px-2 py-1 rounded">
                      {env.name}={env.default || 'YOUR_VALUE'}
                    </code>
                    {env.isRequired && <Badge variant="destructive">Required</Badge>}
                    {env.isSecret && <Badge variant="secondary">Secret</Badge>}
                  </div>
                  {env.description && (
                    <p className="text-xs text-muted-foreground mt-1">{env.description}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        );

      case 'streamable-http':
      case 'sse':
        const remote = server.remotes?.find(r => r.type === transportType);
        return (
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Remote Connection</h4>
              <p className="text-sm text-muted-foreground mb-3">
                Connect to the remote MCP server using {transportType.toUpperCase()}:
              </p>
              <div className="flex items-center gap-2">
                <code className="text-sm bg-muted px-2 py-1 rounded flex-1">
                  {remote?.url}
                </code>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => copyToClipboard(remote?.url || '', 'server URL')}
                >
                  {copiedText === 'server URL' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            {remote?.headers && remote.headers.length > 0 && (
              <div>
                <h4 className="font-medium mb-2">Authentication Headers</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  Include these headers in your requests:
                </p>
                {remote.headers.map((header: any, index: number) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center gap-2">
                      <code className="text-sm bg-muted px-2 py-1 rounded">
                        {header.name}: {header.default || 'YOUR_VALUE'}
                      </code>
                      {header.isRequired && <Badge variant="destructive">Required</Badge>}
                      {header.isSecret && <Badge variant="secondary">Secret</Badge>}
                    </div>
                    {header.description && (
                      <p className="text-xs text-muted-foreground">{header.description}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      default:
        return (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Installation instructions not available for this server type.</p>
          </div>
        );
    }
  };

  const renderClientInstructions = (client: string) => {
    const getClientConfig = () => {
      switch (client) {
        case 'claude-desktop':
          if (transportType === 'stdio') {
            return {
              file: '~/Library/Application Support/Claude/claude_desktop_config.json',
              config: {
                mcpServers: {
                  [server.name.replace('/', '_')]: {
                    command: server.packages?.[0]?.identifier || 'npx',
                    args: server.packages?.[0]?.packageArguments?.map((arg: any) => arg.value) || [],
                    env: server.packages?.[0]?.environmentVariables?.reduce((acc: any, env: any) => {
                      acc[env.name] = env.default || process.env[env.name];
                      return acc;
                    }, {}) || {}
                  }
                }
              }
            };
          } else {
            return {
              file: '~/Library/Application Support/Claude/claude_desktop_config.json',
              config: {
                mcpServers: {
                  [server.name.replace('/', '_')]: {
                    type: transportType,
                    url: server.remotes?.[0]?.url,
                    headers: server.remotes?.[0]?.headers?.reduce((acc: any, header: any) => {
                      acc[header.name] = header.default;
                      return acc;
                    }, {})
                  }
                }
              }
            };
          }

        case 'vscode':
          if (transportType === 'stdio') {
            return {
              file: '.vscode/mcp.json',
              config: {
                servers: {
                  [server.name.replace('/', '_')]: {
                    command: server.packages?.[0]?.identifier || 'npx',
                    args: server.packages?.[0]?.packageArguments?.map((arg: any) => arg.value) || [],
                    env: server.packages?.[0]?.environmentVariables?.reduce((acc: any, env: any) => {
                      acc[env.name] = env.default || process.env[env.name];
                      return acc;
                    }, {}) || {}
                  }
                }
              }
            };
          } else {
            return {
              file: '.vscode/mcp.json',
              config: {
                servers: {
                  [server.name.replace('/', '_')]: {
                    type: transportType,
                    url: server.remotes?.[0]?.url,
                    headers: server.remotes?.[0]?.headers?.reduce((acc: any, header: any) => {
                      acc[header.name] = header.default;
                      return acc;
                    }, {})
                  }
                }
              }
            };
          }

        case 'cursor':
          return {
            file: '.cursor/mcp.json',
            config: transportType === 'stdio' ? {
              mcpServers: {
                [server.name.replace('/', '_')]: {
                  command: server.packages?.[0]?.identifier || 'npx',
                  args: server.packages?.[0]?.packageArguments?.map((arg: any) => arg.value) || [],
                  env: server.packages?.[0]?.environmentVariables?.reduce((acc: any, env: any) => {
                    acc[env.name] = env.default || process.env[env.name];
                    return acc;
                  }, {}) || {}
                }
              }
            } : {
              mcpServers: {
                [server.name.replace('/', '_')]: {
                  type: transportType,
                  url: server.remotes?.[0]?.url,
                  headers: server.remotes?.[0]?.headers?.reduce((acc: any, header: any) => {
                    acc[header.name] = header.default;
                    return acc;
                  }, {})
                }
              }
            }
          };

        default:
          return null;
      }
    };

    const clientConfig = getClientConfig();
    if (!clientConfig) return null;

    const configJson = JSON.stringify(clientConfig.config, null, 2);

    return (
      <div className="space-y-4">
        <div>
          <h4 className="font-medium mb-2">Configuration File</h4>
          <p className="text-sm text-muted-foreground mb-3">
            Add the following configuration to <code className="bg-muted px-1 rounded">{clientConfig.file}</code>:
          </p>
        </div>
        <div className="relative">
          <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
            <code>{configJson}</code>
          </pre>
          <Button
            size="sm"
            variant="outline"
            className="absolute top-2 right-2"
            onClick={() => copyToClipboard(configJson, `${client} config`)}
          >
            {copiedText === `${client} config` ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          </Button>
        </div>
        <div className="text-sm text-muted-foreground">
          <p><strong>Note:</strong> Replace placeholder values with your actual configuration.</p>
        </div>
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Installation Instructions
          <Badge variant="secondary">{transportType}</Badge>
        </CardTitle>
        <CardDescription>
          How to install and configure this MCP server
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="generic" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="generic">Generic</TabsTrigger>
            <TabsTrigger value="claude-desktop">Claude Desktop</TabsTrigger>
            <TabsTrigger value="vscode">VS Code</TabsTrigger>
            <TabsTrigger value="cursor">Cursor</TabsTrigger>
            <TabsTrigger value="other">Other</TabsTrigger>
          </TabsList>

          <TabsContent value="generic" className="mt-4">
            {renderGenericInstructions()}
          </TabsContent>

          <TabsContent value="claude-desktop" className="mt-4">
            {renderClientInstructions('claude-desktop')}
          </TabsContent>

          <TabsContent value="vscode" className="mt-4">
            {renderClientInstructions('vscode')}
          </TabsContent>

          <TabsContent value="cursor" className="mt-4">
            {renderClientInstructions('cursor')}
          </TabsContent>

          <TabsContent value="other" className="mt-4">
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">
                Installation instructions for other MCP clients will be added soon.
              </p>
              <p className="text-sm text-muted-foreground">
                Check the official MCP documentation for client-specific setup guides.
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}