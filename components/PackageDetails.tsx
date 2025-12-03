"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Package, Settings, Key, Terminal, ExternalLink } from "lucide-react";

interface PackageInfo {
  registryType: string;
  registryBaseUrl: string;
  identifier: string;
  version: string;
  fileSha256?: string;
  runtimeHint?: string;
  transport: any;
  runtimeArguments?: any[];
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
}

interface PackageDetailsProps {
  packages: PackageInfo[];
}

export function PackageDetails({ packages }: PackageDetailsProps) {
  if (!packages || packages.length === 0) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center text-muted-foreground">
            <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No packages available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {packages.map((pkg, index) => {
        return (
          <Card key={`${pkg.registryType}-${pkg.identifier}-${pkg.version}`}>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Package className="h-5 w-5 text-primary" />
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    {pkg.identifier}
                    <Badge variant="secondary">{pkg.registryType}</Badge>
                    <Badge variant="outline">v{pkg.version}</Badge>
                  </CardTitle>
                  <CardDescription>
                    {pkg.registryBaseUrl && (
                      <a
                        href={pkg.registryBaseUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-primary hover:underline"
                      >
                        {pkg.registryBaseUrl}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </CardDescription>
                </div>
                {pkg.runtimeHint && (
                  <Badge variant="outline" className="text-xs ml-auto">
                    {pkg.runtimeHint}
                  </Badge>
                )}
              </div>
            </CardHeader>

            <CardContent>
                  <div className="space-y-6">
                    {/* Transport Information */}
                    <div>
                      <h4 className="font-medium mb-3 flex items-center gap-2">
                        <Settings className="h-4 w-4" />
                        Transport Configuration
                      </h4>
                      <div className="bg-muted p-3 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="secondary">{pkg.transport?.type || 'stdio'}</Badge>
                          {pkg.transport?.url && (
                            <code className="text-sm bg-background px-2 py-1 rounded">
                              {pkg.transport.url}
                            </code>
                          )}
                        </div>
                        {pkg.fileSha256 && (
                          <div className="text-xs text-muted-foreground">
                            SHA-256: <code className="bg-background px-1 rounded">{pkg.fileSha256}</code>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Environment Variables */}
                    {pkg.environmentVariables && pkg.environmentVariables.length > 0 && (
                      <div>
                        <h4 className="font-medium mb-3 flex items-center gap-2">
                          <Key className="h-4 w-4" />
                          Environment Variables ({pkg.environmentVariables.length})
                        </h4>
                        <div className="space-y-2">
                          {pkg.environmentVariables.map((env, envIndex) => (
                            <div key={envIndex} className="border rounded-lg p-3 bg-muted/30">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <code className="text-sm font-mono bg-background px-2 py-1 rounded">
                                      {env.name}
                                    </code>
                                    {env.isRequired && <Badge variant="destructive">Required</Badge>}
                                    {env.isSecret && <Badge variant="secondary">Secret</Badge>}
                                  </div>
                                  {env.description && (
                                    <p className="text-sm text-muted-foreground mb-2">{env.description}</p>
                                  )}
                                  {env.default && (
                                    <div className="text-xs text-muted-foreground">
                                      Default: <code className="bg-background px-1 rounded">{env.default}</code>
                                    </div>
                                  )}
                                  {env.format && (
                                    <div className="text-xs text-muted-foreground">
                                      Format: {env.format}
                                    </div>
                                  )}
                                  {env.choices && env.choices.length > 0 && (
                                    <div className="text-xs text-muted-foreground">
                                      Choices: {env.choices.join(', ')}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Arguments */}
                    {(pkg.runtimeArguments || pkg.packageArguments) && (
                      <div>
                        <h4 className="font-medium mb-3 flex items-center gap-2">
                          <Terminal className="h-4 w-4" />
                          Command Arguments
                        </h4>
                        <div className="space-y-3">
                          {pkg.runtimeArguments && pkg.runtimeArguments.length > 0 && (
                            <div>
                              <h5 className="text-sm font-medium mb-2">Runtime Arguments</h5>
                              <div className="bg-muted p-3 rounded-lg">
                                <code className="text-sm">
                                  {pkg.runtimeArguments.map((arg: any) => {
                                    if (arg.type === 'positional') {
                                      return arg.value || arg.valueHint || 'value';
                                    } else if (arg.type === 'named') {
                                      return `${arg.name}=${arg.value || 'value'}`;
                                    }
                                    return arg.value || 'arg';
                                  }).join(' ')}
                                </code>
                              </div>
                            </div>
                          )}

                          {pkg.packageArguments && pkg.packageArguments.length > 0 && (
                            <div>
                              <h5 className="text-sm font-medium mb-2">Package Arguments</h5>
                              <div className="bg-muted p-3 rounded-lg">
                                <code className="text-sm">
                                  {pkg.packageArguments.map((arg: any) => {
                                    if (arg.type === 'positional') {
                                      return arg.value || arg.valueHint || 'value';
                                    } else if (arg.type === 'named') {
                                      return `${arg.name}=${arg.value || 'value'}`;
                                    }
                                    return arg.value || 'arg';
                                  }).join(' ')}
                                </code>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}