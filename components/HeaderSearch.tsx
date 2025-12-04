'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, X } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SearchDialog } from './SearchDialog';
import { useDebounce } from '@/hooks/use-debounce';

interface ServerSuggestion {
  id: string;
  name: string;
  description: string | null;
  iconUrl: string | null;
}

export function HeaderSearch() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isMobile = useIsMobile();
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<ServerSuggestion[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const containerRef = useRef<HTMLDivElement>(null);
  const selectedItemRef = useRef<HTMLDivElement>(null);

  // Update search term when URL changes
  useEffect(() => {
    const urlSearch = searchParams.get('search') || '';
    setSearchTerm(urlSearch);
  }, [searchParams]);

  // Fetch suggestions when search term changes
  useEffect(() => {
    if (debouncedSearchTerm.length > 0 && !isMobile) {
      setIsLoading(true);
      setIsOpen(true); // Open dropdown immediately when user starts typing
      fetch(`/api/search/autocomplete?q=${encodeURIComponent(debouncedSearchTerm)}`)
        .then(res => res.json())
        .then(data => {
          const newSuggestions = data.suggestions || [];
          setSuggestions(newSuggestions);
          setIsLoading(false);
          // Reset selection when suggestions change
          setSelectedIndex(-1);
        })
        .catch(() => {
          setSuggestions([]);
          setIsLoading(false);
        });
    } else {
      setSuggestions([]);
      setIsOpen(false);
      setIsLoading(false);
    }
  }, [debouncedSearchTerm, isMobile]);

  // Auto-scroll selected item into view
  useEffect(() => {
    if (selectedItemRef.current && selectedIndex >= 0) {
      selectedItemRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
      });
    }
  }, [selectedIndex]);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle input blur to close dropdown after a delay (allows for clicking suggestions)
  const handleInputBlur = () => {
    // Delay closing to allow click events on suggestions
    setTimeout(() => setIsOpen(false), 150);
  };

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    setIsOpen(false);
    setSelectedIndex(-1);
    if (term.trim()) {
      router.push(`/?search=${encodeURIComponent(term.trim())}`);
    } else {
      router.push('/');
    }
  };

  const handleSelect = (serverName: string) => {
    setIsOpen(false);
    setSelectedIndex(-1);
    router.push(`/servers/${encodeURIComponent(serverName)}`);
  };

  const clearSearch = () => {
    setSearchTerm('');
    setSuggestions([]);
    setIsOpen(false);
    setSelectedIndex(-1);
    router.push('/');
  };

  if (isMobile) {
    return (
      <>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsDialogOpen(true)}
          className="p-2"
        >
          <Search className="h-4 w-4" />
        </Button>
        <SearchDialog
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          searchTerm={searchTerm}
          onSearch={handleSearch}
          onClear={clearSearch}
        />
      </>
    );
  }

  return (
    <div ref={containerRef} className="relative flex-1 max-w-md">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search MCP servers..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown') {
              e.preventDefault();
              if (!isOpen && searchTerm.length > 0) {
                setIsOpen(true);
              } else if (isOpen && (suggestions.length > 0 || searchTerm.length > 0)) {
                setSelectedIndex(prev =>
                  prev < suggestions.length ? prev + 1 : prev
                );
              }
            } else if (e.key === 'ArrowUp') {
              e.preventDefault();
              if (isOpen && (suggestions.length > 0 || searchTerm.length > 0)) {
                setSelectedIndex(prev => prev > -1 ? prev - 1 : -1);
              }
            } else if (e.key === 'Enter') {
              e.preventDefault();
              if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
                // Navigate to selected server
                handleSelect(suggestions[selectedIndex].name);
              } else if (selectedIndex === suggestions.length) {
                // Perform search action
                handleSearch(searchTerm);
              } else {
                // Default search
                handleSearch(searchTerm);
              }
            } else if (e.key === 'Escape') {
              setIsOpen(false);
              setSelectedIndex(-1);
            }
          }}
          onFocus={() => {
            if (searchTerm.length > 0) {
              setIsOpen(true);
            }
          }}
          onBlur={handleInputBlur}
          className="pl-10 pr-10"
          autoComplete="off"
        />
        {searchTerm && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearSearch}
            className="absolute right-1 top-1/2 transform -translate-y-1/2 p-1 h-6 w-6"
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>

      {/* Autocomplete Dropdown */}
      {isOpen && debouncedSearchTerm.length > 0 && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-popover border border-border rounded-md shadow-md max-h-64 overflow-y-auto min-w-[400px] max-w-[600px]">
          {isLoading && suggestions.length === 0 && (
            <div className="px-3 py-2 text-sm text-muted-foreground">
              Searching...
            </div>
          )}
          {suggestions.length === 0 && !isLoading && (
            <div className="px-3 py-2 text-sm text-muted-foreground">
              No servers found.
            </div>
          )}
          {suggestions.length > 0 && (
            <div className="py-1">
              <div className="px-3 py-1 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Servers
              </div>
              {suggestions.map((server, index) => (
                <div
                  key={server.id}
                  ref={index === selectedIndex ? selectedItemRef : null}
                  onClick={() => handleSelect(server.name)}
                  className={`flex items-center px-3 py-2 cursor-pointer ${
                    index === selectedIndex
                      ? 'bg-accent text-accent-foreground'
                      : 'hover:bg-accent/50'
                  }`}
                >
                  <img
                    src={server.iconUrl || '/mcp.png'}
                    alt=""
                    className="w-4 h-4 mr-2 rounded flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate text-sm">{server.name}</div>
                    {server.description && (
                      <div className="text-xs text-muted-foreground truncate">
                        {server.description}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
          {searchTerm && (
            <div className="border-t border-border">
              <div className="px-3 py-1 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Actions
              </div>
              <div
                ref={selectedIndex === suggestions.length ? selectedItemRef : null}
                onClick={() => handleSearch(searchTerm)}
                className={`flex items-center px-3 py-2 cursor-pointer ${
                  selectedIndex === suggestions.length
                    ? 'bg-accent text-accent-foreground'
                    : 'hover:bg-accent/50'
                }`}
              >
                <Search className="w-4 h-4 mr-2" />
                <span className="text-sm">Search for "{searchTerm}"</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}