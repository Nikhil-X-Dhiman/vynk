'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  MessageSquare,
  Phone,
  CircleDashed,
  Settings,
  LogOut,
  User,
  Star,
  Archive,
} from 'lucide-react';
import { signOutAction } from '@/app/actions/auth-actions';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { ModeToggle } from '@/components/ui/ModeToggle';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils/tailwind-helpers';

interface SidebarItemProps {
  icon: React.ElementType;
  label: string;
  href?: string;
  onClick?: () => void;
  isActive?: boolean;
}

const SidebarItem = ({
  icon: Icon,
  label,
  href,
  onClick,
  isActive,
}: SidebarItemProps) => {
  const content = (
    <Button
      variant="ghost"
      size="icon"
      className={cn(
        'h-10 w-10 rounded-lg',
        isActive && 'bg-accent text-accent-foreground'
      )}
      onClick={onClick}
    >
      <Icon className="h-6 w-6" strokeWidth={2} />
      <span className="sr-only">{label}</span>
    </Button>
  );

  const wrappedContent = (
    <Tooltip>
      <TooltipTrigger asChild>{href ? <Link href={href}>{content}</Link> : content}</TooltipTrigger>
      <TooltipContent side="right">
        <p>{label}</p>
      </TooltipContent>
    </Tooltip>
  );

  return wrappedContent;
};

export function Sidebar() {
  const pathname = usePathname();

  const handleLogout = async () => {
    await signOutAction();
  };

  return (
    <TooltipProvider delayDuration={0}>
      <div className="flex h-full w-full flex-col items-center justify-between bg-muted/40 py-4 border-r">
        {/* Top Section */}
        <div className="flex flex-col gap-4 items-center">
          {/* Chats */}
          <SidebarItem
            icon={MessageSquare}
            label="Chats"
            href="/chats"
            isActive={pathname.startsWith('/chats')}
          />
          {/* Calls */}
          <SidebarItem
            icon={Phone}
            label="Calls"
            href="/calls"
            isActive={pathname.startsWith('/calls')}
          />
          {/* Status */}
          <SidebarItem
            icon={CircleDashed}
            label="Status"
            href="/status"
            isActive={pathname.startsWith('/status')}
          />
        </div>

        {/* Bottom Section */}
        <div className="flex flex-col gap-4 items-center">
          <SidebarItem icon={Star} label="Starred" />
          <SidebarItem icon={Archive} label="Archived" />
          <Separator className="w-8" />
          <ModeToggle />
          <Separator className="w-8" />
          <SidebarItem icon={Settings} label="Settings" href="/settings" />
          <SidebarItem icon={User} label="Profile" href="/profile" />
          <SidebarItem icon={LogOut} label="Logout" onClick={handleLogout} />
        </div>
      </div>
    </TooltipProvider>
  );
}
