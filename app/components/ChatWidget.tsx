"use client";

import { useEffect, useRef, useState } from "react";
import { Image as ImageIcon, MessageCircle, Send, Smile, X } from "lucide-react";
import { useChatWidget } from "../contexts/ChatWidgetContext";
import {
  getConversationMessages,
  reactToChatMessage,
  removeChatReaction,
  sendChatImage,
  sendChatMessage,
  MAX_CHAT_IMAGE_BYTES,
  type ChatMessage,
  type ReactionType,
} from "../lib/chat";
import { getSupportStatus } from "../lib/shop";

const POLL_INTERVAL_MS = 4000;

// Same set/emoji/labels as the main site's MessageReactions.js, for a
// consistent reaction picker between the two chat surfaces.
const REACTION_TYPES: { type: ReactionType; emoji: string; label: string }[] = [
  { type: "like", emoji: "👍", label: "Thích" },
  { type: "love", emoji: "❤️", label: "Yêu thích" },
  { type: "haha", emoji: "😆", label: "Haha" },
  { type: "wow", emoji: "😮", label: "Wow" },
  { type: "sad", emoji: "😢", label: "Buồn" },
  { type: "angry", emoji: "😡", label: "Phẫn nộ" },
];

export default function ChatWidget() {
  const { conversationId, open, openChat, closeChat } = useChatWidget();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [adminsOnline, setAdminsOnline] = useState<number | null>(null);
  const [pickerFor, setPickerFor] = useState<number | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open || !conversationId) return;

    let cancelled = false;
    const load = () => {
      getConversationMessages(conversationId)
        .then((msgs) => {
          if (!cancelled) setMessages(msgs);
        })
        .catch((error) => console.error("Failed to load chat messages:", error));
      getSupportStatus()
        .then(({ admins_online }) => {
          if (!cancelled) setAdminsOnline(admins_online);
        })
        .catch((error) => console.error("Failed to load support status:", error));
    };

    load();
    const interval = setInterval(load, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [open, conversationId]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages]);

  if (!conversationId) return null;

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const content = input.trim();
    if (!content || sending) return;

    setSending(true);
    setInput("");
    try {
      const message = await sendChatMessage(conversationId, content);
      setMessages((prev) => [...prev, message]);
    } catch (error) {
      console.error("Failed to send chat message:", error);
      setInput(content);
    } finally {
      setSending(false);
    }
  };

  const handlePickImage = () => fileInputRef.current?.click();

  const handleImageSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    if (file.size > MAX_CHAT_IMAGE_BYTES) {
      alert("Ảnh vượt quá 10MB, vui lòng chọn ảnh nhỏ hơn.");
      return;
    }

    setUploadingImage(true);
    try {
      const message = await sendChatImage(conversationId, file);
      setMessages((prev) => [...prev, message]);
    } catch (error) {
      console.error("Failed to send chat image:", error);
      alert("Gửi ảnh thất bại, vui lòng thử lại.");
    } finally {
      setUploadingImage(false);
    }
  };

  const applyReactionUpdate = (messageId: number, reactions: ChatMessage["reactions"]) => {
    setMessages((prev) => prev.map((m) => (m.id === messageId ? { ...m, reactions } : m)));
  };

  const handleReact = async (messageId: number, type: ReactionType) => {
    setPickerFor(null);
    try {
      const message = messages.find((m) => m.id === messageId);
      const isActive = message?.reactions.my_reactions.includes(type);
      const { reactions } = isActive
        ? await removeChatReaction(messageId)
        : await reactToChatMessage(messageId, type);
      applyReactionUpdate(messageId, reactions);
    } catch (error) {
      console.error("Failed to react to message:", error);
    }
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => openChat(conversationId)}
        className="fixed bottom-5 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-green-600 text-white shadow-lg transition-colors hover:bg-green-700"
        aria-label="Mở khung chat hỗ trợ"
      >
        <MessageCircle className="h-6 w-6" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-5 right-5 z-40 flex h-[520px] w-[360px] max-w-[calc(100vw-2.5rem)] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
      <div className="flex items-center justify-between bg-green-600 px-4 py-3 text-white">
        <div>
          <p className="text-sm font-semibold">Hỗ trợ Giftshop</p>
          <p className="flex items-center gap-1.5 text-xs text-green-100">
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                adminsOnline ? "bg-emerald-300" : "bg-slate-300"
              }`}
            />
            {adminsOnline === null
              ? "Đang kiểm tra..."
              : adminsOnline > 0
                ? "Admin đang online"
                : "Hiện không có admin online - shop sẽ phản hồi sớm nhất"}
          </p>
        </div>
        <button
          type="button"
          onClick={closeChat}
          className="flex h-7 w-7 items-center justify-center rounded-full text-white/80 hover:bg-white/10 hover:text-white"
          aria-label="Đóng khung chat"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto bg-slate-50 px-3 py-4">
        {messages.map((m) => {
          const hasReactions = m.reactions.total > 0;
          return (
            <div key={m.id} className={`flex ${m.is_myself ? "justify-end" : "justify-start"}`}>
              <div className={`group relative max-w-[80%] ${m.is_myself ? "items-end" : "items-start"} flex flex-col gap-0.5`}>
                {!m.is_myself && (
                  <span className="px-1 text-[11px] font-medium text-slate-500">
                    {m.sender.profile_name}
                  </span>
                )}

                {m.type === "image" && m.file_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={m.file_url}
                    alt="Hình ảnh đính kèm"
                    className="max-w-[200px] rounded-2xl border border-slate-200 object-cover"
                  />
                ) : (
                  <div
                    className={`rounded-2xl px-3.5 py-2 text-sm ${
                      m.is_myself
                        ? "rounded-br-sm bg-green-600 text-white"
                        : "rounded-bl-sm bg-white text-slate-700 shadow-sm"
                    }`}
                  >
                    {m.content}
                  </div>
                )}

                {/* Reaction summary pills, e.g. "👍 2 ❤️ 1" */}
                {hasReactions && (
                  <div className="flex flex-wrap gap-1 px-1">
                    {m.reactions.summary.map((r) => (
                      <span
                        key={r.type}
                        className="rounded-full border border-slate-200 bg-white px-1.5 py-0.5 text-[11px] shadow-sm"
                      >
                        {REACTION_TYPES.find((rt) => rt.type === r.type)?.emoji} {r.count}
                      </span>
                    ))}
                  </div>
                )}

                {/* React trigger - visible on hover (desktop) or tap */}
                <button
                  type="button"
                  onClick={() => setPickerFor((cur) => (cur === m.id ? null : m.id))}
                  className={`absolute top-0 flex h-6 w-6 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-400 opacity-0 shadow-sm transition-opacity hover:text-green-600 group-hover:opacity-100 ${
                    m.is_myself ? "-left-7" : "-right-7"
                  }`}
                  aria-label="Thả cảm xúc"
                >
                  <Smile className="h-3.5 w-3.5" />
                </button>

                {pickerFor === m.id && (
                  <div
                    className={`absolute bottom-full z-10 mb-1 flex gap-0.5 rounded-full border border-slate-200 bg-white p-1 shadow-lg ${
                      m.is_myself ? "right-0" : "left-0"
                    }`}
                  >
                    {REACTION_TYPES.map(({ type, emoji, label }) => (
                      <button
                        key={type}
                        type="button"
                        title={label}
                        onClick={() => handleReact(m.id, type)}
                        className={`flex h-7 w-7 items-center justify-center rounded-full text-base transition-transform hover:scale-125 ${
                          m.reactions.my_reactions.includes(type) ? "bg-green-50" : ""
                        }`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <form onSubmit={handleSend} className="flex items-center gap-2 border-t border-slate-100 p-3">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleImageSelected}
        />
        <button
          type="button"
          onClick={handlePickImage}
          disabled={uploadingImage}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-slate-500 transition-colors hover:bg-slate-100 hover:text-green-600 disabled:cursor-not-allowed disabled:text-slate-300"
          aria-label="Gửi hình ảnh"
        >
          <ImageIcon className="h-4 w-4" />
        </button>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Nhập tin nhắn..."
          className="flex-1 rounded-xl bg-slate-100 px-3.5 py-2.5 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-green-600/30"
        />
        <button
          type="submit"
          disabled={!input.trim() || sending}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-green-600 text-white transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-slate-200"
          aria-label="Gửi tin nhắn"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}
