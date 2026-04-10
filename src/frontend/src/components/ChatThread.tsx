import { Button } from "@/components/ui/button";
import {
  useAddChatMessage,
  useDeleteChatMessage,
  useGetChatMessages,
  useIsCallerAdmin,
} from "@/hooks/useQueries";
import { cn } from "@/lib/utils";
import type { ChatMessage } from "@/types";
import { useInternetIdentity } from "@caffeineai/core-infrastructure";
import { MessageSquare, Send, Trash2, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

function timeAgo(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

interface MessageRowProps {
  msg: ChatMessage;
  entryId: string;
  isOwn: boolean;
  isAdmin: boolean;
}

function MessageRow({ msg, entryId, isOwn, isAdmin }: MessageRowProps) {
  const [showDelete, setShowDelete] = useState(false);
  const deleteMsg = useDeleteChatMessage();
  const canDelete = isOwn || isAdmin;

  function handleDelete() {
    deleteMsg.mutate(
      { messageId: msg.id, entryId },
      {
        onSuccess: () => toast.success("Message deleted."),
        onError: () => toast.error("Failed to delete message."),
      },
    );
    setShowDelete(false);
  }

  return (
    <div
      className="group flex items-start gap-2 py-2 px-3 rounded-lg hover:bg-muted/40 transition-smooth relative"
      data-ocid={`chat-message-${msg.id}`}
    >
      {/* Avatar */}
      <div
        className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5"
        style={{
          background: "oklch(0.35 0.12 247 / 0.15)",
          color: "oklch(0.35 0.12 247)",
        }}
        aria-hidden="true"
      >
        {msg.authorName.charAt(0).toUpperCase()}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2 flex-wrap">
          <span className="text-xs font-semibold text-foreground">
            {msg.authorName}
          </span>
          <span className="text-xs text-muted-foreground">
            {timeAgo(msg.timestamp)}
          </span>
        </div>
        <p className="text-sm text-foreground mt-0.5 break-words leading-relaxed">
          {msg.content}
        </p>
      </div>

      {/* Delete action */}
      {canDelete && (
        <div className="shrink-0 opacity-0 group-hover:opacity-100 transition-smooth">
          {showDelete ? (
            <div className="flex items-center gap-1">
              <Button
                size="sm"
                variant="destructive"
                className="h-6 px-2 text-xs"
                onClick={handleDelete}
                disabled={deleteMsg.isPending}
                data-ocid={`delete-confirm-${msg.id}`}
              >
                Delete
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0"
                onClick={() => setShowDelete(false)}
              >
                <X size={12} />
              </Button>
            </div>
          ) : (
            <Button
              size="sm"
              variant="ghost"
              className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
              onClick={() => setShowDelete(true)}
              aria-label="Delete message"
              data-ocid={`delete-btn-${msg.id}`}
            >
              <Trash2 size={12} />
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

interface ChatThreadProps {
  entryId: string;
  className?: string;
}

export function ChatThread({ entryId, className }: ChatThreadProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [authorName, setAuthorName] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("chat_author") ?? "";
    }
    return "";
  });
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { data: messages = [], isLoading } = useGetChatMessages(
    entryId,
    isOpen,
  );
  const addMsg = useAddChatMessage();
  const { data: isAdmin = false } = useIsCallerAdmin();
  const { identity } = useInternetIdentity();
  const myPrincipal = identity?.getPrincipal().toText() ?? "";

  const visibleMessages = messages.filter((m) => !m.isDeleted);

  // Auto-scroll to bottom when messages change or thread opens
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentionally scroll on message count change
  useEffect(() => {
    if (isOpen && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [isOpen, messages.length]);

  function handleSend() {
    const trimmed = draft.trim();
    if (!trimmed) return;
    if (!authorName.trim()) {
      toast.error("Please enter your name first.");
      return;
    }
    if (trimmed.length > 500) {
      toast.error("Message too long (max 500 characters).");
      return;
    }
    localStorage.setItem("chat_author", authorName.trim());
    addMsg.mutate(
      { entryId, authorName: authorName.trim(), content: trimmed },
      {
        onSuccess: () => setDraft(""),
        onError: () => toast.error("Failed to send message."),
      },
    );
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div className={cn("border-t border-border/60", className)}>
      {/* Toggle button */}
      <button
        type="button"
        onClick={() => setIsOpen((o) => !o)}
        className="flex items-center gap-2 px-4 py-2 w-full text-left text-xs font-medium text-muted-foreground hover:text-foreground transition-smooth hover:bg-muted/30"
        data-ocid={`chat-toggle-${entryId}`}
        aria-expanded={isOpen}
      >
        <MessageSquare size={13} />
        <span>
          Discussion{" "}
          {visibleMessages.length > 0 && `(${visibleMessages.length})`}
        </span>
        <span className="ml-auto">{isOpen ? "▲" : "▼"}</span>
      </button>

      {/* Thread body */}
      {isOpen && (
        <div
          className="px-3 pb-3 space-y-2"
          data-ocid={`chat-thread-${entryId}`}
        >
          {/* Message list */}
          <div
            className="max-h-48 overflow-y-auto space-y-0.5 rounded-lg bg-background/50"
            style={{ scrollbarWidth: "thin" }}
          >
            {isLoading ? (
              <p className="text-xs text-muted-foreground px-3 py-4 text-center">
                Loading discussion…
              </p>
            ) : visibleMessages.length === 0 ? (
              <p
                className="text-xs text-muted-foreground px-3 py-4 text-center"
                data-ocid={`chat-empty-${entryId}`}
              >
                No messages yet. Start the discussion!
              </p>
            ) : (
              <>
                {visibleMessages.map((msg) => (
                  <MessageRow
                    key={msg.id}
                    msg={msg}
                    entryId={entryId}
                    isOwn={!!myPrincipal && msg.authorId === myPrincipal}
                    isAdmin={isAdmin}
                  />
                ))}
              </>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Author name input (first-time) */}
          {!authorName && (
            <input
              type="text"
              placeholder="Your name (required for chat)"
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              className="w-full text-xs rounded-lg border border-input bg-background px-3 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 transition-smooth"
              data-ocid={`chat-name-${entryId}`}
              maxLength={50}
            />
          )}

          {/* Compose row */}
          <div className="flex gap-2 items-end">
            <div className="flex-1 relative">
              <textarea
                ref={textareaRef}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Write a message… (Enter to send)"
                maxLength={500}
                rows={2}
                className="w-full resize-none text-sm rounded-lg border border-input bg-background px-3 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 transition-smooth"
                data-ocid={`chat-input-${entryId}`}
                aria-label="Write a message"
              />
              <span className="absolute bottom-2 right-2 text-[10px] text-muted-foreground">
                {draft.length}/500
              </span>
            </div>
            <Button
              size="sm"
              onClick={handleSend}
              disabled={addMsg.isPending || !draft.trim()}
              className="shrink-0 h-9 w-9 p-0 rounded-full"
              style={{
                backgroundColor: "oklch(0.35 0.12 247)",
                color: "oklch(0.98 0 0)",
              }}
              aria-label="Send message"
              data-ocid={`chat-send-${entryId}`}
            >
              <Send size={14} />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
