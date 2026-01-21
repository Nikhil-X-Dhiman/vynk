import { createStory } from '@repo/db';
import { SOCKET_EVENTS } from '@repo/shared';
import { Socket } from 'socket.io';

function registerStoryEvents(socket: Socket) {
  const userId = socket.data.user.id;

  socket.on(SOCKET_EVENTS.STORY_PUBLISH, async (payload) => {
    try {
      const result = await createStory({ ...payload, userId });

      if (result.success) {
        socket.broadcast.emit(SOCKET_EVENTS.STORY_NEW, {
          story: payload, // Ideally send the Created Story object if returned, but payload+ID is okay for now if full object needed
        });
      } else {
         console.error('Failed to publish story:', result.error);
      }
    } catch (error) {
      console.error('Error handling STORY_PUBLISH:', error);
    }
  });
}

// TODO: Here, i am emitting to all the users but add the support of only sending to the contacts or friends...only they know or see the story
// TODO: Here, the commented code is to get the user friend list & then send event of story to only those in containing the list

export { registerStoryEvents };
