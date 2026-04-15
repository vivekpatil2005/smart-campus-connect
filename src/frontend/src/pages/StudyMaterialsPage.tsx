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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { BookOpen, Heart, Loader2, Plus, Search, Trash2 } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import type { StudyPost } from "../backend.d";
import { EmptyState } from "../components/EmptyState";
import { CardSkeleton, LoadingSpinner } from "../components/LoadingSpinner";
import { SUBJECT_TAGS, SubjectTagBadge } from "../components/SubjectTagBadge";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useCreateStudyPost,
  useDeleteStudyPost,
  useGetMyProfile,
  useGetStudyPosts,
  useIsAdmin,
  useLikeStudyPost,
} from "../hooks/useQueries";
import { formatRelativeTime, getInitials } from "../utils/timeUtils";

function StudyPostCard({
  post,
  onLike,
  isLiking,
  currentPrincipal,
  onDelete,
  isDeleting,
  isOwner,
  isAdminUser,
}: {
  post: StudyPost;
  onLike: (id: bigint) => void;
  isLiking: boolean;
  currentPrincipal: string | null;
  onDelete: (id: bigint) => void;
  isDeleting: boolean;
  isOwner: boolean;
  isAdminUser: boolean;
}) {
  const likeCount = post.likes.length;
  const hasLiked = currentPrincipal
    ? post.likes.some((p) => p.toString() === currentPrincipal)
    : false;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
    >
      <Card className="campus-card border-border bg-card h-full flex flex-col">
        <CardHeader className="pb-3 flex-shrink-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-heading font-semibold text-foreground line-clamp-2 leading-snug">
              {post.title}
            </h3>
            <SubjectTagBadge tag={post.subjectTag} className="flex-shrink-0" />
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
            <div className="flex items-center justify-center w-5 h-5 rounded-full bg-primary/20 text-primary text-[10px] font-bold">
              {getInitials(post.authorName)}
            </div>
            <span>{post.authorName}</span>
            <span>·</span>
            <span>{formatRelativeTime(post.timestamp)}</span>
          </div>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col">
          <p className="text-muted-foreground text-sm leading-relaxed line-clamp-3 flex-1">
            {post.content}
          </p>
          <div className="mt-3 pt-3 border-t border-border flex items-center justify-between">
            <button
              type="button"
              onClick={() => onLike(post.id)}
              disabled={isLiking || !currentPrincipal}
              className={`flex items-center gap-1.5 text-sm transition-colors ${
                hasLiked
                  ? "text-red-400"
                  : "text-muted-foreground hover:text-red-400"
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <Heart className={`h-4 w-4 ${hasLiked ? "fill-current" : ""}`} />
              <span>{likeCount}</span>
            </button>
            <div className="flex items-center gap-2">
              {!currentPrincipal && (
                <span className="text-xs text-muted-foreground">
                  Login to like
                </span>
              )}
              {(isOwner || isAdminUser) && (
                <button
                  type="button"
                  onClick={() => onDelete(post.id)}
                  disabled={isDeleting}
                  className="flex items-center justify-center w-7 h-7 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Delete post"
                >
                  {isDeleting ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="h-3.5 w-3.5" />
                  )}
                </button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default function StudyMaterialsPage() {
  const { identity } = useInternetIdentity();
  const currentPrincipal = identity?.getPrincipal().toString() ?? null;

  const { data: posts, isLoading } = useGetStudyPosts();
  const { data: profile } = useGetMyProfile();
  const { data: isAdminData } = useIsAdmin();
  const createPost = useCreateStudyPost();
  const likePost = useLikeStudyPost();
  const deletePost = useDeleteStudyPost();

  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({ title: "", content: "", subjectTag: "" });

  const filtered = (posts ?? []).filter((p) => {
    const matchTag = !selectedTag || p.subjectTag === selectedTag;
    const matchSearch =
      !search ||
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.content.toLowerCase().includes(search.toLowerCase());
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
      await createPost.mutateAsync(form);
      toast.success("Study post created!");
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
              : "Failed to create post. Please try again.";
      toast.error(displayMsg);
    }
  };

  const handleLike = async (id: bigint) => {
    try {
      await likePost.mutateAsync(id);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      const displayMsg =
        msg.includes("Anonymous") ||
        msg.includes("not registered") ||
        msg.includes("Unauthorized")
          ? "Please wait a moment and try again — your session is being set up."
          : "Failed to like post. Please try again.";
      toast.error(displayMsg);
    }
  };

  const handleDelete = async (id: bigint) => {
    try {
      await deletePost.mutateAsync(id);
      toast.success("Post deleted");
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      const displayMsg = msg.includes("Not authorized")
        ? "You are not authorized to delete this post."
        : msg.includes("Post not found")
          ? "Post not found."
          : "Failed to delete post. Please try again.";
      toast.error(displayMsg);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-primary" />
            Study Materials
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Share and discover study resources
          </p>
        </div>
        {identity && (
          <Button
            onClick={() => setCreateOpen(true)}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Post
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search study materials..."
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
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {(["sk-1", "sk-2", "sk-3", "sk-4", "sk-5", "sk-6"] as const).map(
            (k) => (
              <CardSkeleton key={k} />
            ),
          )}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<BookOpen />}
          title="No study materials yet"
          description={
            selectedTag
              ? `No posts found for ${selectedTag}. Try a different subject.`
              : "Be the first to share a study resource!"
          }
          action={
            identity ? (
              <Button onClick={() => setCreateOpen(true)} size="sm">
                <Plus className="h-4 w-4 mr-1" /> Share Something
              </Button>
            ) : undefined
          }
        />
      ) : (
        <motion.div
          layout
          className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
        >
          <AnimatePresence>
            {filtered.map((post) => (
              <StudyPostCard
                key={String(post.id)}
                post={post}
                onLike={handleLike}
                isLiking={likePost.isPending}
                currentPrincipal={currentPrincipal}
                onDelete={handleDelete}
                isDeleting={deletePost.isPending}
                isOwner={post.author.toString() === currentPrincipal}
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
            <DialogTitle className="font-heading">
              Share Study Material
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Help your fellow students by sharing notes, resources, or
              summaries.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                placeholder="e.g., Operating Systems — Chapter 5 Notes"
                value={form.title}
                onChange={(e) =>
                  setForm((f) => ({ ...f, title: e.target.value }))
                }
                className="bg-secondary border-border"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="subject">Subject</Label>
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
              <Label htmlFor="content">Content</Label>
              <Textarea
                id="content"
                placeholder="Share your notes, key concepts, or resources..."
                value={form.content}
                onChange={(e) =>
                  setForm((f) => ({ ...f, content: e.target.value }))
                }
                className="bg-secondary border-border min-h-[120px] resize-none"
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
              disabled={createPost.isPending}
              className="bg-primary text-primary-foreground"
            >
              {createPost.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Publishing...
                </>
              ) : (
                "Publish"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
