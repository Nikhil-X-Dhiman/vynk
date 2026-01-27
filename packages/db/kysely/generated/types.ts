import type { ColumnType } from "kysely";
export type Generated<T> = T extends ColumnType<infer S, infer I, infer U>
  ? ColumnType<S, I | undefined, U>
  : ColumnType<T, T | undefined, T>;
export type Timestamp = ColumnType<Date, Date | string, Date | string>;

export const ConversationType = {
    private: "private",
    group: "group",
    broadcast: "broadcast"
} as const;
export type ConversationType = (typeof ConversationType)[keyof typeof ConversationType];
export const Role = {
    member: "member",
    admin: "admin"
} as const;
export type Role = (typeof Role)[keyof typeof Role];
export const Media = {
    text: "text",
    image: "image",
    video: "video",
    file: "file"
} as const;
export type Media = (typeof Media)[keyof typeof Media];
export const Status = {
    pending: "pending",
    sent: "sent",
    delivered: "delivered",
    seen: "seen"
} as const;
export type Status = (typeof Status)[keyof typeof Status];
export type Conversation = {
    id: string;
    type: ConversationType;
    title: string | null;
    last_message_id: string | null;
    created_by: string;
    group_img: string | null;
    group_bio: Generated<string | null>;
    created_at: Generated<Timestamp>;
    updated_at: Timestamp;
};
export type Delivery = {
    id: string;
    message_id: string;
    user_id: string;
    status: Generated<Status | null>;
    created_at: Generated<Timestamp>;
    updated_at: Timestamp;
};
export type Message = {
    id: string;
    conversation_id: string;
    sender_id: string;
    media_type: Generated<Media | null>;
    media_url: string | null;
    content: string | null;
    reply_to: string | null;
    is_deleted: Generated<boolean | null>;
    created_at: Generated<Timestamp>;
    updated_at: Timestamp;
};
export type Participant = {
    id: string;
    conversation_id: string;
    user_id: string;
    role: Generated<Role | null>;
    last_read_message_id: string | null;
    unread_count: Generated<number>;
    joined_at: Generated<Timestamp>;
    updated_at: Timestamp;
};
export type Reaction = {
    id: string;
    message_id: string | null;
    story_id: string | null;
    user_id: string;
    emoji: string | null;
    created_at: Generated<Timestamp>;
};
export type Settings = {
    id: string;
    user_id: string;
    theme: Generated<string>;
    notifications: Generated<boolean>;
    sound_enabled: Generated<boolean>;
    created_at: Generated<Timestamp>;
    updated_at: Timestamp;
};
export type Story = {
    id: string;
    type: Generated<Media | null>;
    content_url: string | null;
    user_id: string;
    caption: string | null;
    text: string | null;
    expires_at: Timestamp | null;
    created_at: Generated<Timestamp>;
};
export type StoryView = {
    id: string;
    user_id: string;
    story_id: string;
    viewed_at: Generated<Timestamp>;
    reaction: string | null;
    created_at: Generated<Timestamp>;
    updated_at: Timestamp;
};
export type User = {
    id: string;
    phone_number: string;
    country_code: string;
    user_name: string;
    email: string | null;
    avatar_url: Generated<string | null>;
    bio: Generated<string | null>;
    is_verified: Generated<boolean | null>;
    re_consent: Generated<boolean | null>;
    created_at: Generated<Timestamp>;
    updated_at: Timestamp;
};
export type DB = {
    conversation: Conversation;
    delivery: Delivery;
    message: Message;
    participant: Participant;
    reaction: Reaction;
    settings: Settings;
    story: Story;
    story_view: StoryView;
    user: User;
};
