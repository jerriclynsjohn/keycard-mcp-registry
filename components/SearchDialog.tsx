'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X } from 'lucide-react';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Button } from '@/components/ui/button';
import { useDebounce } from '@/hooks/use-debounce';

interface SearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  searchTerm: string;
  onSearch: (term: string) => void;
  onClear: () => void;
}

interface ServerSuggestion {
  id: string;
  name: string;
  description: string | null;
  iconUrl: string | null;
}

export function SearchDialog({ open, onOpenChange, searchTerm, onSearch, onClear }: SearchDialogProps) {
  const router = useRouter();
  const [query, setQuery] = useState(searchTerm);
  const [suggestions, setSuggestions] = useState<ServerSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const debouncedQuery = useDebounce(query, 300);

  useEffect(() => {
    if (debouncedQuery.length > 0) {
      setIsLoading(true);
      fetch(`/api/search/autocomplete?q=${encodeURIComponent(debouncedQuery)}`)
        .then(res => res.json())
        .then(data => {
          setSuggestions(data.suggestions || []);
          setIsLoading(false);
        })
        .catch(() => {
          setSuggestions([]);
          setIsLoading(false);
        });
    } else {
      setSuggestions([]);
    }
  }, [debouncedQuery]);

  const handleSelect = (serverName: string) => {
    onOpenChange(false);
    router.push(`/servers/${encodeURIComponent(serverName)}`);
  };

  const handleSearch = () => {
    if (query.trim()) {
      onSearch(query.trim());
      onOpenChange(false);
    }
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <div className="flex items-center border-b px-3">
        <CommandInput
          placeholder="Search MCP servers..."
          value={query}
          onValueChange={setQuery}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleSearch();
            }
          }}
        />
        {query && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setQuery('');
              onClear();
            }}
            className="ml-2 p-1"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
      <CommandList>
        <CommandEmpty>
          {isLoading ? 'Searching...' : 'No servers found.'}
        </CommandEmpty>
        {suggestions.length > 0 && (
          <CommandGroup heading="Servers">
            {suggestions.map((server) => (
              <CommandItem
                key={server.id}
                value={server.name}
                onSelect={() => handleSelect(server.name)}
              >
                <img
                  src={server.iconUrl || '/mcp.png'}
                  alt=""
                  className="w-4 h-4 mr-2 rounded"
                />
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{server.name}</div>
                  {server.description && (
                    <div className="text-sm text-muted-foreground truncate">
                      {server.description}
                    </div>
                  )}
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
        {query && (
          <CommandGroup heading="Actions">
            <CommandItem onSelect={handleSearch}>
              <Search className="w-4 h-4 mr-2" />
              Search for "{query}"
            </CommandItem>
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  );
}