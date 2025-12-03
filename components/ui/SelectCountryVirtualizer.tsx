'use client';

import { countries } from '@/utils/countries-list';
import { useVirtualizer } from '@tanstack/react-virtual';
import Image from 'next/image';
import { useRef } from 'react';

interface SelectCountryVirtualizerProps {
  onSelectCountry: (code: string) => void;
}

export default function SelectCountryVirtualizer({
  onSelectCountry,
}: SelectCountryVirtualizerProps) {
  const parentRef = useRef<HTMLDivElement | null>(null);

  const rowVirtualizer = useVirtualizer({
    count: countries.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 40, // item height
    overscan: 10, // render a few extra items above/below viewport
  });
  return (
    <>
      <div
        ref={parentRef}
        className="list"
        style={{
          height: '300px',
          width: '200px',
          overflow: 'auto',
          transform: 'translateZ(0)',
        }}
      >
        <div
          style={{
            height: `${rowVirtualizer.getTotalSize()}px`,
            position: 'relative',
            contain: 'layout paint',
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
                  transform: `translate3d(0, ${virtualItem.start}px, 0)`,
                  willChange: 'transform',
                }}
              >
                <button
                  onClick={() => onSelectCountry(`+${c.phone}`)}
                  className="flex w-full items-center justify-between px-2 py-1 hover:bg-accent hover:text-accent-foreground text-sm transition-colors"
                >
                  <div className="flex gap-2 min-w-0">
                    <Image
                      src={`https://cdn.jsdelivr.net/npm/circle-flags/flags/${c.code.toLowerCase()}.svg`}
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src =
                          '/flags/default.svg';
                      }}
                      style={{ flexShrink: 0 }}
                      width={20}
                      height={20}
                      alt={c.name}
                    />
                    <span className="flex-1 truncate">{c.name}</span>
                  </div>
                  <span className="text-xs">+{c.phone}</span>
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
