"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Copy, Check } from "lucide-react";

interface CopyConfigButtonProps {
  server: any;
}

export function CopyConfigButton({ server }: CopyConfigButtonProps) {
  const [copiedConfig, setCopiedConfig] = useState(false);

  const copyConfig = async () => {
    const serverKey = server.name.replace(/[^a-zA-Z0-9_-]/g, '_');
    const pkg = server.packages?.[0];
    const remote = server.remotes?.[0];
    
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
    <Button 
      className="w-full" 
      variant="outline"
      onClick={copyConfig}
    >
      {copiedConfig ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
      {copiedConfig ? 'Copied!' : 'Copy Basic Config'}
    </Button>
  );
}
