import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { useCallStore } from '@/store/use-call-store';
import { Phone, PhoneOff, Video } from 'lucide-react';
import { useEffect, useState } from 'react';

export function CallModal() {
  const { callState, caller, callee, callType, acceptCall, rejectCall, endCall } = useCallStore();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setIsOpen(callState === 'incoming' || callState === 'outgoing');
  }, [callState]);

  if (callState === 'idle' || callState === 'connected' || callState === 'ended') return null;

  const isIncoming = callState === 'incoming';
  const user = isIncoming ? caller : callee;

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md border-none bg-transparent shadow-none p-0 flex justify-center">
        <div className="bg-background/90 backdrop-blur-xl border p-6 rounded-2xl flex flex-col items-center gap-6 w-80 shadow-2xl">
          <div className="flex flex-col items-center gap-2">
            <Avatar className="h-24 w-24 border-4 border-muted/50">
              <AvatarImage src={user?.avatar} />
              <AvatarFallback className="text-2xl">{user?.name?.slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <h3 className="text-xl font-semibold mt-2">{user?.name}</h3>
            <p className="text-sm text-muted-foreground animate-pulse">
              {isIncoming ? (callType === 'video' ? 'Incoming Video Call...' : 'Incoming Audio Call...') : 'Calling...'}
            </p>
          </div>

          <div className="flex items-center gap-6">
            {isIncoming ? (
              <>
                <Button
                  size="icon"
                  variant="destructive"
                  className="h-14 w-14 rounded-full shadow-lg"
                  onClick={rejectCall}
                >
                  <PhoneOff className="h-6 w-6" />
                </Button>
                <Button
                  size="icon"
                  className="h-14 w-14 rounded-full bg-green-500 hover:bg-green-600 shadow-lg"
                  onClick={acceptCall}
                >
                  {callType === 'video' ? <Video className="h-6 w-6" /> : <Phone className="h-6 w-6" />}
                </Button>
              </>
            ) : (
              <Button
                size="icon"
                variant="destructive"
                className="h-14 w-14 rounded-full shadow-lg"
                onClick={endCall}
              >
                <PhoneOff className="h-6 w-6" />
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
