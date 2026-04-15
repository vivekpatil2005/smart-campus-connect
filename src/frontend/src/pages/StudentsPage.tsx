import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  BookOpen,
  HelpCircle,
  Loader2,
  Search,
  UserCheck,
  UserMinus,
  UserPlus,
  Users,
} from "lucide-react";
import { motion } from "motion/react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  type KnownUser,
  useFollowUser,
  useGetDoubts,
  useGetFollowing,
  useGetKnownUsers,
  useGetMyProfile,
  useGetStudyPosts,
  useUnfollowUser,
} from "../hooks/useQueries";
import { decodeProfile } from "../utils/profileUtils";
import { getInitials } from "../utils/timeUtils";

// ─── Avatar color helper ─────────────────────────────────────────────────────

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

// ─── Student Mini-Profile Modal ───────────────────────────────────────────────

function StudentProfileModal({
  user,
  open,
  onClose,
  isFollowing,
  onFollow,
  onUnfollow,
  followPending,
}: {
  user: KnownUser;
  open: boolean;
  onClose: () => void;
  isFollowing: boolean;
  onFollow: () => void;
  onUnfollow: () => void;
  followPending: boolean;
}) {
  const { data: posts = [] } = useGetStudyPosts();
  const { data: doubts = [] } = useGetDoubts();

  const userPostCount = posts.filter(
    (p) => p.author.toString() === user.principal,
  ).length;
  const userDoubtCount = doubts.filter(
    (d) => d.author.toString() === user.principal,
  ).length;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        className="bg-card border-border max-w-sm"
        data-ocid="students.dialog"
      >
        <DialogHeader>
          <DialogTitle className="font-heading sr-only">
            Student Profile
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {/* Profile header */}
          <div className="flex items-center gap-4">
            <Avatar className="h-14 w-14">
              <AvatarFallback
                className={`text-lg font-bold ${getAvatarColor(user.displayName)}`}
              >
                {getInitials(user.displayName)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-heading font-bold text-lg text-foreground">
                {user.displayName}
              </h3>
              {user.username && (
                <p className="text-primary text-sm font-mono">
                  @{user.username}
                </p>
              )}
              <Badge
                variant="outline"
                className="mt-1 text-xs border-primary/30 text-primary"
              >
                {user.role || "Student"}
              </Badge>
            </div>
          </div>

          {/* Bio */}
          {user.bio && (
            <p className="text-sm text-foreground/80 leading-relaxed border-l-2 border-primary/30 pl-3">
              {user.bio}
            </p>
          )}

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-secondary rounded-lg p-3 text-center">
              <div className="flex items-center justify-center gap-1.5 mb-1">
                <BookOpen className="h-3.5 w-3.5 text-primary" />
                <span className="text-xs text-muted-foreground">Posts</span>
              </div>
              <p className="font-heading font-bold text-foreground">
                {userPostCount}
              </p>
            </div>
            <div className="bg-secondary rounded-lg p-3 text-center">
              <div className="flex items-center justify-center gap-1.5 mb-1">
                <HelpCircle className="h-3.5 w-3.5 text-primary" />
                <span className="text-xs text-muted-foreground">Doubts</span>
              </div>
              <p className="font-heading font-bold text-foreground">
                {userDoubtCount}
              </p>
            </div>
          </div>

          {/* Follow/Unfollow */}
          <Button
            className={`w-full ${isFollowing ? "border-border" : "bg-primary text-primary-foreground"}`}
            variant={isFollowing ? "outline" : "default"}
            disabled={followPending}
            onClick={isFollowing ? onUnfollow : onFollow}
          >
            {followPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : isFollowing ? (
              <UserMinus className="h-4 w-4 mr-2" />
            ) : (
              <UserPlus className="h-4 w-4 mr-2" />
            )}
            {isFollowing ? "Unfollow" : "Follow"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Student Card ─────────────────────────────────────────────────────────────

function StudentCard({
  user,
  index,
  isFollowing,
  onFollow,
  onUnfollow,
  followPending,
}: {
  user: KnownUser;
  index: number;
  isFollowing: boolean;
  onFollow: () => void;
  onUnfollow: () => void;
  followPending: boolean;
}) {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05 }}
      >
        <Card
          className="border-border bg-card campus-card"
          data-ocid={`students.student_card.${index + 1}`}
        >
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Avatar className="h-10 w-10 flex-shrink-0">
                <AvatarFallback
                  className={`text-sm font-bold ${getAvatarColor(user.displayName)}`}
                >
                  {getInitials(user.displayName)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-heading font-semibold text-foreground text-sm">
                      {user.displayName}
                    </p>
                    {user.username && (
                      <p className="text-primary text-xs font-mono">
                        @{user.username}
                      </p>
                    )}
                  </div>
                  <Badge
                    variant="outline"
                    className="text-[10px] border-primary/20 text-muted-foreground flex-shrink-0"
                  >
                    {user.role || "Student"}
                  </Badge>
                </div>
                {user.bio && (
                  <p className="text-muted-foreground text-xs line-clamp-2 mt-1">
                    {user.bio}
                  </p>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 mt-3">
              <Button
                data-ocid={`students.view_profile_button.${index + 1}`}
                variant="outline"
                size="sm"
                className="flex-1 border-border text-xs h-8"
                onClick={() => setModalOpen(true)}
              >
                View Profile
              </Button>
              {isFollowing ? (
                <Button
                  data-ocid={`students.unfollow_button.${index + 1}`}
                  variant="outline"
                  size="sm"
                  className="border-border text-xs h-8"
                  disabled={followPending}
                  onClick={onUnfollow}
                >
                  {followPending ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <UserCheck className="h-3.5 w-3.5 mr-1" />
                  )}
                  Following
                </Button>
              ) : (
                <Button
                  data-ocid={`students.follow_button.${index + 1}`}
                  size="sm"
                  className="bg-primary text-primary-foreground text-xs h-8"
                  disabled={followPending}
                  onClick={onFollow}
                >
                  {followPending ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <UserPlus className="h-3.5 w-3.5 mr-1" />
                  )}
                  Follow
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {modalOpen && (
        <StudentProfileModal
          user={user}
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          isFollowing={isFollowing}
          onFollow={() => {
            onFollow();
            setModalOpen(false);
          }}
          onUnfollow={() => {
            onUnfollow();
            setModalOpen(false);
          }}
          followPending={followPending}
        />
      )}
    </>
  );
}

// ─── Main StudentsPage ────────────────────────────────────────────────────────

export default function StudentsPage() {
  const { data: knownUsers = [], isLoading } = useGetKnownUsers();
  const { data: myProfile } = useGetMyProfile();
  const { following } = useGetFollowing();
  const followUser = useFollowUser();
  const unfollowUser = useUnfollowUser();
  const [search, setSearch] = useState("");
  const [followingFilter, setFollowingFilter] = useState<"all" | "following">(
    "all",
  );
  const [pendingPrincipal, setPendingPrincipal] = useState<string | null>(null);

  const myUsername = myProfile ? decodeProfile(myProfile).username : "";

  const filtered = useMemo(() => {
    let list = knownUsers;
    if (followingFilter === "following") {
      list = list.filter((u) => following.includes(u.principal));
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (u) =>
          u.username.toLowerCase().includes(q) ||
          u.displayName.toLowerCase().includes(q),
      );
    }
    return list;
  }, [knownUsers, search, followingFilter, following]);

  const handleFollow = async (principal: string) => {
    if (!myUsername) {
      toast.error("Set up your username first to follow students");
      return;
    }
    setPendingPrincipal(principal);
    try {
      await followUser.mutateAsync(principal);
      toast.success("Following!");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to follow";
      toast.error(msg);
    } finally {
      setPendingPrincipal(null);
    }
  };

  const handleUnfollow = async (principal: string) => {
    setPendingPrincipal(principal);
    try {
      await unfollowUser.mutateAsync(principal);
      toast.success("Unfollowed");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to unfollow";
      toast.error(msg);
    } finally {
      setPendingPrincipal(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground flex items-center gap-2">
          <Users className="h-6 w-6 text-primary" />
          Students
        </h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          Discover and connect with fellow campus students
        </p>
      </div>

      {/* Search + Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            data-ocid="students.search_input"
            placeholder="Search by username or name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-secondary border-border"
          />
        </div>
        <div className="flex gap-2">
          <Button
            data-ocid="students.filter.tab"
            variant={followingFilter === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setFollowingFilter("all")}
            className={
              followingFilter === "all"
                ? "bg-primary text-primary-foreground"
                : "border-border"
            }
          >
            All ({knownUsers.length})
          </Button>
          <Button
            variant={followingFilter === "following" ? "default" : "outline"}
            size="sm"
            onClick={() => setFollowingFilter("following")}
            className={
              followingFilter === "following"
                ? "bg-primary text-primary-foreground"
                : "border-border"
            }
          >
            Following ({following.length})
          </Button>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div
          className="flex items-center justify-center py-16"
          data-ocid="students.loading_state"
        >
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <p className="text-muted-foreground text-sm">
              Discovering students...
            </p>
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center py-16 gap-3 text-center"
          data-ocid="students.empty_state"
        >
          <Users className="h-12 w-12 text-muted-foreground/30" />
          <div>
            <p className="font-medium text-foreground/70">
              {search
                ? "No students match your search"
                : followingFilter === "following"
                  ? "You're not following anyone yet"
                  : "No other students discovered yet"}
            </p>
            <p className="text-muted-foreground text-sm mt-1">
              {!search && followingFilter === "all"
                ? "Students appear here once they post study materials or ask doubts."
                : null}
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filtered.map((user, idx) => (
            <StudentCard
              key={user.principal}
              user={user}
              index={idx}
              isFollowing={following.includes(user.principal)}
              onFollow={() => void handleFollow(user.principal)}
              onUnfollow={() => void handleUnfollow(user.principal)}
              followPending={pendingPrincipal === user.principal}
            />
          ))}
        </div>
      )}
    </div>
  );
}
