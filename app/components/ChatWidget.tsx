"use client";

import { useEffect, useRef, useState } from "react";
import { Bot, Image as ImageIcon, MessageCircle, Send, Smile, X } from "lucide-react";
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
import { getSupportStatus, setSupportAi } from "../lib/shop";
import ShopAttachments from "./chat/ShopAttachments";

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
  const { conversationId, open, openChat, closeChat, resetChat } = useChatWidget();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [adminsOnline, setAdminsOnline] = useState<number | null>(null);
  const [pickerFor, setPickerFor] = useState<number | null>(null);
  // AI assistant: on = it answers every message, off = wait for a person.
  // null until the server has said which - the switch stays disabled until
  // then, so a click can't "toggle" from a guessed state.
  const [aiEnabled, setAiEnabled] = useState<boolean | null>(null);
  const [togglingAi, setTogglingAi] = useState(false);
  // The message the AI is still expected to answer (null = not waiting).
  const [pendingAfterId, setPendingAfterId] = useState<number | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Bumped when a switch starts and again when it ends: a status poll only
  // counts if no switch started or finished while it was in flight.
  const toggleSeq = useRef(0);
  const aiPendingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Another thread (another account's, or a fresh one): nothing carries over.
  useEffect(() => {
    setMessages([]);
    setAiEnabled(null);
    setPendingAfterId(null);
    setPickerFor(null);
  }, [conversationId]);

  useEffect(
    () => () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
      if (aiPendingTimer.current) clearTimeout(aiPendingTimer.current);
    },
    []
  );

  useEffect(() => {
    if (!open || !conversationId) return;

    let cancelled = false;
    const load = () => {
      const seq = toggleSeq.current;
      getConversationMessages(conversationId)
        .then((msgs) => {
          if (cancelled) return;
          // A message sent after this poll's snapshot was taken isn't in it
          // yet: keep it instead of letting it vanish until the next poll.
          const newest = msgs.length ? msgs[msgs.length - 1].id : 0;
          setMessages((prev) => [...msgs, ...prev.filter((m) => m.id > newest)]);
          // The assistant (or a staff member) has answered that message.
          setPendingAfterId((cur) =>
            cur !== null && msgs.some((m) => m.id > cur && !m.is_myself && m.type !== "system")
              ? null
              : cur
          );
        })
        .catch((error) => console.error("Failed to load chat messages:", error));
      getSupportStatus()
        .then(({ admins_online, ai_enabled, conversation_id }) => {
          if (cancelled) return;
          setAdminsOnline(admins_online);
          // The thread remembered in this browser isn't this account's (it
          // was saved under another account): use the right one, or none.
          if (conversation_id === null) {
            resetChat();
            return;
          }
          if (typeof conversation_id === "number" && conversation_id !== conversationId) {
            openChat(conversation_id);
            return;
          }
          // Don't let a poll that overlapped a switch undo it.
          if (seq === toggleSeq.current && typeof ai_enabled === "boolean") {
            setAiEnabled(ai_enabled);
          }
        })
        .catch((error) => console.error("Failed to load support status:", error));
    };

    load();
    const interval = setInterval(load, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [open, conversationId, openChat, resetChat]);

  // Follow new messages only: scrolling on every poll made it impossible to
  // read back through the thread (it jumped to the bottom every 4s).
  const lastMessageId = messages.length ? messages[messages.length - 1].id : null;
  const showAiPending = !!aiEnabled && pendingAfterId !== null;
  // Jump straight to the end when the thread first shows; glide for what
  // arrives after that.
  const settledRef = useRef(false);
  useEffect(() => {
    if (!open) {
      settledRef.current = false;
      return;
    }
    listRef.current?.scrollTo({
      top: listRef.current.scrollHeight,
      behavior: settledRef.current ? "smooth" : "auto",
    });
    if (lastMessageId !== null) settledRef.current = true;
  }, [open, lastMessageId, showAiPending]);

  if (!conversationId) return null;

  const showToast = (text: string) => {
    setToast(text);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 3500);
  };

  // The poll may already have delivered a message by the time its own POST
  // answers - adding it again showed it twice.
  const appendMessage = (message: ChatMessage) =>
    setMessages((prev) => (prev.some((m) => m.id === message.id) ? prev : [...prev, message]));

  const handleToggleAi = async () => {
    if (togglingAi || aiEnabled === null) return;
    const previous = aiEnabled;
    const next = !previous;
    setTogglingAi(true);
    toggleSeq.current += 1;
    setAiEnabled(next);
    if (!next) setPendingAfterId(null);
    try {
      const result = await setSupportAi(conversationId, next);
      const enabled = typeof result.ai_enabled === "boolean" ? result.ai_enabled : next;
      setAiEnabled(enabled);
      showToast(
        enabled
          ? "Đã bật AI: Yoyo AI sẽ tự động trả lời bạn."
          : "Đã tắt AI: bạn đang trò chuyện với nhân viên shop."
      );
    } catch (error) {
      console.error("Failed to switch support AI:", error);
      setAiEnabled(previous);
      showToast("Không đổi được chế độ, vui lòng thử lại.");
    } finally {
      toggleSeq.current += 1;
      setTogglingAi(false);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const content = input.trim();
    if (!content || sending) return;

    setSending(true);
    setInput("");
    try {
      const message = await sendChatMessage(conversationId, content);
      appendMessage(message);
      if (aiEnabled) {
        setPendingAfterId(message.id);
        if (aiPendingTimer.current) clearTimeout(aiPendingTimer.current);
        aiPendingTimer.current = setTimeout(() => setPendingAfterId(null), 45000);
      }
    } catch (error) {
      console.error("Failed to send chat message:", error);
      // Don't overwrite what the customer has typed since.
      setInput((cur) => cur || content);
      showToast("Gửi tin nhắn thất bại, vui lòng thử lại.");
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
      showToast("Ảnh vượt quá 10MB, vui lòng chọn ảnh nhỏ hơn.");
      return;
    }

    setUploadingImage(true);
    try {
      const message = await sendChatImage(conversationId, file);
      appendMessage(message);
    } catch (error) {
      console.error("Failed to send chat image:", error);
      showToast("Gửi ảnh thất bại, vui lòng thử lại.");
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
        className="fixed bottom-5 right-5 z-40 flex h-14 w-14 origin-bottom-right animate-pop-in items-center justify-center rounded-full bg-primary-500 text-white shadow-glow transition duration-200 hover:scale-105 hover:bg-primary-600 active:scale-95"
        aria-label="Mở khung chat hỗ trợ"
      >
        <MessageCircle className="h-6 w-6" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-5 right-5 z-40 flex h-[520px] max-h-[calc(100dvh-2.5rem)] w-[360px] max-w-[calc(100vw-2.5rem)] origin-bottom-right animate-chat-in flex-col overflow-hidden rounded-2xl border border-card-border bg-surface shadow-2xl">
      <div className="flex items-center justify-between bg-gradient-to-r from-[#2E9A2A] to-[#3FA836] px-4 py-3 text-white">
        <div>
          <p className="text-sm font-semibold">Hỗ trợ Giftshop</p>
          <p className="flex items-center gap-1.5 text-xs text-white/85">
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                adminsOnline ? "bg-emerald-300" : "bg-white/50"
              }`}
            />
            {aiEnabled
              ? "Yoyo AI đang trả lời tự động"
              : adminsOnline === null
                ? "Đang kiểm tra..."
                : adminsOnline > 0
                  ? "Admin đang online"
                  : "Hiện không có admin online - shop sẽ phản hồi sớm nhất"}
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleToggleAi}
            disabled={togglingAi || aiEnabled === null}
            aria-pressed={!!aiEnabled}
            title={aiEnabled ? "Tắt AI để trò chuyện với nhân viên" : "Bật AI trả lời tự động"}
            className={`flex h-7 items-center gap-1 rounded-full px-2 text-[11px] font-semibold transition duration-200 active:scale-95 disabled:opacity-60 ${
              aiEnabled
                ? "bg-white text-[#287421] shadow-sm"
                : "bg-white/10 text-white/70 hover:bg-white/20 hover:text-white"
            }`}
          >
            <Bot className="h-3.5 w-3.5" />
            AI
          </button>
          <button
            type="button"
            onClick={closeChat}
            className="flex h-7 w-7 items-center justify-center rounded-full text-white/80 transition-colors hover:bg-white/15 hover:text-white"
            aria-label="Đóng khung chat"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {toast && (
        // The wrapper does the centring, so the pill is free to animate in.
        <div className="pointer-events-none absolute inset-x-0 top-14 z-20 flex justify-center px-3">
          <div
            key={toast}
            role="status"
            className="w-max max-w-[90%] animate-toast-in rounded-full bg-black/80 px-3.5 py-1.5 text-center text-xs text-white shadow-lg backdrop-blur"
          >
            {toast}
          </div>
        </div>
      )}

      <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto bg-page px-3 py-4">
        {messages.map((m) => {
          // System lines (e.g. the AI being switched on/off) are notes in the
          // thread, not somebody's message bubble.
          if (m.type === "system") {
            return (
              <p key={m.id} className="animate-fade-in px-4 text-center text-[11px] text-gray-400">
                {m.content}
              </p>
            );
          }
          const hasReactions = m.reactions.total > 0;
          return (
            <div key={m.id} className={`flex animate-msg-in ${m.is_myself ? "justify-end" : "justify-start"}`}>
              <div className={`group relative max-w-[80%] ${m.is_myself ? "items-end" : "items-start"} flex flex-col gap-0.5`}>
                {!m.is_myself && (
                  <span className="px-1 text-[11px] font-medium text-gray-500">
                    {m.sender.profile_name}
                    {m.sender.is_ai && (
                      <span className="ml-1 rounded bg-primary-50 px-1 py-px text-[10px] font-semibold text-brand-strong">
                        AI
                      </span>
                    )}
                  </span>
                )}

                {m.type === "image" && m.file_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={m.file_url}
                    alt="Hình ảnh đính kèm"
                    className="max-w-[200px] rounded-2xl border border-card-border object-cover"
                  />
                ) : (
                  <div
                    className={`whitespace-pre-wrap break-words rounded-2xl px-3.5 py-2 text-sm ${
                      m.is_myself
                        ? "rounded-br-sm bg-primary-500 text-white"
                        : "rounded-bl-sm border border-card-border bg-surface text-gray-800 shadow-card"
                    }`}
                  >
                    {m.content}
                  </div>
                )}

                {/* Product photos, an order slip or a QR the AI attached. */}
                {m.sender.is_ai && m.metadata && <ShopAttachments messageId={m.id} metadata={m.metadata} />}

                {/* Reaction summary pills, e.g. "👍 2 ❤️ 1" */}
                {hasReactions && (
                  <div className="flex flex-wrap gap-1 px-1">
                    {m.reactions.summary.map((r) => (
                      <span
                        key={r.type}
                        className="rounded-full border border-card-border bg-popover px-1.5 py-0.5 text-[11px] shadow-sm"
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
                  className={`absolute top-0 flex h-6 w-6 items-center justify-center rounded-full border border-card-border bg-popover text-gray-400 opacity-0 shadow-sm transition-opacity hover:text-brand group-hover:opacity-100 [@media(hover:none)]:opacity-70 ${
                    m.is_myself ? "-left-7" : "-right-7"
                  }`}
                  aria-label="Thả cảm xúc"
                >
                  <Smile className="h-3.5 w-3.5" />
                </button>

                {pickerFor === m.id && (
                  <div
                    className={`absolute bottom-full z-10 mb-1 flex animate-pop-in gap-0.5 rounded-full border border-card-border bg-popover p-1 shadow-lg ${
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
                          m.reactions.my_reactions.includes(type) ? "bg-primary-50" : ""
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
        {showAiPending && (
          // Bouncing dots, as the main site's chat shows someone typing.
          <div className="flex animate-msg-in items-center gap-2 px-1 text-xs text-gray-500">
            <span className="flex items-center gap-1 rounded-2xl rounded-bl-sm border border-card-border bg-surface px-3 py-2.5 shadow-card">
              <span className="typing-dot h-1.5 w-1.5 rounded-full bg-gray-400" />
              <span className="typing-dot h-1.5 w-1.5 rounded-full bg-gray-400" />
              <span className="typing-dot h-1.5 w-1.5 rounded-full bg-gray-400" />
            </span>
            Yoyo AI đang trả lời...
          </div>
        )}
      </div>

      <form onSubmit={handleSend} className="flex items-center gap-2 border-t border-gray-100 p-3">
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
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-gray-500 transition-colors hover:bg-gray-100 hover:text-brand disabled:cursor-not-allowed disabled:text-gray-300"
          aria-label="Gửi hình ảnh"
        >
          <ImageIcon className="h-4 w-4" />
        </button>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Nhập tin nhắn..."
          className="min-w-0 flex-1 rounded-xl border border-transparent bg-gray-100 px-3.5 py-2.5 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
        />
        <button
          type="submit"
          disabled={!input.trim() || sending}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-500 text-white transition duration-200 hover:bg-primary-600 active:scale-90 disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400 disabled:active:scale-100"
          aria-label="Gửi tin nhắn"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}
