import { useMemo, useState } from 'react';
import countries from '@/lib/data/countries.json';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Button } from '../ui/button';
import { ChevronsUpDown } from 'lucide-react';
import { Command, CommandInput } from '../ui/command';
import { Virtuoso } from 'react-virtuoso';
import Image from 'next/image';

type Country = {
  name: string;
  code: string; // "IN", "US"
  phone: number; // 91, 1, etc
};

type CountrySelectProps = {
  value: Country | null;
  onChange: (country: Country) => void;
};

function CountrySelect({ value, onChange }: CountrySelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

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
  return (
    <>
      <Popover
        open={open}
        onOpenChange={setOpen}
      >
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            className="w-full justify-between"
          >
            {value ? value.name : 'Select Country'}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="p-0 w-75">
          <Command shouldFilter={false}>
            <CommandInput
              placeholder="Search Country"
              value={search}
              onValueChange={setSearch}
            />
            <div className="h-75">
              <Virtuoso
                data={filtered}
                itemContent={(_, country) => (
                  // <div
                  //   className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-accent"
                  //   key={country.code}
                  //   onClick={() => {
                  //     onChange(country);
                  //     setOpen(false);
                  //   }}
                  // >
                  //   <span>{country.}</span>
                  //   <span>{country.name}</span>

                  //   {value?.code === country.code && (
                  //     <Check className="ml-auto h-4 w-4" />
                  //   )}
                  // </div>
                  <div
                    className="flex items-center gap-2 w-full"
                    key={country.code}
                    onClick={() => {
                      onChange(country);
                      setOpen(false);
                    }}
                  >
                    <Image
                      src={`https://cdn.jsdelivr.net/npm/circle-flags/flags/${country.code.toLowerCase()}.svg`}
                      alt={country.name}
                      width={20}
                      height={20}
                      className="shrink-0"
                      // unoptimized // Optional: skip next/image optimization for CDN svgs
                    />
                    <span className="flex-1 truncate">{country.name}</span>
                    <span className="text-muted-foreground text-xs">
                      +{country.phone}
                    </span>
                    {/* {Number(field.state.value) ===
                    country.phone && (
                    <Check className="h-4 w-4 ml-auto" />
                  )} */}
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
