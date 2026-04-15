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
import { Textarea } from "@/components/ui/textarea";
import { Bell, Loader2, Megaphone, Plus } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { EmptyState } from "../components/EmptyState";
import { CardSkeleton } from "../components/LoadingSpinner";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useCreateAnnouncement,
  useGetAnnouncements,
  useIsAdmin,
} from "../hooks/useQueries";
import { formatDateTime, formatRelativeTime } from "../utils/timeUtils";

export default function AnnouncementsPage() {
  const { identity } = useInternetIdentity();
  const { data: announcements, isLoading } = useGetAnnouncements();
  const { data: isAdmin } = useIsAdmin();
  const createAnnouncement = useCreateAnnouncement();

  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({ title: "", content: "" });

  const sorted = [...(announcements ?? [])].sort((a, b) =>
    Number(b.timestamp - a.timestamp),
  );

  const handleCreate = async () => {
    if (!form.title.trim() || !form.content.trim()) {
      toast.error("Please fill in all fields");
      return;
    }
    try {
      await createAnnouncement.mutateAsync(form);
      toast.success("Announcement posted!");
      setCreateOpen(false);
      setForm({ title: "", content: "" });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      const displayMsg =
        msg.includes("Anonymous") ||
        msg.includes("not registered") ||
        msg.includes("Unauthorized")
          ? "Please wait a moment and try again — your session is being set up."
          : msg.includes("Not authorized")
            ? "Only admins can post announcements."
            : msg.includes("Title must be between")
              ? (msg.split("rejected:").pop()?.trim() ??
                "Title is too short or too long.")
              : "Failed to post announcement. Please try again.";
      toast.error(displayMsg);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground flex items-center gap-2">
            <Bell className="h-6 w-6 text-primary" />
            Announcements
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Official notices and campus updates
          </p>
        </div>
        {identity && isAdmin && (
          <Button
            onClick={() => setCreateOpen(true)}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="h-4 w-4 mr-2" />
            Post Announcement
          </Button>
        )}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="space-y-3">
          {(["sk-1", "sk-2", "sk-3", "sk-4"] as const).map((k) => (
            <CardSkeleton key={k} />
          ))}
        </div>
      ) : sorted.length === 0 ? (
        <EmptyState
          icon={<Megaphone />}
          title="No announcements yet"
          description="Important notices and updates will appear here."
        />
      ) : (
        <div className="space-y-3">
          {sorted.map((ann, idx) => (
            <motion.div
              key={String(ann.id)}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
            >
              <Card className="campus-card border-border bg-card overflow-hidden group">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 flex-shrink-0 mt-0.5">
                        <Megaphone className="h-4 w-4" />
                      </div>
                      <div>
                        <h3 className="font-heading font-semibold text-foreground leading-snug">
                          {ann.title}
                        </h3>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {formatDateTime(ann.timestamp)} ·{" "}
                          {formatRelativeTime(ann.timestamp)}
                        </p>
                      </div>
                    </div>
                    {idx === 0 && (
                      <span className="flex-shrink-0 px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-medium">
                        Latest
                      </span>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="pt-0 pl-[calc(2.25rem+0.75rem+0.75rem)]">
                  <p className="text-foreground/80 text-sm leading-relaxed">
                    {ann.content}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="bg-card border-border max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-heading">
              Post Announcement
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Send an important notice to all students.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="ann-title">Title</Label>
              <Input
                id="ann-title"
                placeholder="e.g., Mid-Semester Exam Schedule Released"
                value={form.title}
                onChange={(e) =>
                  setForm((f) => ({ ...f, title: e.target.value }))
                }
                className="bg-secondary border-border"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="ann-content">Content</Label>
              <Textarea
                id="ann-content"
                placeholder="Write the full announcement..."
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
              disabled={createAnnouncement.isPending}
              className="bg-primary text-primary-foreground"
            >
              {createAnnouncement.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Posting...
                </>
              ) : (
                "Post Announcement"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
