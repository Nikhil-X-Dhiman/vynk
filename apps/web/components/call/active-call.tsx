import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useCallStore } from '@/store/use-call-store';
import { webRTCManager } from '@/lib/webrtc';
import { Mic, MicOff, PhoneOff, Video, VideoOff } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils/tailwind-helpers';

export function ActiveCall() {
  const {
    callState,
    callType,
    caller,
    callee,
    localStream,
    remoteStream,
    isMuted,
    isVideoEnabled,
    toggleMute,
    toggleVideo,
    endCall
  } = useCallStore();

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const [elapsedTime, setElapsedTime] = useState(0);

  const peer = callState === 'connected' ? (caller || callee) : null;
  // If I am caller, peer is callee. If I am callee, peer is caller.
  // Wait, `caller` and `callee` are set in store.
  // If I initiated, I am not stored as 'caller', the other person is stored as 'callee'.
  // We need to know WHO the other person is.
  // Ideally, useCallStore should resolve 'otherUser'.
  // For now, let's just pick one that isn't null?
  // But both might be non-null if we store full state.
  // Actually, in `startCall` we set `callee`. `caller` is null.
  // In `incomingCall` we set `caller`. `callee` is null (us).
  // So `peer` is `caller || callee`.
  const activePeer = caller || callee;

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (callState === 'connected') {
      interval = setInterval(() => {
        setElapsedTime((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [callState]);

  const handleEndCall = () => {
    webRTCManager.endCall();
    // Socket emit is handled in CallProvider or Manager but store update is here
     // Actually webRTCManager.endCall() calls store.reset() locally.
     // We also need to signal the other user.
     // This is done in CallProvider via Store subscription or callback?
     // Or webRTCManager should handle it.
     // Let's add signal to webRTCManager.endCall().
     // But webRTCManager doesn't know WHO to signal (targetUserId).
     // We can pass it.
     if (activePeer) {
        // We need to retrieve socket from somewhere or pass it to endCall.
        // It's attached to webRTCManager.
        // But endCall needs targetId.
     }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (callState !== 'connected') return null;

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      {/* Remote Stream (Full Screen) */}
      <div className="relative flex-1 bg-black overflow-hidden flex items-center justify-center">
        {remoteStream && callType === 'video' ? (
           <video
             ref={remoteVideoRef}
             autoPlay
             playsInline
             className="w-full h-full object-cover"
           />
        ) : (
          <div className="flex flex-col items-center gap-4">
             <Avatar className="h-32 w-32 border-4 border-muted">
               <AvatarImage src={activePeer?.avatar} />
               <AvatarFallback className="text-4xl">{activePeer?.name?.slice(0, 2).toUpperCase()}</AvatarFallback>
             </Avatar>
             <h2 className="text-2xl font-semibold text-white">{activePeer?.name}</h2>
             <p className="text-white/60">{formatTime(elapsedTime)}</p>
          </div>
        )}

        {/* Local Stream (PIP) */}
        {callType === 'video' && (
          <div className="absolute top-4 right-4 w-32 h-48 bg-gray-900 rounded-xl overflow-hidden shadow-2xl border border-white/10">
             <video
               ref={localVideoRef}
               autoPlay
               playsInline
               muted // Mute local preview
               className="w-full h-full object-cover"
             />
             {!isVideoEnabled && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
                   <VideoOff className="text-white/50" />
                </div>
             )}
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="bg-background/80 backdrop-blur-md p-6 flex justify-center gap-6 pb-8">
         <Button
           size="icon"
           variant={isMuted ? "destructive" : "secondary"}
           className="h-14 w-14 rounded-full"
           onClick={toggleMute}
         >
           {isMuted ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
         </Button>

        {callType === 'video' && (
           <Button
             size="icon"
             variant={!isVideoEnabled ? "destructive" : "secondary"}
             className="h-14 w-14 rounded-full"
             onClick={toggleVideo}
           >
             {!isVideoEnabled ? <VideoOff className="h-6 w-6" /> : <Video className="h-6 w-6" />}
           </Button>
        )}

         <Button
           size="icon"
           variant="destructive"
           className="h-14 w-14 rounded-full bg-red-600 hover:bg-red-700"
           onClick={handleEndCall}
         >
           <PhoneOff className="h-6 w-6" />
         </Button>
      </div>
    </div>
  );
}
