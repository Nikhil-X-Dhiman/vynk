'use client'

/**
 * @fileoverview App Sidebar
 * @module components/layout/Sidebar
 */

import React from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  MessageSquare,
  Phone,
  CircleDashed,
  Settings,
  LogOut,
  User,
  Star,
  Archive,
} from 'lucide-react'
import { authClient } from '@/lib/auth/auth-client'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { SettingsModal } from '@/components/modals/SettingsModal'
import { ModeToggle } from '@/components/ui/ModeToggle'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils/tailwind-helpers'
import { useLoginStore, useAuthStore } from '@/store'
import { SyncService } from '@/lib/services/sync'

interface SidebarItemProps {
  icon: React.ElementType
  label: string
  href?: string
  onClick?: () => void
  isActive?: boolean
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
      type="button"
      variant="ghost"
      size="icon"
      className={cn(
        'h-10 w-10 rounded-lg',
        isActive && 'bg-accent text-accent-foreground',
      )}
      onClick={onClick}
    >
      <Icon
        className="h-6 w-6"
        strokeWidth={2}
      />
      <span className="sr-only">{label}</span>
    </Button>
  )

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        {href ? <Link href={href}>{content}</Link> : content}
      </TooltipTrigger>
      <TooltipContent side="right">
        <p>{label}</p>
      </TooltipContent>
    </Tooltip>
  )
}

export function Sidebar() {
  const router = useRouter()
  const pathname = usePathname()
  const [isSettingsOpen, setIsSettingsOpen] = React.useState(false)
  const resetLogin = useLoginStore((state) => state.reset)
  const resetAuth = useAuthStore((state) => state.reset)

  // Clear stale login state when sidebar mounts (meaning we are authenticated)
  React.useEffect(() => {
    resetLogin()
  }, [resetLogin])

  const handleLogout = async () => {
    try {
      await authClient.signOut({
        fetchOptions: {
          onSuccess: async () => {
            resetLogin()
            resetAuth()
            await SyncService.clearLocalData()
            router.push('/login')
          },
        },
      })
    } catch (error) {
      console.error('Logout failed:', error)
      // Force cleanup anyway
      resetLogin()
      resetAuth()
      router.push('/login')
    }
  }

  return (
    <TooltipProvider delayDuration={0}>
      <div className="flex h-full w-full flex-col items-center justify-between bg-muted/40 py-4 border-r">
        {/* Top Section */}
        <div className="flex flex-col gap-4 items-center">
          <SidebarItem
            icon={MessageSquare}
            label="Chats"
            href="/chats"
            isActive={pathname.startsWith('/chats')}
          />
          <SidebarItem
            icon={CircleDashed}
            label="Status"
            href="/status"
            isActive={pathname.startsWith('/status')}
          />
        </div>

        {/* Bottom Section */}
        <div className="flex flex-col gap-4 items-center">
          <SidebarItem
            icon={Star}
            label="Starred"
          />
          <SidebarItem
            icon={Archive}
            label="Archived"
          />
          <Separator className="w-8" />
          <ModeToggle />
          <Separator className="w-8" />
          <SidebarItem
            icon={Settings}
            label="Settings"
            onClick={() => setIsSettingsOpen(true)}
          />
          <SidebarItem
            icon={User}
            label="Profile"
            href="/profile"
          />
          <SidebarItem
            icon={LogOut}
            label="Logout"
            onClick={handleLogout}
          />
        </div>
      </div>
      <SettingsModal
        open={isSettingsOpen}
        onOpenChange={setIsSettingsOpen}
      />
    </TooltipProvider>
  )
}
