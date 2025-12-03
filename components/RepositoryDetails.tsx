"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ExternalLink, Github, GitBranch, FolderOpen, Info } from "lucide-react";

interface RepositoryInfo {
  url: string;
  source: string;
  id?: string;
  subfolder?: string;
}

interface RepositoryDetailsProps {
  repository: RepositoryInfo | null;
}

export function RepositoryDetails({ repository }: RepositoryDetailsProps) {
  if (!repository) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center text-muted-foreground">
            <Github className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No repository information available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getSourceIcon = (source: string) => {
    switch (source.toLowerCase()) {
      case 'github':
        return <Github className="h-4 w-4" />;
      case 'gitlab':
        return <GitBranch className="h-4 w-4" />;
      default:
        return <ExternalLink className="h-4 w-4" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {getSourceIcon(repository.source)}
          Repository Information
        </CardTitle>
        <CardDescription>
          Source code and documentation for this MCP server
        </CardDescription>
      </CardHeader>

      <CardContent>
        <div className="space-y-4">
          {/* Repository URL */}
          <div>
            <h4 className="font-medium mb-2">Repository URL</h4>
            <div className="flex items-center gap-2">
              <a
                href={repository.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline flex items-center gap-2"
              >
                {getSourceIcon(repository.source)}
                <span className="break-all">{repository.url}</span>
                <ExternalLink className="h-4 w-4 flex-shrink-0" />
              </a>
            </div>
          </div>

          {/* Repository Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium mb-2">Source Platform</h4>
              <Badge variant="outline" className="flex items-center gap-1 w-fit">
                {getSourceIcon(repository.source)}
                {repository.source}
              </Badge>
            </div>

            {repository.id && (
              <div>
                <h4 className="font-medium mb-2">Repository ID</h4>
                <code className="text-sm bg-muted px-2 py-1 rounded">
                  {repository.id}
                </code>
              </div>
            )}
          </div>

          {/* Subfolder Information */}
          {repository.subfolder && (
            <div>
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <FolderOpen className="h-4 w-4" />
                Subfolder Path
              </h4>
              <div className="bg-muted p-3 rounded-lg">
                <code className="text-sm">{repository.subfolder}</code>
                <p className="text-xs text-muted-foreground mt-1">
                  This MCP server is located in a subdirectory of the repository
                </p>
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div>
            <h4 className="font-medium mb-2">Quick Actions</h4>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" asChild>
                <a
                  href={repository.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2"
                >
                  <ExternalLink className="h-4 w-4" />
                  View Repository
                </a>
              </Button>

              {repository.source.toLowerCase() === 'github' && (
                <>
                  <Button variant="outline" size="sm" asChild>
                    <a
                      href={`${repository.url}/issues`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2"
                    >
                      Issues
                    </a>
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <a
                      href={`${repository.url}/pulls`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2"
                    >
                      Pull Requests
                    </a>
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Usage Instructions */}
          <Alert>
            <Info />
            <AlertDescription>
              <p>
                <strong>Contributing:</strong> Found a bug or want to contribute? Visit the repository above to report issues, submit pull requests, or contribute to the development of this MCP server.
              </p>
              {repository.subfolder && (
                <p className="mt-2">
                  <strong>Note:</strong> The MCP server code is located in the <code className="bg-muted px-1 rounded text-xs">{repository.subfolder}</code> directory.
                </p>
              )}
            </AlertDescription>
          </Alert>
        </div>
      </CardContent>
    </Card>
  );
}