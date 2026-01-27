'use client';

import { usePresenceStore } from '@/store/use-presence-store';
import { MOCK_CHATS } from '@/lib/mock-data';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus } from 'lucide-react';
import { useState, useEffect } from 'react';
import { getUsersByIds } from '@/app/actions/users';
import { useAuthStore } from '@/store/auth';

export function OnlineUsersModal() {
  const { onlineUsers } = usePresenceStore();
  const { user } = useAuthStore();
  const [open, setOpen] = useState(false);
  const [activeUsers, setActiveUsers] = useState<any[]>([]);

  // In a real app, we would fetch User Details for these IDs.
  // For now, we unfortunately relies on MOCK_CHATS or similar source
  // OR we need an endpoint to fetch user details by IDs.
  // As per instructions: "remove the mock data from the app & now show all the online users on the app using redis presence key"
  // We need a way to get their NAMES and AVATARS.
  // The presence key only gives IDs.
  useEffect(() => {
      const fetchUsers = async () => {
          const ids = Object.keys(onlineUsers).filter(id => id !== user?.id);
          if (ids.length > 0) {
              const res = await getUsersByIds(ids);
              if (res.success && res.data) {
                  setActiveUsers(res.data);
              }
          } else {
              setActiveUsers([]);
          }
      };

      if (open) {
          fetchUsers();
      }
  }, [onlineUsers, user?.id, open]);

  // Placeholder: Show IDs or assume fetching happens.
  // const onlineUserIds = Object.keys(onlineUsers).filter(id => id !== user?.id);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-full">
            <Plus className="h-5 w-5" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New Chat - Online Users</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-2 mt-4 max-h-[60vh] overflow-y-auto">
          {activeUsers.length === 0 ? (
            <p className="text-center text-muted-foreground">No active users found.</p>
          ) : (
            activeUsers.map((u) => (
              <div key={u.id} className="flex items-center gap-3 p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg cursor-pointer">
                <Avatar>
                  <AvatarImage src={u.avatar} alt={u.name} className="object-cover" />
                  <AvatarFallback>{u.name?.[0] || 'U'}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                   <h4 className="font-medium text-sm">{u.name || 'Unknown User'}</h4>
                   <span className="text-xs text-green-500">Online</span>
                </div>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
