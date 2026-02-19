export interface DeviceSession {
    sessionId: string;
    userAgent: string;
    loginTime: number;
    lastActive: number;
}

export interface User {
    id: string; // Firebase UID
    username: string;
    email: string;
    joinedGroups: string[];
    mutedGroups: string[];
    following: string[]; // User IDs
    followers: string[]; // User IDs
    lastUsernameChange?: number; // timestamp
    sessions?: DeviceSession[];
    unreadCount: number;
}

export interface UserCredentials {
    email: string;
    password?: string;
}

export interface Reaction {
    emoji: string;
    userIds: string[];
}

export interface ReplyMetadata {
    messageId: string;
    text: string;
    sender: string;
}

export interface FileMetadata {
    type: string;
    url: string;
    name: string;
    size: number;
}

export type MessageStatus = 'sent' | 'delivered' | 'seen';

export interface Message {
    id: string;
    sender: string;
    senderId: string;
    text: string;
    timestamp: any; // number | Timestamp
    type: 'text' | 'image' | 'video' | 'pdf' | 'doc' | 'audio' | 'system';
    media?: FileMetadata;
    reactions: Reaction[];
    replyTo?: ReplyMetadata;
    status?: MessageStatus; // For personal chats
    readBy?: string[]; // For group chats
}

export interface Group {
    id: string;
    name: string;
    category: string;
    image: string; // Emoji
    members: number;
    memberCount: number;
    memberIds: string[];
    createdAt: number;
    createdBy: string;
    description?: string;
    lastActivity: number;
    mutedBy: string[];
    unreadCounts?: { [userId: string]: number };
    lastMessage?: string;
}

export interface FollowRequest {
    id: string;
    fromId: string;
    fromUsername: string;
    toId: string;
    status: 'pending' | 'accepted' | 'declined';
    timestamp: number;
    updatedAt?: number;
}

export interface Notification {
    id: string;
    userId: string;
    type: 'message' | 'mention' | 'reply' | 'follow_request' | 'follow_accept' | 'system' | 'friends';
    groupId?: string;
    messageId?: string;
    senderName: string;
    text: string;
    timestamp: number;
    read: boolean;
    updatedAt?: number;
    followStatus?: 'accepted' | 'declined' | 'pending';
}

export interface PersonalChat {
    id: string;
    userIds: string[];
    lastActivity: number;
    lastMessage?: string;
    usernames?: { [userId: string]: string };
    unreadCounts: { [userId: string]: number };
}
