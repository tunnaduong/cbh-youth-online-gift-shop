import { API_URL } from "./api";
import { getAuthToken } from "./auth";

export interface ChatSender {
  id: number | null;
  username: string;
  profile_name: string;
  avatar_url: string | null;
  is_ai: boolean;
}

export type ReactionType = "like" | "love" | "haha" | "wow" | "sad" | "angry";

export interface ReactionSummaryEntry {
  type: ReactionType;
  count: number;
  users: { id: number | null; username: string; profile_name: string; count: number }[];
}

export interface ChatReactions {
  summary: ReactionSummaryEntry[];
  total: number;
  my_reactions: ReactionType[];
}

export interface ChatMessage {
  id: number;
  content: string | null;
  type: "text" | "image" | "video" | "file" | "system";
  file_url: string | null;
  is_myself: boolean;
  sender: ChatSender;
  created_at: string | null;
  created_at_human: string | null;
  reactions: ChatReactions;
}

interface Paginated<T> {
  data: T[];
}

async function chatFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  if (!token) throw new Error("Not logged in");

  const res = await fetch(`${API_URL}/v1.0/chat${path}`, {
    ...options,
    headers: {
      Accept: "application/json",
      "X-From-Frontend": "true",
      Authorization: `Bearer ${token}`,
      ...(options.headers as Record<string, string> | undefined),
    },
    cache: "no-store",
  });

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.message || `Request failed (${res.status})`);
  }

  return res.json();
}

/** Most recent page of messages, oldest first - see ChatController::getMessages's paging (page 1 = newest). */
export async function getConversationMessages(conversationId: number): Promise<ChatMessage[]> {
  const page = await chatFetch<Paginated<ChatMessage>>(`/conversations/${conversationId}/messages`);
  return page.data;
}

export function sendChatMessage(conversationId: number, content: string): Promise<ChatMessage> {
  const body = new FormData();
  body.set("content", content);
  body.set("type", "text");
  return chatFetch<ChatMessage>(`/conversations/${conversationId}/messages`, {
    method: "POST",
    body,
  });
}

// Same limits as ChatController::sendMessage's 'image' validation rules.
export const MAX_CHAT_IMAGE_BYTES = 10 * 1024 * 1024;

export function sendChatImage(conversationId: number, file: File): Promise<ChatMessage> {
  const body = new FormData();
  body.set("file", file);
  body.set("type", "image");
  // cyo_conversation_messages.content is NOT NULL at the DB level - the main
  // site's own upload flow (ChatProvider.js) works around it the same way,
  // by sending the filename as content instead of leaving it empty.
  body.set("content", file.name);
  return chatFetch<ChatMessage>(`/conversations/${conversationId}/messages`, {
    method: "POST",
    body,
  });
}

export function reactToChatMessage(
  messageId: number,
  reactionType: ReactionType
): Promise<{ message_id: number; reactions: ChatReactions }> {
  const body = new FormData();
  body.set("reaction_type", reactionType);
  return chatFetch(`/messages/${messageId}/reactions`, { method: "POST", body });
}

export function removeChatReaction(
  messageId: number
): Promise<{ message_id: number; reactions: ChatReactions }> {
  return chatFetch(`/messages/${messageId}/reactions`, { method: "DELETE" });
}
