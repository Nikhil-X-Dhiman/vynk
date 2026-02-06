import { z } from 'zod';

// =============================================================================
// Message
// =============================================================================

export const messageContentSchema = z
  .string()
  .trim()
  .min(1, 'Message cannot be empty')
  .max(5000, 'Message is too long');

export const messageSchema = z.object({
  conversationId: z.string().uuid(),
  content: messageContentSchema.optional(),
  mediaUrl: z.string().url().optional(),
  mediaType: z.enum(['text', 'image', 'video', 'file']).optional(),
  replyTo: z.string().uuid().optional(),
});

export type MessageInput = z.infer<typeof messageSchema>;

// =============================================================================
// Conversation
// =============================================================================

export const conversationSchema = z.object({
  name: z.string().trim().min(1).max(100).optional(),
  type: z.enum(['private', 'group']),
  participantIds: z.array(z.string().uuid()).min(1),
  groupImg: z.string().url().optional(),
  groupDesc: z.string().max(500).optional(),
});

export type ConversationInput = z.infer<typeof conversationSchema>;

// =============================================================================
// Story
// =============================================================================

export const storySchema = z.object({
  type: z.enum(['text', 'image', 'video', 'file']),
  contentUrl: z.string().url().optional(),
  caption: z.string().max(200).optional(),
  text: z.string().max(500).optional(),
});

export type StoryInput = z.infer<typeof storySchema>;

// =============================================================================
// Reaction
// =============================================================================

export const reactionSchema = z.object({
  targetId: z.string().uuid(),
  emoji: z.string().emoji(),
});

export type ReactionInput = z.infer<typeof reactionSchema>;
