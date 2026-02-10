/**
 * @fileoverview Country Select Component
 *
 * A virtualized, searchable country selector built on Radix Popover + cmdk.
 * Displays country flags (via circle-flags CDN), names, and phone codes.
 *
 * Uses `react-virtuoso` for efficient rendering of ~250 countries and
 * `useDeferredValue` to keep the search input responsive during filtering.
 *
 * @module components/login/CountrySelect
 */

'use client';

import React, {
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { ChevronsUpDown } from 'lucide-react';
import { Virtuoso, type VirtuosoHandle } from 'react-virtuoso';

import countries from '@/lib/data/countries.json';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Button } from '../ui/button';
import { Command, CommandInput } from '../ui/command';

// ==========================================
// Types
// ==========================================

/** Shape of a single entry in the countries JSON data. */
type Country = (typeof countries)[number];

/** Props accepted by the `CountrySelect` component. */
type CountrySelectProps = {
  /** Currently selected ISO 3166-1 alpha-2 code (e.g. "US", "IN"). */
  value: string | null;
  /** Callback fired with the selected ISO code. */
  onChange: (code: string) => void;
};

// ==========================================
// Constants
// ==========================================

/** Height of each country row in the virtualized list (px). */
const ITEM_HEIGHT = 44;

/** Height of the scrollable list container (px). */
const LIST_HEIGHT = 300;

/** Extra viewport buffer for smoother scrolling (px). */
const VIEWPORT_OVERSCAN = 300;

/** CDN base URL for circular country flag SVGs. */
const FLAG_CDN = 'https://cdn.jsdelivr.net/npm/circle-flags/flags';

/** Fallback flag path when the CDN image fails to load. */
const FLAG_FALLBACK = '/assets/flags/default.svg';

/** Delay (ms) before scrolling to focus index after popover opens. */
const SCROLL_DELAY_MS = 50;

// ==========================================
// Helpers
// ==========================================

/** Returns the CDN URL for a country flag given its ISO code. */
function getFlagUrl(isoCode: string): string {
  return `${FLAG_CDN}/${isoCode.toLowerCase()}.svg`;
}

/** Handles flag load errors by swapping to the fallback image. */
function handleFlagError(e: React.SyntheticEvent<HTMLImageElement>): void {
  e.currentTarget.src = FLAG_FALLBACK;
}

/** Normalises a search query for country matching. */
function normalizeQuery(raw: string): string {
  return raw.trim().toLowerCase();
}

/** Returns `true` if the country matches the given search query. */
function matchesQuery(country: Country, query: string): boolean {
  return (
    country.name.toLowerCase().includes(query) ||
    country.code.toLowerCase().includes(query) ||
    String(country.phone).includes(query) ||
    `+${country.phone}`.includes(query)
  );
}

// ==========================================
// Sub-components
// ==========================================

/** Renders the flag + name + phone code for a single country. */
function CountryDisplay({ country }: { country: Country }) {
  return (
    <>
      <img
        src={getFlagUrl(country.code)}
        alt=""
        width={20}
        height={20}
        loading="lazy"
        decoding="async"
        className="shrink-0 rounded-full shadow-sm"
        onError={handleFlagError}
      />
      <span className="flex-1 truncate text-sm font-semibold tracking-tight">
        {country.name}
      </span>
      <span className="text-xs tabular-nums font-mono text-muted-foreground">
        +{country.phone}
      </span>
    </>
  );
}

/** Single row in the virtualized country list. */
const CountryItem = React.memo(function CountryItem({
  country,
  isFocused,
  onClick,
}: {
  country: Country;
  isFocused: boolean;
  onClick: () => void;
}) {
  return (
    <div
      role="option"
      aria-selected={isFocused}
      aria-label={`${country.name} +${country.phone}`}
      className={`flex items-center gap-3 w-full px-4 py-2 cursor-pointer transform-gpu transition-colors duration-150 border-l-2 ${
        isFocused
          ? 'bg-indigo-500/10 border-indigo-500 text-indigo-700 dark:text-indigo-300'
          : 'hover:bg-accent border-transparent'
      }`}
      style={{ height: ITEM_HEIGHT, contain: 'content' }}
      onClick={onClick}
    >
      <CountryDisplay country={country} />
    </div>
  );
});

