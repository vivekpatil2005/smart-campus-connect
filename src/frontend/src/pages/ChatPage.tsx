import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Loader2,
  MessageCircle,
  MessageSquare,
  Plus,
  Search,
  Send,
  Users,
} from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useGetChatMessages,
  useGetConversationPartners,
  useGetDirectMessages,
  useGetKnownUsers,
  useGetMyProfile,
  useSendChatMessage,
  useSendDirectMessage,
} from "../hooks/useQueries";
import { decodeProfile } from "../utils/profileUtils";
import { formatRelativeTime, getInitials } from "../utils/timeUtils";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const AVATAR_COLORS = [
  "bg-blue-500/20 text-blue-300",
  "bg-purple-500/20 text-purple-300",
  "bg-emerald-500/20 text-emerald-300",
  "bg-amber-500/20 text-amber-300",
  "bg-cyan-500/20 text-cyan-300",
  "bg-rose-500/20 text-rose-300",
];

function getAvatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

// ─── Group Chat ───────────────────────────────────────────────────────────────

function GroupChat() {
  const { identity } = useInternetIdentity();
  const { data: allMessages = [], isLoading } = useGetChatMessages();
  const sendMessage = useSendChatMessage();

  const [text, setText] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const currentPrincipal = identity?.getPrincipal().toString();

  // Filter out DM messages
  const messages = useMemo(
    () => allMessages.filter((m) => !m.content.startsWith("__DM:")),
    [allMessages],
  );

  const sortedMessages = useMemo(
    () => [...messages].sort((a, b) => Number(a.timestamp - b.timestamp)),
    [messages],
  );

  // biome-ignore lint/correctness/useExhaustiveDependencies: scroll on message count change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [sortedMessages.length]);

  const handleSend = async () => {
    if (!text.trim()) return;
    const content = text.trim();
    setText("");
    try {
      await sendMessage.mutateAsync(content);
    } catch {
      toast.error("Failed to send message");
      setText(content);
    }
  };

  return (
    <div className="flex flex-col" style={{ height: "100%" }}>
      <div className="flex-1 overflow-y-auto p-4 min-h-0">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <p className="text-muted-foreground text-sm">
                Loading messages...
              </p>
            </div>
          </div>
        ) : sortedMessages.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center py-16 gap-3 text-center"
            data-ocid="chat.empty_state"
          >
            <MessageCircle className="h-10 w-10 text-muted-foreground/40" />
            <div>
              <p className="font-medium text-foreground/70">No messages yet</p>
              <p className="text-muted-foreground text-sm">
                {identity
                  ? "Be the first to say hello!"
                  : "Login to join the conversation."}
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4 pb-2">
            {sortedMessages.map((msg, idx) => {
              const isOwn = currentPrincipal === msg.author.toString();
              const isSameAuthorAsPrev =
                idx > 0 &&
                sortedMessages[idx - 1].author.toString() ===
                  msg.author.toString();

              return (
                <motion.div
                  key={String(msg.id)}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className={`flex items-end gap-2.5 ${isOwn ? "flex-row-reverse" : ""}`}
                >
                  {!isOwn && (
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${
                        isSameAuthorAsPrev
                          ? "invisible"
                          : getAvatarColor(msg.authorName)
                      }`}
                    >
                      {getInitials(msg.authorName)}
                    </div>
                  )}
                  <div
                    className={`flex flex-col max-w-[70%] ${isOwn ? "items-end" : "items-start"}`}
                  >
                    {!isSameAuthorAsPrev && !isOwn && (
                      <div className="flex items-center gap-2 mb-1 px-1">
                        <span className="text-xs font-medium text-foreground/70">
                          {msg.authorName}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatRelativeTime(msg.timestamp)}
                        </span>
                      </div>
                    )}
                    <div
                      className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed break-words ${
                        isOwn
                          ? "bg-primary text-primary-foreground rounded-br-sm"
                          : "bg-secondary text-foreground/90 rounded-bl-sm"
                      }`}
                    >
                      {msg.content}
                    </div>
                    {isOwn && !isSameAuthorAsPrev && (
                      <span className="text-xs text-muted-foreground mt-1 px-1">
                        {formatRelativeTime(msg.timestamp)}
                      </span>
                    )}
                  </div>
                </motion.div>
              );
            })}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      <div className="flex-shrink-0 border-t border-border p-3 bg-card">
        {identity ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void handleSend();
            }}
            className="flex gap-2"
          >
            <Input
              data-ocid="chat.message_input"
              placeholder="Type a message..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="bg-secondary border-border flex-1"
              autoComplete="off"
            />
            <Button
              data-ocid="chat.send_button"
              type="submit"
              disabled={sendMessage.isPending || !text.trim()}
              size="icon"
              className="bg-primary text-primary-foreground flex-shrink-0 cursor-pointer"
            >
              {sendMessage.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </form>
        ) : (
          <div className="text-center text-sm text-muted-foreground py-2">
            Login to join the conversation
          </div>
        )}
      </div>
    </div>
  );
}

