'use client';

/**
 * @fileoverview Network status banner for the chat list.
 *
 * Shows an animated "Network unavailable" banner when offline.
 * Smoothly disappears when connectivity is restored.
 *
 * @module components/chat/NetworkStatusBanner
 */

import { WifiOff } from 'lucide-react';
import { cn } from '@/lib/utils/tailwind-helpers';

interface NetworkStatusBannerProps {
  isOnline: boolean;
}

/**
 * Animated banner that appears at the top of the chat list when offline.
 */
export function NetworkStatusBanner({ isOnline }: NetworkStatusBannerProps) {
  if (isOnline) return null;

  return (
    <div
      className={cn(
        'flex items-center justify-center gap-2 bg-destructive/90 px-4 py-2 text-sm font-medium text-destructive-foreground',
        'animate-in slide-in-from-top-2 fade-in duration-300',
      )}
    >
      <WifiOff className="h-4 w-4" />
      <span>Network unavailable — messages will be sent when reconnected</span>
    </div>
  );
}
