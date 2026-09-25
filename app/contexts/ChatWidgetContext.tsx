"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";

const STORAGE_KEY = "giftshop_chat_widget";

interface ChatWidgetContextValue {
  conversationId: number | null;
  open: boolean;
  openChat: (conversationId: number) => void;
  closeChat: () => void;
}

const ChatWidgetContext = createContext<ChatWidgetContextValue>({
  conversationId: null,
  open: false,
  openChat: () => {},
  closeChat: () => {},
});

export function ChatWidgetProvider({ children }: { children: ReactNode }) {
  const [conversationId, setConversationId] = useState<number | null>(null);
  const [open, setOpen] = useState(false);

  // Restores the widget after a refresh (F5) instead of losing it - it
  // previously only reappeared once the customer clicked "Nhắn tin" again,
  // which re-posted a new inquiry message just to reopen a conversation
  // that already existed.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw);
      if (typeof saved.conversationId === "number") {
        setConversationId(saved.conversationId);
        setOpen(!!saved.open);
      }
    } catch {
      // Corrupt/old-shape data - start fresh rather than crash the page.
    }
  }, []);

  useEffect(() => {
    try {
      if (conversationId === null) {
        localStorage.removeItem(STORAGE_KEY);
      } else {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ conversationId, open }));
      }
    } catch {
      // Private browsing / storage disabled - the widget just won't survive a refresh.
    }
  }, [conversationId, open]);

  const openChat = useCallback((id: number) => {
    setConversationId(id);
    setOpen(true);
  }, []);

  const closeChat = useCallback(() => setOpen(false), []);

  return (
    <ChatWidgetContext.Provider value={{ conversationId, open, openChat, closeChat }}>
      {children}
    </ChatWidgetContext.Provider>
  );
}

export function useChatWidget() {
  return useContext(ChatWidgetContext);
}
