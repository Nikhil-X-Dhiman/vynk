import { createStory } from '@repo/db';
import { SOCKET_EVENTS } from '@repo/shared';
import { Socket } from 'socket.io';

function registerStoryEvents(socket: Socket) {
  const userId = socket.data.user.id;

  socket.on(SOCKET_EVENTS.STORY_PUBLISH, async (payload) => {
    const story = createStory({ ...payload, userId });
    //     const contacts = await getUserContacts(userId);
    //     const rooms = contacts.map(c => `user:${c.id}`);
    //     rooms.push(`user:${userId}`);
    // io.to(rooms).emit(SOCKET_EVENTS.STORY_NEW, story);
    socket.broadcast.emit(SOCKET_EVENTS.STORY_NEW, {
      story,
    });
  });
}

// TODO: Here, i am emitting to all the users but add the support of only sending to the contacts or friends...only they know or see the story
// TODO: Here, the commented code is to get the user friend list & then send event of story to only those in containing the list

export { registerStoryEvents };
