import { useMemo, useState, useRef, useEffect } from 'react';
import countries from '@/lib/data/countries.json';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Button } from '../ui/button';
import { ChevronsUpDown } from 'lucide-react';
import { Command, CommandInput } from '../ui/command';
import { Virtuoso, VirtuosoHandle } from 'react-virtuoso';
import Image from 'next/image';

type CountrySelectProps = {
  value: string | null; // phone code as string, e.g., "91"
  onChange: (code: string) => void;
};

function CountrySelect({ value, onChange }: CountrySelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [focusedIndex, setFocusedIndex] = useState(0);
  const virtuosoRef = useRef<VirtuosoHandle>(null);

  const selectedCountry = useMemo(() => {
    if (!value) return null;
    return countries.find((c) => c.phone.toString() === value) || null;
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

  useEffect(() => {
    if (virtuosoRef.current) {
      virtuosoRef.current.scrollToIndex({
        index: focusedIndex,
        align: 'center',
      });
    }
  }, [focusedIndex]);
  return (
    <>
      <Popover
        open={open}
        onOpenChange={(newOpen) => {
          setOpen(newOpen);
          if (newOpen) {
            const idx = filtered.findIndex((c) => c.phone.toString() === value);
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
                <Image
                  src={`https://cdn.jsdelivr.net/npm/circle-flags/flags/${selectedCountry.code.toLowerCase()}.svg`}
                  alt={selectedCountry.name}
                  width={20}
                  height={20}
                  className="shrink-0"
                />
                <span className="flex-1 truncate">{selectedCountry.name}</span>
                <span className="text-muted-foreground text-sm">
                  +{selectedCountry.phone}
                </span>
              </div>
            ) : (
              'Select Country'
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="p-0 w-75">
          <Command
            shouldFilter={false}
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown') {
                e.preventDefault();
                setFocusedIndex((prev) =>
                  Math.min(prev + 1, filtered.length - 1)
                );
              } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setFocusedIndex((prev) => Math.max(prev - 1, 0));
              } else if (e.key === 'Enter') {
                e.preventDefault();
                const country = filtered[focusedIndex];
                if (country) {
                  onChange(country.phone.toString());
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
            <div className="h-75">
              <Virtuoso
                ref={virtuosoRef}
                style={{ paddingTop: '8px', paddingBottom: '8px' }}
                data={filtered}
                itemContent={(index, country) => (
                  <div
                    className={`flex items-center gap-2 w-full p-2 hover:bg-accent cursor-pointer transform-gpu ${
                      focusedIndex === index ? 'bg-accent' : ''
                    }`}
                    key={country.code}
                    onClick={() => {
                      onChange(country.phone.toString());
                      setOpen(false);
                    }}
                  >
                    <Image
                      src={`https://cdn.jsdelivr.net/npm/circle-flags/flags/${country.code.toLowerCase()}.svg`}
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src =
                          '/assets/flags/default.svg';
                      }}
                      alt={country.name}
                      width={20}
                      height={20}
                      className="shrink-0"
                    />
                    <span className="flex-1 truncate">{country.name}</span>
                    <span className="text-muted-foreground text-xs">
                      +{country.phone}
                    </span>
                  </div>
                )}
              />
            </div>
          </Command>
        </PopoverContent>
      </Popover>
    </>
  );
}

export { CountrySelect };
