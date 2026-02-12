'use client'

import React, { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { SyncService } from '@/lib/services/sync'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

interface SettingsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SettingsModal({ open, onOpenChange }: SettingsModalProps) {
  const [isResetting, setIsResetting] = useState(false)

  const handleResetSync = async () => {
    setIsResetting(true)
    try {
      await SyncService.forceResync()
      toast.success('App data reset and sync started successfully')
      onOpenChange(false)
      // Optional: Refresh the page or redirect to ensure clean state if needed,
      // but forceResync updates IndexedDB which hooks should pick up.
      // However, a reload is often safer for a full "reset" feeling.
      // window.location.reload()
    } catch (error) {
      console.error('Reset sync failed:', error)
      toast.error('Failed to reset app data')
    } finally {
      setIsResetting(false)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent className="sm:max-w-106.25">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>
            Manage your application settings and preferences.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <div className="space-y-4">
            <div className="rounded-lg border p-4 bg-muted/50">
              <h3 className="font-medium mb-1">Troubleshooting</h3>
              <p className="text-sm text-muted-foreground mb-4">
                If you are experiencing issues with missing messages or sync
                errors, you can reset the local database. This will redownload
                all your data from the server.
              </p>
              <Button
                variant="destructive"
                onClick={handleResetSync}
                disabled={isResetting}
                className="w-full sm:w-auto"
              >
                {isResetting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Resetting...
                  </>
                ) : (
                  'Reset Sync & Data'
                )}
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isResetting}
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
