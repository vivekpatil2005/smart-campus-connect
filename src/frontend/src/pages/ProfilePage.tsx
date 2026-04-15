import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  AtSign,
  BookOpen,
  CheckCircle2,
  Edit2,
  Info,
  Loader2,
  Save,
  User,
  XCircle,
} from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { EmptyState } from "../components/EmptyState";
import { CardSkeleton } from "../components/LoadingSpinner";
import { SubjectTagBadge } from "../components/SubjectTagBadge";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useGetKnownUsers,
  useGetMyProfile,
  useGetStudyPosts,
  useSaveProfileWithUsername,
} from "../hooks/useQueries";
import { decodeProfile, isValidUsername } from "../utils/profileUtils";
import { formatRelativeTime, getInitials } from "../utils/timeUtils";

// Debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

export default function ProfilePage() {
  const { identity } = useInternetIdentity();
  const { data: profile, isLoading: profileLoading } = useGetMyProfile();
  const { data: allPosts, isLoading: postsLoading } = useGetStudyPosts();
  const { data: knownUsers = [] } = useGetKnownUsers();
  const saveProfile = useSaveProfileWithUsername();

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    displayName: "",
    username: "",
    bio: "",
  });

  // Initialize form from profile
  useEffect(() => {
    if (profile) {
      const parsed = decodeProfile(profile);
      setForm({
        displayName: profile.displayName,
        username: parsed.username,
        bio: parsed.bio,
      });
    }
  }, [profile]);

  // Prompt setup if no profile or no username
  useEffect(() => {
    if (
      !profileLoading &&
      identity &&
      (!profile ||
        !decodeProfile(profile ?? { displayName: "", bio: "", role: "" })
          .username)
    ) {
      setEditing(true);
    }
  }, [profileLoading, identity, profile]);

  const currentPrincipal = identity?.getPrincipal().toString();
  const myPosts = (allPosts ?? []).filter(
    (p) => p.author.toString() === currentPrincipal,
  );

  const parsedProfile = profile ? decodeProfile(profile) : null;

  // Debounced username for availability check
  const debouncedUsername = useDebounce(form.username, 600);

  // Check username availability
  const usernameAvailability = useMemo(() => {
    if (!debouncedUsername || debouncedUsername.length < 3) return null;
    if (!isValidUsername(debouncedUsername)) return "invalid";

    // Check if taken by another user
    const myCurrentUsername = parsedProfile?.username ?? "";
    if (debouncedUsername.toLowerCase() === myCurrentUsername.toLowerCase()) {
      return "own"; // same as current username, that's fine
    }

    const isTaken = knownUsers.some(
      (u) => u.username.toLowerCase() === debouncedUsername.toLowerCase(),
    );
    return isTaken ? "taken" : "available";
  }, [debouncedUsername, knownUsers, parsedProfile?.username]);

  const handleSave = async () => {
    const trimmedName = form.displayName.trim();
    const trimmedUsername = form.username.trim();

    if (!trimmedName) {
      toast.error("Display name is required");
      return;
    }
    if (trimmedName.length < 3) {
      toast.error("Display name must be at least 3 characters");
      return;
    }
    if (trimmedName.length > 30) {
      toast.error("Display name must be 30 characters or less");
      return;
    }
    if (!trimmedUsername) {
      toast.error("Username is required");
      return;
    }
    if (!isValidUsername(trimmedUsername)) {
      toast.error(
        "Username must be 3-20 characters, alphanumeric and underscores only",
      );
      return;
    }

    // Final availability check
    const myCurrentUsername = parsedProfile?.username ?? "";
    if (trimmedUsername.toLowerCase() !== myCurrentUsername.toLowerCase()) {
      const isTaken = knownUsers.some(
        (u) => u.username.toLowerCase() === trimmedUsername.toLowerCase(),
      );
      if (isTaken) {
        toast.error(
          `@${trimmedUsername} is already taken. Please choose another username.`,
        );
        return;
      }
    }

    try {
      await saveProfile.mutateAsync({
        displayName: trimmedName,
        username: trimmedUsername,
        bio: form.bio,
      });
      toast.success("Profile saved! You're all set to explore campus.");
      setEditing(false);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(msg || "Failed to save profile. Please try again.");
    }
  };

  const initials = getInitials(profile?.displayName || form.displayName || "U");
  const hasUsername = parsedProfile?.username;
  const isProfileIncomplete =
    !profileLoading && identity && (!profile || !hasUsername);

  const usernameStatus = () => {
    if (!form.username || form.username.length < 3) return null;
    if (!isValidUsername(form.username)) {
      return (
        <span className="flex items-center gap-1 text-destructive text-xs">
          <XCircle className="h-3.5 w-3.5" />
          Only letters, numbers, underscores (3-20 chars)
        </span>
      );
    }
    if (debouncedUsername !== form.username) {
      return <span className="text-muted-foreground text-xs">Checking...</span>;
    }
    switch (usernameAvailability) {
      case "available":
        return (
          <span className="flex items-center gap-1 text-emerald-400 text-xs">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Available
          </span>
        );
      case "taken":
        return (
          <span className="flex items-center gap-1 text-destructive text-xs">
            <XCircle className="h-3.5 w-3.5" />
            Already taken — choose another
          </span>
        );
      case "own":
        return (
          <span className="flex items-center gap-1 text-muted-foreground text-xs">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Your current username
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground flex items-center gap-2">
          <User className="h-6 w-6 text-primary" />
          Profile
        </h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          Your campus identity
        </p>
      </div>

      {/* Incomplete profile banner */}
      {isProfileIncomplete && (
        <Alert className="border-primary/30 bg-primary/5 text-foreground">
          <Info className="h-4 w-4 text-primary" />
          <AlertDescription className="text-sm">
            <span className="font-medium">Set up your username</span> to post
            study materials, chat with students, and be discovered by peers.
          </AlertDescription>
        </Alert>
      )}

      {/* Profile Card */}
      <Card className="border-border bg-card">
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              {/* Avatar */}
              <div className="w-16 h-16 rounded-2xl bg-primary/20 border-2 border-primary/30 flex items-center justify-center text-primary text-xl font-bold font-heading">
                {initials}
              </div>

              {profileLoading ? (
                <div className="space-y-2">
                  <div className="h-5 w-32 bg-muted rounded animate-pulse" />
                  <div className="h-4 w-20 bg-muted rounded animate-pulse" />
                </div>
              ) : profile ? (
                <div>
                  <h2 className="font-heading font-bold text-xl text-foreground">
                    {profile.displayName}
                  </h2>
                  {parsedProfile?.username && (
                    <p className="text-primary text-sm font-mono mt-0.5 flex items-center gap-1">
                      <AtSign className="h-3.5 w-3.5" />
                      {parsedProfile.username}
                    </p>
                  )}
                  <Badge
                    variant="outline"
                    className="mt-1 text-xs border-primary/30 text-primary"
                  >
                    {profile.role || "Student"}
                  </Badge>
                </div>
              ) : (
                <div>
                  <h2 className="font-heading font-bold text-xl text-muted-foreground">
                    New Student
                  </h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Set up your profile below
                  </p>
                </div>
              )}
            </div>

            {!editing && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditing(true)}
                className="border-border"
                data-ocid="profile.edit_button"
              >
                <Edit2 className="h-3.5 w-3.5 mr-1.5" />
                Edit
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent>
          {editing ? (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <div className="space-y-1.5">
                <Label htmlFor="display-name">Display Name *</Label>
                <Input
                  id="display-name"
                  data-ocid="profile.display_name_input"
                  placeholder="Your full name"
                  value={form.displayName}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, displayName: e.target.value }))
                  }
                  className="bg-secondary border-border"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="username">
                  Username *{" "}
                  <span className="text-muted-foreground font-normal text-xs">
                    (alphanumeric + underscore, 3-20 chars)
                  </span>
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    <AtSign className="h-4 w-4" />
                  </span>
                  <Input
                    id="username"
                    data-ocid="profile.username_input"
                    placeholder="your_username"
                    value={form.username}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        username: e.target.value
                          .toLowerCase()
                          .replace(/[^a-z0-9_]/g, ""),
                      }))
                    }
                    className="bg-secondary border-border pl-9"
                    maxLength={20}
                  />
                </div>
                <div className="min-h-[1.2rem]">{usernameStatus()}</div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  data-ocid="profile.bio_textarea"
                  placeholder="Tell others about yourself — year, branch, interests..."
                  value={form.bio}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, bio: e.target.value }))
                  }
                  className="bg-secondary border-border resize-none"
                  rows={3}
                  maxLength={120}
                />
                <p className="text-xs text-muted-foreground">
                  {form.bio.length}/120 characters
                </p>
              </div>

              <div className="flex gap-2">
                <Button
                  data-ocid="profile.save_button"
                  onClick={handleSave}
                  disabled={saveProfile.isPending}
                  className="bg-primary text-primary-foreground"
                >
                  {saveProfile.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Profile
                    </>
                  )}
                </Button>
                {profile && parsedProfile?.username && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setEditing(false);
                      setForm({
                        displayName: profile.displayName,
                        username: parsedProfile?.username ?? "",
                        bio: parsedProfile?.bio ?? "",
                      });
                    }}
                    className="border-border"
                  >
                    Cancel
                  </Button>
                )}
              </div>
            </motion.div>
          ) : (
            <div className="space-y-3">
              {parsedProfile?.bio ? (
                <p className="text-foreground/80 text-sm leading-relaxed">
                  {parsedProfile.bio}
                </p>
              ) : (
                <p className="text-muted-foreground text-sm italic">
                  No bio added yet.
                </p>
              )}

              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="font-mono">
                  {currentPrincipal
                    ? `${currentPrincipal.slice(0, 20)}...`
                    : "Anonymous"}
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* My Study Posts */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-muted-foreground" />
          <h2 className="font-heading font-semibold text-foreground">
            My Study Posts
          </h2>
          <span className="text-muted-foreground text-sm">
            ({myPosts.length})
          </span>
        </div>

        {postsLoading ? (
          <div className="space-y-3">
            {(["sk-a", "sk-b"] as const).map((k) => (
              <CardSkeleton key={k} />
            ))}
          </div>
        ) : myPosts.length === 0 ? (
          <EmptyState
            icon={<BookOpen />}
            title="No study posts yet"
            description="Share your first study material to help fellow students."
          />
        ) : (
          <div className="space-y-3">
            {myPosts.map((post, idx) => (
              <motion.div
                key={String(post.id)}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                <Card className="border-border bg-card campus-card">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-heading font-medium text-foreground line-clamp-1">
                        {post.title}
                      </h3>
                      <SubjectTagBadge
                        tag={post.subjectTag}
                        className="flex-shrink-0"
                      />
                    </div>
                    <p className="text-muted-foreground text-sm line-clamp-2 mt-1">
                      {post.content}
                    </p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                      <span>{formatRelativeTime(post.timestamp)}</span>
                      <span>·</span>
                      <span>{post.likes.length} likes</span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
