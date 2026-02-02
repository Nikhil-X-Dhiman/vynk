import React, {
  useMemo,
  useState,
  useRef,
  useEffect,
  useDeferredValue,
} from 'react';
import countries from '@/lib/data/countries.json';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Button } from '../ui/button';
import { ChevronsUpDown } from 'lucide-react';
import { Command, CommandInput } from '../ui/command';
import { Virtuoso, VirtuosoHandle } from 'react-virtuoso';

type CountrySelectProps = {
  value: string | null; // ISO code string, e.g., "US", "IN"
  onChange: (code: string) => void;
};

// Memoized Item for maximum performance during scrolling/opening
const CountryItem = React.memo(
  ({
    country,
    index,
    isFocused,
    onClick,
  }: {
    country: (typeof countries)[0];
    index: number;
    isFocused: boolean;
    onClick: () => void;
  }) => {
    return (
      <div
        className={`flex items-center gap-3 w-full px-4 py-2 cursor-pointer transform-gpu transition-all duration-200 border-l-2 ${
          isFocused
            ? 'bg-indigo-500/10 border-indigo-500 text-indigo-700 dark:text-indigo-300'
            : 'hover:bg-accent border-transparent'
        }`}
        style={{ height: '44px', contain: 'content' }}
        onClick={onClick}
      >
        <img
          src={`https://cdn.jsdelivr.net/npm/circle-flags/flags/${country.code.toLowerCase()}.svg`}
          alt=""
          width={20}
          height={20}
          loading="lazy"
          decoding="async"
          className="shrink-0 rounded-full shadow-sm"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).src =
              '/assets/flags/default.svg';
          }}
        />
        <span className="flex-1 truncate font-semibold text-sm tracking-tight">
          {country.name}
        </span>
        <span className="text-muted-foreground text-xs tabular-nums font-mono">
          +{country.phone}
        </span>
      </div>
    );
  },
);

CountryItem.displayName = 'CountryItem';

function CountrySelect({ value, onChange }: CountrySelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [focusedIndex, setFocusedIndex] = useState(0);
  const virtuosoRef = useRef<VirtuosoHandle>(null);

  const deferredSearch = useDeferredValue(search);

  const selectedCountry = useMemo(() => {
    if (!value) return null;
    return countries.find((c) => c.code === value) || null;
  }, [value]);

  const filtered = useMemo(() => {
    const query = deferredSearch.trim().toLowerCase();
    if (!query) return countries;

    return countries.filter((c) => {
      const countryName = c.name.toLowerCase();
      const countryCode = c.phone.toString();
      const countryISO = c.code.toLowerCase();

      return (
        countryName.includes(query) ||
        countryCode.includes(query) ||
        countryISO.includes(query) ||
        `+${countryCode}`.includes(query)
      );
    });
  }, [deferredSearch]);

  // Scroll to focused index when popover opens or focus changes
  useEffect(() => {
    if (!open || !virtuosoRef.current) return;

    // Small delay to ensure the UI has updated with filtered results
    const timeoutId = setTimeout(() => {
      virtuosoRef.current?.scrollToIndex({
        index: focusedIndex,
        align: 'center',
        behavior: 'auto',
      });
    }, 50);

    return () => clearTimeout(timeoutId);
  }, [focusedIndex, open]);

  return (
    <Popover
      open={open}
      onOpenChange={(newOpen) => {
        setOpen(newOpen);
        if (newOpen) {
          const idx = filtered.findIndex((c) => c.code === value);
          setFocusedIndex(idx >= 0 ? idx : 0);
        }
      }}
    >
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          className="w-full justify-between cursor-pointer focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-200"
        >
          {selectedCountry ? (
            <div className="flex items-center gap-2">
              <img
                src={`https://cdn.jsdelivr.net/npm/circle-flags/flags/${selectedCountry.code.toLowerCase()}.svg`}
                alt=""
                width={20}
                height={20}
                decoding="async"
                className="shrink-0 rounded-full shadow-sm"
              />
              <span className="flex-1 truncate font-semibold">
                {selectedCountry.name}
              </span>
              <span className="text-muted-foreground text-sm tabular-nums font-mono">
                +{selectedCountry.phone}
              </span>
            </div>
          ) : (
            <span className="text-muted-foreground">Select Country</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="p-0 w-[300px] overflow-hidden"
        align="start"
      >
        <Command
          shouldFilter={false}
          onKeyDown={(e) => {
            if (filtered.length === 0) return;
            if (e.key === 'ArrowDown') {
              e.preventDefault();
              setFocusedIndex((prev) =>
                Math.min(prev + 1, filtered.length - 1),
              );
            } else if (e.key === 'ArrowUp') {
              e.preventDefault();
              setFocusedIndex((prev) => Math.max(prev - 1, 0));
            } else if (e.key === 'Enter') {
              e.preventDefault();
              const country = filtered[focusedIndex];
              if (country) {
                onChange(country.code); // Emit ISO code
                setOpen(false);
              }
            }
          }}
        >
          <CommandInput
            placeholder="Search Country"
            value={search}
            onValueChange={setSearch}
            className="focus:ring-0 border-0"
          />
          <div className="h-[300px] transform-gpu overflow-hidden">
            {filtered.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center p-8 text-center animate-in fade-in duration-300">
                <p className="text-sm font-semibold text-foreground/80">
                  No results found
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Try searching for a different country name or code.
                </p>
              </div>
            ) : (
              <Virtuoso
                ref={virtuosoRef}
                data={filtered}
                increaseViewportBy={300}
                overscan={10}
                totalCount={filtered.length}
                itemContent={(index, country) => (
                  <CountryItem
                    country={country}
                    index={index}
                    isFocused={focusedIndex === index}
                    onClick={() => {
                      onChange(country.code); // Emit ISO code
                      setOpen(false);
                    }}
                  />
                )}
              />
            )}
          </div>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export { CountrySelect };
