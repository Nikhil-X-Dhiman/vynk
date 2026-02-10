'use client';

/**
 * @fileoverview Chat header with avatar, name, and action buttons.
 * @module components/chat/ChatHeader
 */

import {
  MoreVertical,
  Search,
  Phone,
  Video,
  ArrowLeft,
} from 'lucide-react';
import { useCallStore } from '@/store/use-call-store';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import Link from 'next/link';
import { normalizeAvatarUrl } from '@/lib/utils/avatar';
import type { ConversationInfo } from './types';

interface ChatHeaderProps {
  conversationInfo: ConversationInfo | null;
}

/**
 * Header bar for the chat window showing conversation name, avatar,
 * and call/search/menu actions.
 */
export function ChatHeader({ conversationInfo }: ChatHeaderProps) {
  const { startCall } = useCallStore();

  const name = conversationInfo?.name || 'Loading...';
  const avatar = conversationInfo?.avatar;

  const handleStartCall = (type: 'audio' | 'video') => {
    if (!conversationInfo?.otherUserId) return;

    startCall(
      {
        id: conversationInfo.otherUserId,
        name,
        avatar: avatar ?? undefined,
      },
      type,
    );
  };

  return (
    <div className="flex items-center justify-between border-b bg-muted/40 px-4 py-2">
      <div className="flex items-center gap-3">
        {/* Back button — mobile only */}
        <Link href="/chats" className="md:hidden">
          <Button variant="ghost" size="icon" className="rounded-full">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>

        <Avatar>
          <AvatarImage
            src={normalizeAvatarUrl(avatar) || undefined}
            alt={name}
            className="object-cover"
          />
          <AvatarFallback>{name?.[0]?.toUpperCase() || '?'}</AvatarFallback>
        </Avatar>

        <div>
          <h3 className="font-semibold text-sm">{name}</h3>
          <p className="text-xs text-muted-foreground" />
        </div>
      </div>

      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full"
          onClick={() => handleStartCall('video')}
        >
          <Video className="h-5 w-5 text-muted-foreground" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full"
          onClick={() => handleStartCall('audio')}
        >
          <Phone className="h-5 w-5 text-muted-foreground" />
        </Button>

        <Separator orientation="vertical" className="h-6 mx-2" />

        <Button variant="ghost" size="icon" className="rounded-full">
          <Search className="h-5 w-5 text-muted-foreground" />
        </Button>
        <Button variant="ghost" size="icon" className="rounded-full">
          <MoreVertical className="h-5 w-5 text-muted-foreground" />
        </Button>
      </div>
    </div>
  );
}
