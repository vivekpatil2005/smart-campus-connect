import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  ChevronDown,
  ChevronUp,
  HelpCircle,
  Loader2,
  MessageSquare,
  Pencil,
  Plus,
  Search,
  Send,
  Trash2,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import type { Doubt } from "../backend.d";
import { EmptyState } from "../components/EmptyState";
import { CardSkeleton, LoadingSpinner } from "../components/LoadingSpinner";
import { SUBJECT_TAGS, SubjectTagBadge } from "../components/SubjectTagBadge";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useAddComment,
  useCreateDoubt,
  useDeleteDoubt,
  useGetDoubts,
  useGetMyProfile,
  useIsAdmin,
  useUpdateDoubt,
} from "../hooks/useQueries";
import { formatRelativeTime, getInitials } from "../utils/timeUtils";

function DoubtCard({
  doubt,
  isLoggedIn,
  currentPrincipal,
  isAdminUser,
}: {
  doubt: Doubt;
  isLoggedIn: boolean;
  currentPrincipal: string | null;
  isAdminUser: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    title: doubt.title,
    content: doubt.content,
    subjectTag: doubt.subjectTag,
  });
  const addComment = useAddComment();
  const deleteDoubt = useDeleteDoubt();
  const updateDoubt = useUpdateDoubt();

  const isOwner = currentPrincipal
    ? doubt.author.toString() === currentPrincipal
    : false;

  const handleComment = async () => {
    if (!commentText.trim()) return;
    try {
      await addComment.mutateAsync({ doubtId: doubt.id, content: commentText });
      toast.success("Comment added!");
      setCommentText("");
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      const displayMsg =
        msg.includes("Anonymous") ||
        msg.includes("not registered") ||
        msg.includes("Unauthorized")
          ? "Please wait a moment and try again — your session is being set up."
          : msg.includes("User profile not found")
            ? "Please set up your profile first before commenting."
            : "Failed to add comment. Please try again.";
      toast.error(displayMsg);
    }
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await deleteDoubt.mutateAsync(doubt.id);
      toast.success("Doubt deleted");
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      const displayMsg = msg.includes("Not authorized")
        ? "You are not authorized to delete this doubt."
        : msg.includes("Doubt not found")
          ? "Doubt not found."
          : "Failed to delete doubt. Please try again.";
      toast.error(displayMsg);
    }
  };

  const handleEdit = async () => {
    if (
      !editForm.title.trim() ||
      !editForm.content.trim() ||
      !editForm.subjectTag
    ) {
      toast.error("Please fill in all fields");
      return;
    }
    try {
      await updateDoubt.mutateAsync({ id: doubt.id, ...editForm });
      toast.success("Doubt updated");
      setEditOpen(false);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      const displayMsg = msg.includes("Not authorized")
        ? "You are not authorized to edit this doubt."
        : msg.includes("Doubt not found")
          ? "Doubt not found."
          : "Failed to update doubt. Please try again.";
      toast.error(displayMsg);
    }
  };

  return (
    <>
      <motion.div
        layout
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
      >
        <Card className="campus-card border-border bg-card overflow-hidden">
          <CardHeader className="pb-3">
            <div className="flex items-start gap-3">
              <button
                type="button"
                onClick={() => setExpanded((v) => !v)}
                className="flex-1 text-left min-w-0"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-heading font-semibold text-foreground line-clamp-2 leading-snug">
                      {doubt.title}
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1 flex-wrap">
                      <div className="flex items-center justify-center w-5 h-5 rounded-full bg-purple-500/20 text-purple-300 text-[10px] font-bold">
                        {getInitials(doubt.authorName)}
                      </div>
                      <span>{doubt.authorName}</span>
                      <span>·</span>
                      <span>{formatRelativeTime(doubt.timestamp)}</span>
                      <span>·</span>
                      <span className="flex items-center gap-1">
                        <MessageSquare className="h-3 w-3" />
                        {doubt.comments.length}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <SubjectTagBadge tag={doubt.subjectTag} />
                    {expanded ? (
                      <ChevronUp className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                </div>
              </button>
              {(isOwner || isAdminUser) && (
                <div className="flex items-center gap-1 flex-shrink-0 mt-0.5">
                  {isOwner && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditForm({
                          title: doubt.title,
                          content: doubt.content,
                          subjectTag: doubt.subjectTag,
                        });
                        setEditOpen(true);
                      }}
                      className="flex items-center justify-center w-7 h-7 rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                      title="Edit doubt"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={deleteDoubt.isPending}
                    className="flex items-center justify-center w-7 h-7 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Delete doubt"
                  >
                    {deleteDoubt.isPending ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>
              )}
            </div>
          </CardHeader>

          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <CardContent className="pt-0">
                  <div className="border-t border-border pt-4 space-y-4">
                    {/* Doubt content */}
                    <p className="text-foreground/90 text-sm leading-relaxed bg-secondary/30 rounded-lg p-3">
                      {doubt.content}
                    </p>

                    {/* Comments */}
                    {doubt.comments.length > 0 && (
                      <div className="space-y-3">
                        <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          {doubt.comments.length} Answer
                          {doubt.comments.length !== 1 ? "s" : ""}
                        </h4>
                        <ScrollArea
                          className={
                            doubt.comments.length > 3 ? "h-48" : "h-auto"
                          }
                        >
                          <div className="space-y-3 pr-2">
                            {doubt.comments.map((comment, idx) => (
                              // biome-ignore lint/suspicious/noArrayIndexKey: comments have no stable unique id
                              <div key={idx} className="flex gap-2.5 text-sm">
                                <div className="w-6 h-6 rounded-full bg-primary/20 text-primary text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                                  {getInitials(comment.authorName)}
                                </div>
                                <div className="flex-1 bg-muted/30 rounded-lg px-3 py-2">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="font-medium text-xs text-foreground">
                                      {comment.authorName}
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                      {formatRelativeTime(comment.timestamp)}
                                    </span>
                                  </div>
                                  <p className="text-foreground/80 leading-relaxed">
                                    {comment.content}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </ScrollArea>
                      </div>
                    )}

                    {/* Add comment */}
                    {isLoggedIn ? (
                      <div className="flex gap-2">
                        <Input
                          placeholder="Add your answer..."
                          value={commentText}
                          onChange={(e) => setCommentText(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                              e.preventDefault();
                              void handleComment();
                            }
                          }}
                          className="bg-secondary border-border"
                        />
                        <Button
                          onClick={handleComment}
                          disabled={addComment.isPending || !commentText.trim()}
                          size="icon"
                          className="bg-primary text-primary-foreground flex-shrink-0"
                        >
                          {addComment.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Send className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground text-center py-2">
                        Login to add an answer
                      </p>
                    )}
                  </div>
                </CardContent>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>
      </motion.div>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="bg-card border-border max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-heading">Edit Doubt</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Update your question details.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor={`edit-doubt-title-${String(doubt.id)}`}>
                Question
              </Label>
              <Input
                id={`edit-doubt-title-${String(doubt.id)}`}
                placeholder="e.g., How does dynamic memory allocation work?"
                value={editForm.title}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, title: e.target.value }))
                }
                className="bg-secondary border-border"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor={`edit-doubt-subject-${String(doubt.id)}`}>
                Subject
              </Label>
              <Select
                value={editForm.subjectTag}
                onValueChange={(v) =>
                  setEditForm((f) => ({ ...f, subjectTag: v }))
                }
              >
                <SelectTrigger className="bg-secondary border-border">
                  <SelectValue placeholder="Select subject" />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  {SUBJECT_TAGS.map((tag) => (
                    <SelectItem key={tag} value={tag}>
                      {tag}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor={`edit-doubt-content-${String(doubt.id)}`}>
                Details
              </Label>
              <Textarea
                id={`edit-doubt-content-${String(doubt.id)}`}
                placeholder="Describe your doubt in detail..."
                value={editForm.content}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, content: e.target.value }))
                }
                className="bg-secondary border-border min-h-[100px] resize-none"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditOpen(false)}
              className="border-border"
            >
              Cancel
            </Button>
            <Button
              onClick={handleEdit}
              disabled={updateDoubt.isPending}
              className="bg-primary text-primary-foreground"
            >
              {updateDoubt.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default function DoubtsPage() {
  const { identity } = useInternetIdentity();
  const currentPrincipal = identity?.getPrincipal().toString() ?? null;
  const { data: doubts, isLoading } = useGetDoubts();
  const { data: profile } = useGetMyProfile();
  const { data: isAdminData } = useIsAdmin();
  const createDoubt = useCreateDoubt();

  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({ title: "", content: "", subjectTag: "" });

  const filtered = (doubts ?? []).filter((d) => {
    const matchTag = !selectedTag || d.subjectTag === selectedTag;
    const matchSearch =
      !search ||
      d.title.toLowerCase().includes(search.toLowerCase()) ||
      d.content.toLowerCase().includes(search.toLowerCase());
    return matchTag && matchSearch;
  });

  const handleCreate = async () => {
    if (!profile) {
      toast.error(
        "Please set up your profile first. Go to the Profile page to create one.",
      );
      return;
    }
    if (!form.title.trim() || !form.content.trim() || !form.subjectTag) {
      toast.error("Please fill in all fields");
      return;
    }
    try {
      await createDoubt.mutateAsync(form);
      toast.success("Question posted!");
      setCreateOpen(false);
      setForm({ title: "", content: "", subjectTag: "" });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      const displayMsg =
        msg.includes("Anonymous") ||
        msg.includes("not registered") ||
        msg.includes("Unauthorized")
          ? "Please wait a moment and try again — your session is being set up."
          : msg.includes("User profile not found")
            ? "Please set up your profile first before posting."
            : msg.includes("Title must be between")
              ? (msg.split("rejected:").pop()?.trim() ??
                "Title is too short or too long.")
              : "Failed to post question. Please try again.";
      toast.error(displayMsg);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground flex items-center gap-2">
            <HelpCircle className="h-6 w-6 text-primary" />
            Doubts & Q&A
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Ask questions and help your peers
          </p>
        </div>
        {identity && (
          <Button
            onClick={() => setCreateOpen(true)}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="h-4 w-4 mr-2" />
            Ask a Question
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search questions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-card border-border"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setSelectedTag(null)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
              !selectedTag
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card text-muted-foreground border-border hover:border-primary/50"
            }`}
          >
            All
          </button>
          {SUBJECT_TAGS.map((tag) => (
            <button
              type="button"
              key={tag}
              onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                selectedTag === tag
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card text-muted-foreground border-border hover:border-primary/50"
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="space-y-3">
          {(["sk-1", "sk-2", "sk-3", "sk-4"] as const).map((k) => (
            <CardSkeleton key={k} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<HelpCircle />}
          title="No questions yet"
          description={
            selectedTag
              ? `No questions for ${selectedTag}. Switch subject or ask one!`
              : "Be the first to ask a question."
          }
          action={
            identity ? (
              <Button onClick={() => setCreateOpen(true)} size="sm">
                <Plus className="h-4 w-4 mr-1" /> Ask a Question
              </Button>
            ) : undefined
          }
        />
      ) : (
        <motion.div layout className="space-y-3">
          <AnimatePresence>
            {filtered.map((doubt) => (
              <DoubtCard
                key={String(doubt.id)}
                doubt={doubt}
                isLoggedIn={!!identity}
                currentPrincipal={currentPrincipal}
                isAdminUser={!!isAdminData}
              />
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="bg-card border-border max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-heading">Ask a Question</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Post your academic doubt and get help from fellow students.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="doubt-title">Question</Label>
              <Input
                id="doubt-title"
                placeholder="e.g., How does dynamic memory allocation work?"
                value={form.title}
                onChange={(e) =>
                  setForm((f) => ({ ...f, title: e.target.value }))
                }
                className="bg-secondary border-border"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="doubt-subject">Subject</Label>
              <Select
                value={form.subjectTag}
                onValueChange={(v) => setForm((f) => ({ ...f, subjectTag: v }))}
              >
                <SelectTrigger className="bg-secondary border-border">
                  <SelectValue placeholder="Select subject" />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  {SUBJECT_TAGS.map((tag) => (
                    <SelectItem key={tag} value={tag}>
                      {tag}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="doubt-content">Details</Label>
              <Textarea
                id="doubt-content"
                placeholder="Describe your doubt in detail..."
                value={form.content}
                onChange={(e) =>
                  setForm((f) => ({ ...f, content: e.target.value }))
                }
                className="bg-secondary border-border min-h-[100px] resize-none"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCreateOpen(false)}
              className="border-border"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={createDoubt.isPending}
              className="bg-primary text-primary-foreground"
            >
              {createDoubt.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Posting...
                </>
              ) : (
                "Post Question"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