/** Empty-state message shown when the search yields no results. */
function EmptyState() {
  return (
    <div className="flex h-full flex-col items-center justify-center p-8 text-center animate-in fade-in duration-300">
      <p className="text-sm font-semibold text-foreground/80">
        No results found
      </p>
      <p className="mt-1 text-xs text-muted-foreground">
        Try a different country name or dial code.
      </p>
    </div>
  );
}

// ==========================================
// Hooks
// ==========================================

/**
 * Filters the countries list against a deferred search value.
 * Keeps the input responsive while the filtered list updates async.
 */
function useFilteredCountries(search: string) {
  const deferred = useDeferredValue(search);

  return useMemo(() => {
    const query = normalizeQuery(deferred);
    if (!query) return countries as Country[];
    return (countries as Country[]).filter((c) => matchesQuery(c, query));
  }, [deferred]);
}

/**
 * Scrolls the virtualized list to the given `focusedIndex`
 * whenever the popover is open and the index changes.
 */
function useScrollToFocused(
  ref: React.RefObject<VirtuosoHandle | null>,
  focusedIndex: number,
  isOpen: boolean,
) {
  useEffect(() => {
    if (!isOpen || !ref.current) return;

    const id = setTimeout(() => {
      ref.current?.scrollToIndex({
        index: focusedIndex,
        align: 'center',
        behavior: 'auto',
      });
    }, SCROLL_DELAY_MS);

    return () => clearTimeout(id);
  }, [focusedIndex, isOpen, ref]);
}

// ==========================================
// Main Component
// ==========================================

/**
 * Searchable, virtualized country selector.
 *
 * Supports keyboard navigation (↑ / ↓ / Enter), search by name,
 * ISO code, or phone code, and emits the selected ISO code via `onChange`.
 */
function CountrySelect({ value, onChange }: CountrySelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [focusedIndex, setFocusedIndex] = useState(0);
  const virtuosoRef = useRef<VirtuosoHandle>(null);

  const filtered = useFilteredCountries(search);

  const selectedCountry = useMemo<Country | null>(() => {
    if (!value) return null;
    return (countries as Country[]).find((c) => c.code === value) ?? null;
  }, [value]);

  useScrollToFocused(virtuosoRef, focusedIndex, open);

  // --- Callbacks (stable references) ---

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      setOpen(nextOpen);

      if (nextOpen) {
        // Reset search and focus the currently-selected country
        setSearch('');
        const idx = (countries as Country[]).findIndex((c) => c.code === value);
        setFocusedIndex(idx >= 0 ? idx : 0);
      }
    },
    [value],
  );

  const handleSelect = useCallback(
    (country: Country) => {
      onChange(country.code);
      setOpen(false);
    },
    [onChange],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (filtered.length === 0) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setFocusedIndex((prev) => Math.min(prev + 1, filtered.length - 1));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setFocusedIndex((prev) => Math.max(prev - 1, 0));
          break;
        case 'Enter': {
          e.preventDefault();
          const country = filtered[focusedIndex];
          if (country) handleSelect(country);
          break;
        }
      }
    },
    [filtered, focusedIndex, handleSelect],
  );

  // --- Render ---

  return (
    <Popover
      open={open}
      onOpenChange={handleOpenChange}
    >
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between cursor-pointer focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-200"
        >
          {selectedCountry ? (
            <div className="flex items-center gap-2">
              <CountryDisplay country={selectedCountry} />
            </div>
          ) : (
            <span className="text-muted-foreground">Select Country</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>

      <PopoverContent
        className="w-[300px] overflow-hidden p-0"
        align="start"
      >
        <Command
          shouldFilter={false}
          onKeyDown={handleKeyDown}
        >
          <CommandInput
            placeholder="Search Country"
            value={search}
            onValueChange={setSearch}
            className="border-0 focus:ring-0"
          />

          <div
            role="listbox"
            className="transform-gpu overflow-hidden"
            style={{ height: LIST_HEIGHT }}
          >
            {filtered.length === 0 ? (
              <EmptyState />
            ) : (
              <Virtuoso
                ref={virtuosoRef}
                data={filtered}
                increaseViewportBy={VIEWPORT_OVERSCAN}
                overscan={10}
                itemContent={(index, country) => (
                  <CountryItem
                    country={country}
                    isFocused={focusedIndex === index}
                    onClick={() => handleSelect(country)}
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
export type { CountrySelectProps, Country };
