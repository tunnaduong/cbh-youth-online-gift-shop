"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useAuth } from "./AuthContext";

const STORAGE_KEY = "giftshop_chat_widget";

interface ChatWidgetContextValue {
  conversationId: number | null;
  open: boolean;
  openChat: (conversationId: number) => void;
  closeChat: () => void;
  resetChat: () => void;
}

const ChatWidgetContext = createContext<ChatWidgetContextValue>({
  conversationId: null,
  open: false,
  openChat: () => {},
  closeChat: () => {},
  resetChat: () => {},
});

export function ChatWidgetProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const owner = user ? String(user.id) : null;
  const [conversationId, setConversationId] = useState<number | null>(null);
  const [open, setOpen] = useState(false);
  // The account the remembered thread belongs to (null = not known yet).
  const ownerRef = useRef<string | null>(null);

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
        ownerRef.current = typeof saved.owner === "string" ? saved.owner : null;
        setConversationId(saved.conversationId);
        setOpen(!!saved.open);
      }
    } catch {
      // Corrupt/old-shape data - start fresh rather than crash the page.
    }
  }, []);

  // A support thread belongs to one account: after a sign-out or an account
  // switch (also from another CBH site - the login cookie is shared) the
  // remembered thread would only answer 403/404, so the AI switch and the
  // message list silently stopped working.
  useEffect(() => {
    if (authLoading) return;
    if (owner === null || (ownerRef.current !== null && ownerRef.current !== owner)) {
      setConversationId(null);
      setOpen(false);
    }
    ownerRef.current = owner;
  }, [authLoading, owner]);

  useEffect(() => {
    try {
      if (conversationId === null) {
        localStorage.removeItem(STORAGE_KEY);
      } else {
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({ conversationId, open, owner: ownerRef.current })
        );
      }
    } catch {
      // Private browsing / storage disabled - the widget just won't survive a refresh.
    }
  }, [conversationId, open, owner, authLoading]);

  const openChat = useCallback((id: number) => {
    setConversationId(id);
    setOpen(true);
  }, []);

  const closeChat = useCallback(() => setOpen(false), []);

  const resetChat = useCallback(() => {
    setConversationId(null);
    setOpen(false);
  }, []);

  return (
    <ChatWidgetContext.Provider value={{ conversationId, open, openChat, closeChat, resetChat }}>
      {children}
    </ChatWidgetContext.Provider>
  );
}

export function useChatWidget() {
  return useContext(ChatWidgetContext);
}
