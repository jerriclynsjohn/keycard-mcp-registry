"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Copy, Check, AlertCircle } from "lucide-react";

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



  const renderClientInstructions = (client: string) => {
    const getClientConfig = () => {
      const serverKey = server.name.replace(/[^a-zA-Z0-9_-]/g, '_');

      switch (client) {
        case 'claude-desktop':
          if (transportType === 'stdio') {
            const pkg = server.packages?.[0];
            const command = pkg?.runtimeHint || 'npx';
            const args = pkg?.runtimeHint === 'npx' 
              ? [pkg?.identifier, ...(pkg?.packageArguments || []).map((arg: any) => arg.value || arg)]
              : [pkg?.identifier, ...(pkg?.packageArguments || []).map((arg: any) => arg.value || arg)].filter(Boolean);
            
            return {
              file: '~/Library/Application Support/Claude/claude_desktop_config.json',
              instructions: [
                '1. Open Claude Desktop',
                '2. Go to Settings → Developer → Edit Config',
                '3. Add the server configuration to the mcpServers object'
              ],
              config: {
                mcpServers: {
                  [serverKey]: {
                    command,
                    args,
                    ...(pkg?.environmentVariables && pkg.environmentVariables.length > 0 && {
                      env: pkg.environmentVariables.reduce((acc: any, env: any) => {
                        acc[env.name] = env.default || `YOUR_${env.name}`;
                        return acc;
                      }, {})
                    })
                  }
                }
              }
            };
          } else {
            const remote = server.remotes?.find(r => r.type === transportType);
            return {
              file: '~/Library/Application Support/Claude/claude_desktop_config.json',
              instructions: [
                '1. Open Claude Desktop',
                '2. Go to Settings → Developer → Edit Config',
                '3. Add the server configuration to the mcpServers object'
              ],
              config: {
                mcpServers: {
                  [serverKey]: {
                    type: transportType,
                    url: remote?.url,
                    headers: remote?.headers?.reduce((acc: any, header: any) => {
                      acc[header.name] = header.default || `YOUR_${header.name}`;
                      return acc;
                    }, {})
                  }
                }
              }
            };
          }

        case 'vscode':
          if (transportType === 'stdio') {
            const pkg = server.packages?.[0];
            const command = pkg?.runtimeHint || 'npx';
            const args = pkg?.runtimeHint === 'npx' 
              ? [pkg?.identifier, ...(pkg?.packageArguments || []).map((arg: any) => arg.value || arg)]
              : [pkg?.identifier, ...(pkg?.packageArguments || []).map((arg: any) => arg.value || arg)].filter(Boolean);
            
            return {
              file: '.vscode/mcp.json',
              instructions: [
                '1. Create .vscode/mcp.json in your workspace root',
                '2. Add the server configuration',
                '3. Reload VS Code window'
              ],
              config: {
                servers: {
                  [serverKey]: {
                    command,
                    args,
                    ...(pkg?.environmentVariables && pkg.environmentVariables.length > 0 && {
                      env: pkg.environmentVariables.reduce((acc: any, env: any) => {
                        acc[env.name] = env.default || `YOUR_${env.name}`;
                        return acc;
                      }, {})
                    })
                  }
                }
              }
            };
          } else {
            const remote = server.remotes?.find(r => r.type === transportType);
            return {
              file: '.vscode/mcp.json',
              instructions: [
                '1. Create .vscode/mcp.json in your workspace root',
                '2. Add the server configuration',
                '3. Reload VS Code window'
              ],
              config: {
                servers: {
                  [serverKey]: {
                    type: transportType,
                    url: remote?.url,
                    headers: remote?.headers?.reduce((acc: any, header: any) => {
                      acc[header.name] = header.default || `YOUR_${header.name}`;
                      return acc;
                    }, {})
                  }
                }
              }
            };
          }

        case 'cursor':
          if (transportType === 'stdio') {
            const pkg = server.packages?.[0];
            const command = pkg?.runtimeHint || 'npx';
            const args = pkg?.runtimeHint === 'npx' 
              ? [pkg?.identifier, ...(pkg?.packageArguments || []).map((arg: any) => arg.value || arg)]
              : [pkg?.identifier, ...(pkg?.packageArguments || []).map((arg: any) => arg.value || arg)].filter(Boolean);
            
            return {
              file: '.cursor/mcp.json',
              instructions: [
                '1. Create .cursor/mcp.json in your workspace root',
                '2. Add the server configuration',
                '3. Reload Cursor window'
              ],
              config: {
                mcpServers: {
                  [serverKey]: {
                    command,
                    args,
                    ...(pkg?.environmentVariables && pkg.environmentVariables.length > 0 && {
                      env: pkg.environmentVariables.reduce((acc: any, env: any) => {
                        acc[env.name] = env.default || `YOUR_${env.name}`;
                        return acc;
                      }, {})
                    })
                  }
                }
              }
            };
          } else {
            const remote = server.remotes?.find(r => r.type === transportType);
            return {
              file: '.cursor/mcp.json',
              instructions: [
                '1. Create .cursor/mcp.json in your workspace root',
                '2. Add the server configuration',
                '3. Reload Cursor window'
              ],
              config: {
                mcpServers: {
                  [serverKey]: {
                    type: transportType,
                    url: remote?.url,
                    headers: remote?.headers?.reduce((acc: any, header: any) => {
                      acc[header.name] = header.default || `YOUR_${header.name}`;
                      return acc;
                    }, {})
                  }
                }
              }
            };
          }

        case 'lm-studio':
          if (transportType === 'stdio') {
            const pkg = server.packages?.[0];
            const command = pkg?.runtimeHint || 'npx';
            const args = pkg?.runtimeHint === 'npx' 
              ? [pkg?.identifier, ...(pkg?.packageArguments || []).map((arg: any) => arg.value || arg)]
              : [pkg?.identifier, ...(pkg?.packageArguments || []).map((arg: any) => arg.value || arg)].filter(Boolean);
            
            return {
              file: 'mcp.json',
              instructions: [
                '1. Open LM Studio',
                '2. Go to Local Server → Chat Settings → MCP',
                '3. Add the server configuration'
              ],
              config: {
                mcpServers: {
                  [serverKey]: {
                    command,
                    args,
                    ...(pkg?.environmentVariables && pkg.environmentVariables.length > 0 && {
                      env: pkg.environmentVariables.reduce((acc: any, env: any) => {
                        acc[env.name] = env.default || `YOUR_${env.name}`;
                        return acc;
                      }, {})
                    })
                  }
                }
              }
            };
          } else {
            const remote = server.remotes?.find(r => r.type === transportType);
            return {
              file: 'mcp.json',
              instructions: [
                '1. Open LM Studio',
                '2. Go to Local Server → Chat Settings → MCP',
                '3. Add the server configuration'
              ],
              config: {
                mcpServers: {
                  [serverKey]: {
                    type: transportType,
                    url: remote?.url,
                    headers: remote?.headers?.reduce((acc: any, header: any) => {
                      acc[header.name] = header.default || `YOUR_${header.name}`;
                      return acc;
                    }, {})
                  }
                }
              }
            };
          }

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
          <h4 className="font-medium mb-2">Setup Instructions for {client.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}</h4>
          <div className="space-y-1 mb-4">
            {clientConfig.instructions.map((instruction, index) => (
              <p key={index} className="text-sm text-muted-foreground">
                {instruction}
              </p>
            ))}
          </div>
        </div>

        <div>
          <p className="text-sm text-muted-foreground mb-3">
            Configuration file: <code className="bg-muted px-1 rounded">{clientConfig.file}</code>
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

        <Alert>
          <AlertCircle />
          <AlertDescription>
            <strong>Important:</strong> Replace placeholder values (like YOUR_API_KEY) with your actual configuration values.
          </AlertDescription>
        </Alert>
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
        <Tabs defaultValue="claude-desktop" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="claude-desktop">Claude</TabsTrigger>
            <TabsTrigger value="vscode">VS Code</TabsTrigger>
            <TabsTrigger value="cursor">Cursor</TabsTrigger>
            <TabsTrigger value="lm-studio">LM Studio</TabsTrigger>
          </TabsList>

          <TabsContent value="claude-desktop" className="mt-4">
            {renderClientInstructions('claude-desktop')}
          </TabsContent>

          <TabsContent value="vscode" className="mt-4">
            {renderClientInstructions('vscode')}
          </TabsContent>

          <TabsContent value="cursor" className="mt-4">
            {renderClientInstructions('cursor')}
          </TabsContent>

          <TabsContent value="lm-studio" className="mt-4">
            {renderClientInstructions('lm-studio')}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}