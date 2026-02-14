'use client';

/**
 * @fileoverview Chat Header
 * @module components/chat/ChatHeader
 */

import { MoreVertical, Search, Phone, Video, ArrowLeft } from 'lucide-react'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import Link from 'next/link';
import { normalizeAvatarUrl } from '@/lib/utils/avatar';
import type { ConversationInfo } from './types';

interface ChatHeaderProps {
  conversationInfo: ConversationInfo | null;
}

export function ChatHeader({ conversationInfo }: ChatHeaderProps) {
  const name = conversationInfo?.name || 'Loading...'
  const avatar = conversationInfo?.avatar

  const handleStartCall = (_type: 'audio' | 'video') => {
    // Call feature coming soon
    console.log(`${_type} call coming soon`)
  }

  return (
    <div className="flex shrink-0 items-center justify-between border-b bg-muted/40 px-4 py-2 h-16">
      <div className="flex items-center gap-3">
        {/* Mobile Back Button */}
        <Link
          href="/chats"
          className="md:hidden"
        >
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>

        {/* Avatar & Name */}
        <div className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity">
          <Avatar>
            <AvatarImage
              src={normalizeAvatarUrl(avatar) || undefined}
              alt={name}
              className="object-cover"
            />
            <AvatarFallback>{name?.[0]?.toUpperCase() || '?'}</AvatarFallback>
          </Avatar>

          <div>
            <h3 className="font-semibold text-sm leading-tight">{name}</h3>
            {/* Optional status text (e.g. 'Online', 'Last seen...') - omitted for now */}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full text-muted-foreground"
          onClick={() => handleStartCall('video')}
        >
          <Video className="h-5 w-5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full text-muted-foreground"
          onClick={() => handleStartCall('audio')}
        >
          <Phone className="h-5 w-5" />
        </Button>

        <Separator
          orientation="vertical"
          className="h-6 mx-2"
        />

        <Button
          variant="ghost"
          size="icon"
          className="rounded-full text-muted-foreground"
        >
          <Search className="h-5 w-5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full text-muted-foreground"
        >
          <MoreVertical className="h-5 w-5" />
        </Button>
      </div>
    </div>
  )
}
