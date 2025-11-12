'use client';

import React from 'react';
import { countries } from '@/utils/countries-list';
import { Icon } from '@iconify/react';
import { SelectItem } from '@/components/ui/select';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useRef } from 'react';

export default function SelectCountryVirtualizer() {
  const parentRef = useRef<HTMLDivElement | null>(null);

  const rowVirtualizer = useVirtualizer({
    count: countries.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 40, // item height
    overscan: 5, // render a few extra items above/below viewport
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
                  // height: `${virtualItem.size}px`,
                  transform: `translateY(${virtualItem.start}px)`,
                }}
              >
                <SelectItem value={String(c.phone)}>
                  <div className="flex justify-between items-center gap-2">
                    <Icon
                      icon={`circle-flags:${c.code.toLowerCase()}`}
                      width="20"
                      height="20"
                    />
                    {/* {} */}
                    {c.name}
                    {`+${c.phone}`}
                  </div>
                </SelectItem>
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