// ─── DM Conversation ─────────────────────────────────────────────────────────

function DMConversation({
  partnerPrincipal,
  partnerName,
}: { partnerPrincipal: string; partnerName: string }) {
  const { identity } = useInternetIdentity();
  const { dms, isLoading } = useGetDirectMessages(partnerPrincipal);
  const sendDm = useSendDirectMessage();
  const [text, setText] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  // biome-ignore lint/correctness/useExhaustiveDependencies: scroll on dm count change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [dms.length]);

  const handleSend = async () => {
    if (!text.trim()) return;
    const content = text.trim();
    setText("");
    try {
      await sendDm.mutateAsync({
        toPrincipal: partnerPrincipal,
        body: content,
      });
    } catch {
      toast.error("Failed to send message");
      setText(content);
    }
  };

  return (
    <div className="flex flex-col" style={{ height: "100%" }}>
      <div className="flex-shrink-0 p-3 border-b border-border flex items-center gap-3">
        <Avatar className="h-8 w-8">
          <AvatarFallback
            className={`text-xs font-bold ${getAvatarColor(partnerName)}`}
          >
            {getInitials(partnerName)}
          </AvatarFallback>
        </Avatar>
        <div>
          <p className="text-sm font-semibold text-foreground">{partnerName}</p>
          <p className="text-xs text-muted-foreground font-mono">
            {partnerPrincipal.slice(0, 16)}...
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 min-h-0">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          </div>
        ) : dms.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
            <MessageSquare className="h-10 w-10 text-muted-foreground/40" />
            <p className="text-muted-foreground text-sm">
              No messages yet. Say hello to {partnerName}!
            </p>
          </div>
        ) : (
          <div className="space-y-3 pb-2">
            {dms.map((dm) => (
              <motion.div
                key={String(dm.id)}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${dm.isOwn ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[70%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed break-words ${
                    dm.isOwn
                      ? "bg-primary text-primary-foreground rounded-br-sm"
                      : "bg-secondary text-foreground/90 rounded-bl-sm"
                  }`}
                >
                  {dm.body}
                  <div
                    className={`text-[10px] mt-1 ${dm.isOwn ? "text-primary-foreground/60" : "text-muted-foreground"}`}
                  >
                    {formatRelativeTime(dm.timestamp)}
                  </div>
                </div>
              </motion.div>
            ))}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      <div className="flex-shrink-0 border-t border-border p-3 bg-card">
        {identity ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void handleSend();
            }}
            className="flex gap-2"
          >
            <Input
              data-ocid="chat.dm_message_input"
              placeholder={`Message ${partnerName}...`}
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="bg-secondary border-border flex-1"
              autoComplete="off"
            />
            <Button
              data-ocid="chat.dm_send_button"
              type="submit"
              disabled={sendDm.isPending || !text.trim()}
              size="icon"
              className="bg-primary text-primary-foreground flex-shrink-0 cursor-pointer"
            >
              {sendDm.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </form>
        ) : (
          <div className="text-center text-sm text-muted-foreground py-2">
            Login to send messages
          </div>
        )}
      </div>
    </div>
  );
}

// ─── New Message Dialog ───────────────────────────────────────────────────────

function NewMessageDialog({
  open,
  onClose,
  onSelectUser,
}: {
  open: boolean;
  onClose: () => void;
  onSelectUser: (principal: string, name: string) => void;
}) {
  const [search, setSearch] = useState("");
  const { data: knownUsers = [], isLoading } = useGetKnownUsers();

  const filtered = useMemo(() => {
    if (!search.trim()) return knownUsers;
    const q = search.toLowerCase();
    return knownUsers.filter(
      (u) =>
        u.username.toLowerCase().includes(q) ||
        u.displayName.toLowerCase().includes(q),
    );
  }, [search, knownUsers]);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        className="bg-card border-border max-w-sm"
        data-ocid="chat.modal"
      >
        <DialogHeader>
          <DialogTitle className="font-heading">New Message</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              data-ocid="chat.dm_search_input"
              placeholder="Search by username or name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-secondary border-border"
              autoFocus
            />
          </div>
          <ScrollArea className="max-h-64">
            {isLoading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
              </div>
            ) : filtered.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-6">
                {search ? "No students found" : "No students discovered yet"}
              </p>
            ) : (
              <div className="space-y-1">
                {filtered.map((user) => (
                  <button
                    key={user.principal}
                    type="button"
                    onClick={() => {
                      onSelectUser(user.principal, user.displayName);
                      onClose();
                    }}
                    className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-secondary transition-colors text-left"
                  >
                    <Avatar className="h-8 w-8 flex-shrink-0">
                      <AvatarFallback
                        className={`text-xs font-bold ${getAvatarColor(user.displayName)}`}
                      >
                        {getInitials(user.displayName)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {user.displayName}
                      </p>
                      {user.username && (
                        <p className="text-xs text-primary font-mono">
                          @{user.username}
                        </p>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Direct Messages Panel ────────────────────────────────────────────────────

function DirectMessages() {
  const { partners, isLoading } = useGetConversationPartners();
  const { data: knownUsers = [] } = useGetKnownUsers();
  const { data: myProfile } = useGetMyProfile();
  const [selectedPartner, setSelectedPartner] = useState<{
    principal: string;
    name: string;
  } | null>(null);
  const [newMessageOpen, setNewMessageOpen] = useState(false);

  // Enrich partner names with usernames from knownUsers
  const enrichedPartners = useMemo(() => {
    return partners.map((p) => {
      const known = knownUsers.find((u) => u.principal === p.principal);
      const displayName = known
        ? known.username
          ? `@${known.username}`
          : known.displayName
        : p.authorName || `${p.principal.slice(0, 8)}...`;
      return { ...p, displayName };
    });
  }, [partners, knownUsers]);

  // Check if current user has a username set
  const myUsername = myProfile ? decodeProfile(myProfile).username : "";

  if (!myUsername) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-16 gap-3 text-center px-4">
        <MessageSquare className="h-10 w-10 text-muted-foreground/40" />
        <div>
          <p className="font-medium text-foreground/70">
            Set up your username first
          </p>
          <p className="text-muted-foreground text-sm mt-1">
            Go to your Profile page and set a username to use Direct Messages.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex" style={{ height: "100%" }}>
      {/* Left panel: conversation list */}
      <div className="w-64 border-r border-border flex flex-col flex-shrink-0">
        <div className="p-3 border-b border-border flex items-center justify-between">
          <p className="text-sm font-semibold text-foreground">Messages</p>
          <Button
            data-ocid="chat.dm_new_message_button"
            variant="ghost"
            size="icon"
            onClick={() => setNewMessageOpen(true)}
            className="h-7 w-7 text-muted-foreground hover:text-primary cursor-pointer"
            title="New message"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto min-h-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
            </div>
          ) : enrichedPartners.length === 0 ? (
            <div className="p-4 text-center">
              <p className="text-xs text-muted-foreground">
                No conversations yet. Click + to start one.
              </p>
            </div>
          ) : (
            <div className="p-2 space-y-1">
              {enrichedPartners.map((p, idx) => (
                <button
                  key={p.principal}
                  type="button"
                  data-ocid={`chat.dm_conversation_item.${idx + 1}`}
                  onClick={() =>
                    setSelectedPartner({
                      principal: p.principal,
                      name: p.displayName,
                    })
                  }
                  className={`w-full flex items-center gap-2.5 p-2.5 rounded-lg text-left transition-colors ${
                    selectedPartner?.principal === p.principal
                      ? "bg-primary/10 border border-primary/20"
                      : "hover:bg-secondary"
                  }`}
                >
                  <Avatar className="h-8 w-8 flex-shrink-0">
                    <AvatarFallback
                      className={`text-xs font-bold ${getAvatarColor(p.displayName)}`}
                    >
                      {getInitials(p.displayName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {p.displayName}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {p.lastMessage}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right panel: conversation */}
      <div className="flex-1 min-w-0">
        {selectedPartner ? (
          <DMConversation
            partnerPrincipal={selectedPartner.principal}
            partnerName={selectedPartner.name}
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-center px-4">
            <MessageSquare className="h-10 w-10 text-muted-foreground/40" />
            <div>
              <p className="font-medium text-foreground/70">
                Select a conversation
              </p>
              <p className="text-muted-foreground text-sm mt-1">
                Or click <span className="text-primary">+</span> to start a new
                one
              </p>
            </div>
          </div>
        )}
      </div>

      <NewMessageDialog
        open={newMessageOpen}
        onClose={() => setNewMessageOpen(false)}
        onSelectUser={(principal, name) => {
          // Find known user for better display name
          setSelectedPartner({ principal, name });
        }}
      />
    </div>
  );
}

// ─── Main ChatPage ────────────────────────────────────────────────────────────

export default function ChatPage() {
  return (
    <div className="flex flex-col" style={{ height: "calc(100vh - 7rem)" }}>
      {/* Header */}
      <div className="flex-shrink-0 mb-3">
        <h1 className="font-heading text-2xl font-bold text-foreground flex items-center gap-2">
          <MessageCircle className="h-6 w-6 text-primary" />
          Student Chat
        </h1>
        <p className="text-muted-foreground text-sm mt-0.5 flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
          </span>
          Live campus chat — refreshes every 5 seconds
        </p>
      </div>

      {/* Tabs */}
      <Tabs
        defaultValue="group"
        className="flex-1 flex flex-col min-h-0 gap-0 overflow-hidden"
      >
        <TabsList className="flex-shrink-0 grid w-full grid-cols-2 bg-secondary mb-3 max-w-xs">
          <TabsTrigger
            data-ocid="chat.group_tab"
            value="group"
            className="flex items-center gap-2"
          >
            <Users className="h-3.5 w-3.5" />
            Group Chat
          </TabsTrigger>
          <TabsTrigger
            data-ocid="chat.dm_tab"
            value="dm"
            className="flex items-center gap-2"
          >
            <MessageSquare className="h-3.5 w-3.5" />
            Direct Messages
          </TabsTrigger>
        </TabsList>

        <TabsContent
          value="group"
          className="flex-1 min-h-0 mt-0 overflow-hidden"
        >
          <div className="h-full rounded-xl border border-border bg-card overflow-hidden flex flex-col">
            <GroupChat />
          </div>
        </TabsContent>

        <TabsContent value="dm" className="flex-1 min-h-0 mt-0 overflow-hidden">
          <div className="h-full rounded-xl border border-border bg-card overflow-hidden flex flex-col">
            <DirectMessages />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
