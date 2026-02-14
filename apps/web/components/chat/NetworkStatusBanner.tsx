'use client';

/**
 * @fileoverview Network Status Banner
 *
 * Displays a warning when the user is offline.
 *
 * @module components/chat/NetworkStatusBanner
 */

import { WifiOff } from 'lucide-react';
import { cn } from '@/lib/utils/tailwind-helpers';

interface NetworkStatusBannerProps {
  isOnline: boolean;
}

export function NetworkStatusBanner({ isOnline }: NetworkStatusBannerProps) {
  if (isOnline) return null;

  return (
    <div
      className={cn(
        'flex items-center justify-center gap-2 bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground',
        'animate-in slide-in-from-top-2 fade-in duration-300',
      )}
    >
      <WifiOff className="h-4 w-4" />
      <span>You are offline — messaging is disabled</span>
    </div>
  )
}
