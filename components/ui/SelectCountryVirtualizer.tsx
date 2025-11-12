'use client';

import { countries } from '@/utils/countries-list';
import { Icon } from '@iconify/react';
import { useVirtualizer } from '@tanstack/react-virtual';
import Image from 'next/image';
import { useRef } from 'react';

export default function SelectCountryVirtualizer() {
  const parentRef = useRef<HTMLDivElement | null>(null);

  const rowVirtualizer = useVirtualizer({
    count: countries.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 40, // item height
    overscan: 8, // render a few extra items above/below viewport
    scrollElementOptions: { fps: 60 },
  });
  // const virtualItems = rowVirtualizer.getVirtualItems();
  return (
    <>
      <div
        ref={parentRef}
        className="list"
        style={{ height: '300px', width: '200px', overflow: 'auto' }}
      >
        <div
          style={{
            height: `${rowVirtualizer.getTotalSize()}px`,
            position: 'relative',
          }}
        >
          {rowVirtualizer.getVirtualItems().map((virtualItem) => {
            const c = countries[virtualItem.index];
            return (
              <div
                key={virtualItem.key}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: `${virtualItem.size}px`,
                  transform: `translateY(${virtualItem.start}px)`,
                  willChange: 'transform',
                }}
              >
                <button
                  onClick={() => handleSelect(c.phone.toString())}
                  className="flex w-full items-center gap-2 px-2 py-1 hover:bg-accent hover:text-accent-foreground text-sm transition-colors"
                >
                  {/* <Icon
                    icon={`circle-flags:${c.code.toLowerCase()}`}
                    width="20"
                    height="20"
                  /> */}
                  <Image
                    src={`https://cdn.jsdelivr.net/npm/circle-flags/flags/${c.code.toLowerCase()}.svg`}
                    width={20}
                    height={20}
                    // loading="lazy"
                    alt={c.name}
                  />
                  <span className="flex-1 truncate">{c.name}</span>
                  <span className="text-muted-foreground text-xs">
                    +{c.phone}
                  </span>
                </button>
                {/* <SelectItem value={String(c.phone)}>
                  <div className="flex justify-between items-center gap-2">
                    <Icon
                      icon={`circle-flags:${c.code.toLowerCase()}`}
                      width="20"
                      height="20"
                    /> */}
                {/* {} */}
                {/* {c.name}
                    {`+${c.phone}`}
                  </div>
                </SelectItem> */}
              </div>
            );
          })}
        </div>
      </div>
      {/* {countries.map((c) => (
        <SelectItem key={c.code} value={String(c.phone)}>
          <>
            <Icon
              icon={`circle-flags:${c.code.toLowerCase()}`}
              width="512"
              height="512"
            />
            {}
            {`+${c.phone}`}
          </>
        </SelectItem>
      ))} */}
    </>
  );
}
