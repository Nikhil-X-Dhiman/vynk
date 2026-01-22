import { Socket } from 'socket.io';
import { createStory } from '@repo/db';
import { chatNamespace } from '../server';
import { SOCKET_EVENTS } from '@repo/shared';

function registerStoryEvents(socket: Socket) {
  const userId = socket.data.user.id;

  socket.on(SOCKET_EVENTS.STORY_PUBLISH, async (payload) => {
    try {
      const { mediaUrl, type, caption, text, expiresAt } = payload;

      // Fix: Pass object as required by DB function
      const result = await createStory({
          userId,
          contentUrl: mediaUrl,
          type,
          caption,
          text,
          expiresAt
      });

      if (result.success) {
         socket.broadcast.emit(SOCKET_EVENTS.STORY_PUBLISH, {
             story: { ...payload, id: 'temp_id' }, // Ideally DB returns the story object
             userId
         });
      }
    } catch (error) {
      console.error('Error handling STORY_PUBLISH:', error);
    }
  });
}

export { registerStoryEvents };
