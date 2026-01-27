import React, { useMemo, useState, useRef, useEffect } from 'react';
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
const CountryItem = React.memo(({
  country,
  index,
  isFocused,
  onClick
}: {
  country: typeof countries[0],
  index: number,
  isFocused: boolean,
  onClick: () => void
}) => {
  return (
    <div
      className={`flex items-center gap-2 w-full px-3 py-2 hover:bg-accent cursor-pointer transform-gpu transition-colors ${
        isFocused ? 'bg-accent' : ''
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
        className="shrink-0"
        onError={(e) => {
          (e.currentTarget as HTMLImageElement).src = '/assets/flags/default.svg';
        }}
      />
      <span className="flex-1 truncate font-medium text-sm">{country.name}</span>
      <span className="text-muted-foreground text-xs tabular-nums">
        +{country.phone}
      </span>
    </div>
  );
});

CountryItem.displayName = 'CountryItem';

function CountrySelect({ value, onChange }: CountrySelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [focusedIndex, setFocusedIndex] = useState(0);
  const virtuosoRef = useRef<VirtuosoHandle>(null);

  const selectedCountry = useMemo(() => {
    if (!value) return null;
    return countries.find((c) => c.code === value) || null;
  }, [value]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
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
  }, [search]);

  // Scroll to focused index when popover opens or focus changes
  useEffect(() => {
    if (!open || !virtuosoRef.current) return;

    // Use requestAnimationFrame to ensure the popover has started rendering
    // and to avoid blocking the opening animation.
    const rafId = requestAnimationFrame(() => {
        virtuosoRef.current?.scrollToIndex({
            index: focusedIndex,
            align: 'center',
            behavior: 'auto'
        });
    });

    return () => cancelAnimationFrame(rafId);
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
          className="w-full justify-between"
        >
          {selectedCountry ? (
            <div className="flex items-center gap-2">
              <img
                src={`https://cdn.jsdelivr.net/npm/circle-flags/flags/${selectedCountry.code.toLowerCase()}.svg`}
                alt=""
                width={20}
                height={20}
                decoding="async"
                className="shrink-0"
              />
              <span className="flex-1 truncate font-medium">{selectedCountry.name}</span>
              <span className="text-muted-foreground text-sm tabular-nums">
                +{selectedCountry.phone}
              </span>
            </div>
          ) : (
            'Select Country'
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0 w-[300px]" align="start">
        <Command
          shouldFilter={false}
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown') {
              e.preventDefault();
              setFocusedIndex((prev) => Math.min(prev + 1, filtered.length - 1));
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
          />
          <div className="h-[300px] transform-gpu overflow-hidden">
            <Virtuoso
              ref={virtuosoRef}
              data={filtered}
              increaseViewportBy={300} // Balanced for initial open speed
              overscan={10} // Number of items, lighter than before
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
          </div>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export { CountrySelect };
