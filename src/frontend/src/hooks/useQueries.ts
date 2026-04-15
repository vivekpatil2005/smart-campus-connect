import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  Announcement,
  ChatMessage,
  Doubt,
  Event,
  Stats,
  StudyPost,
  UserProfile,
} from "../backend.d";
import { decodeProfile, encodeProfile } from "../utils/profileUtils";
import { useActor } from "./useActor";
import { useInternetIdentity } from "./useInternetIdentity";

// Ensures the user is registered before running a mutation, then retries once on auth errors
async function withAuthRetry<T>(
  actor: { registerUser: () => Promise<unknown> },
  fn: () => Promise<T>,
): Promise<T> {
  // Always ensure user is registered before attempting a mutation
  try {
    await actor.registerUser();
  } catch {
    // Ignore — registerUser is idempotent; failure is acceptable if already registered
  }

  try {
    return await fn();
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (
      msg.includes("User is not registered") ||
      msg.includes("Anonymous") ||
      msg.includes("Unauthorized")
    ) {
      // Wait and retry once more
      await new Promise((resolve) => setTimeout(resolve, 1500));
      try {
        await actor.registerUser();
      } catch {
        // ignore
      }
      return await fn();
    }
    throw err;
  }
}

// ─── Query Keys ──────────────────────────────────────────────────────────────

export const QUERY_KEYS = {
  stats: ["stats"],
  studyPosts: ["studyPosts"],
  doubts: ["doubts"],
  events: ["events"],
  announcements: ["announcements"],
  chatMessages: ["chatMessages"],
  myProfile: ["myProfile"],
  isAdmin: ["isAdmin"],
  knownUsers: ["knownUsers"],
} as const;

// ─── Known User Type ──────────────────────────────────────────────────────────

export interface KnownUser {
  principal: string;
  displayName: string;
  username: string;
  bio: string;
  role: string;
}

// ─── Read Queries ─────────────────────────────────────────────────────────────

export function useGetStats() {
  const { actor, isFetching } = useActor();
  return useQuery<Stats>({
    queryKey: QUERY_KEYS.stats,
    queryFn: async () => {
      if (!actor)
        return {
          eventCount: 0n,
          doubtCount: 0n,
          userCount: 0n,
          announcementCount: 0n,
          studyPostCount: 0n,
        } as Stats;
      return actor.getStats();
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 30_000,
  });
}

export function useGetStudyPosts() {
  const { actor, isFetching } = useActor();
  return useQuery<StudyPost[]>({
    queryKey: QUERY_KEYS.studyPosts,
    queryFn: async () => {
      if (!actor) return [];
      return actor.getStudyPosts();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetDoubts() {
  const { actor, isFetching } = useActor();
  return useQuery<Doubt[]>({
    queryKey: QUERY_KEYS.doubts,
    queryFn: async () => {
      if (!actor) return [];
      return actor.getDoubts();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetEvents() {
  const { actor, isFetching } = useActor();
  return useQuery<Event[]>({
    queryKey: QUERY_KEYS.events,
    queryFn: async () => {
      if (!actor) return [];
      return actor.getEvents();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetAnnouncements() {
  const { actor, isFetching } = useActor();
  return useQuery<Announcement[]>({
    queryKey: QUERY_KEYS.announcements,
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAnnouncements();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetChatMessages() {
  const { actor, isFetching } = useActor();
  return useQuery<ChatMessage[]>({
    queryKey: QUERY_KEYS.chatMessages,
    queryFn: async () => {
      if (!actor) return [];
      return actor.getChatMessages();
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 5000,
  });
}

export function useGetMyProfile() {
  const { actor, isFetching } = useActor();
  return useQuery<UserProfile | null>({
    queryKey: QUERY_KEYS.myProfile,
    queryFn: async () => {
      if (!actor) return null;
      try {
        const result = await actor.getMyProfile();
        return result ?? null;
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        if (msg.includes("User is not registered")) {
          await new Promise((resolve) => setTimeout(resolve, 1500));
          try {
            const result = await actor.getMyProfile();
            return result ?? null;
          } catch {
            return null;
          }
        }
        return null;
      }
    },
    enabled: !!actor && !isFetching,
    staleTime: 0,
  });
}

export function useIsAdmin() {
  const { actor, isFetching } = useActor();
  return useQuery<boolean>({
    queryKey: QUERY_KEYS.isAdmin,
    queryFn: async () => {
      if (!actor) return false;
      return actor.isAdmin();
    },
    enabled: !!actor && !isFetching,
  });
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export function useCreateStudyPost() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      title,
      content,
      subjectTag,
    }: { title: string; content: string; subjectTag: string }) => {
      if (!actor) throw new Error("Not authenticated");
      return withAuthRetry(actor, () =>
        actor.createStudyPost(title, content, subjectTag),
      );
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.studyPosts });
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.stats });
    },
  });
}

export function useLikeStudyPost() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("Not authenticated");
      return withAuthRetry(actor, () => actor.likeStudyPost(id));
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.studyPosts });
    },
  });
}

export function useCreateDoubt() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      title,
      content,
      subjectTag,
    }: { title: string; content: string; subjectTag: string }) => {
      if (!actor) throw new Error("Not authenticated");
      return withAuthRetry(actor, () =>
        actor.createDoubt(title, content, subjectTag),
      );
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.doubts });
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.stats });
    },
  });
}

export function useAddComment() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      doubtId,
      content,
    }: { doubtId: bigint; content: string }) => {
      if (!actor) throw new Error("Not authenticated");
      return withAuthRetry(actor, () => actor.addComment(doubtId, content));
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.doubts });
    },
  });
}

export function useCreateEvent() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      title,
      description,
      eventDate,
    }: { title: string; description: string; eventDate: bigint }) => {
      if (!actor) throw new Error("Not authenticated");
      return withAuthRetry(actor, () =>
        actor.createEvent(title, description, eventDate),
      );
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.events });
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.stats });
    },
  });
}

export function useCreateAnnouncement() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      title,
      content,
    }: { title: string; content: string }) => {
      if (!actor) throw new Error("Not authenticated");
      return withAuthRetry(actor, () =>
        actor.createAnnouncement(title, content),
      );
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.announcements,
      });
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.stats });
    },
  });
}

export function useSendChatMessage() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (content: string) => {
      if (!actor) throw new Error("Not authenticated");
      return withAuthRetry(actor, () => actor.sendChatMessage(content));
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.chatMessages });
    },
  });
}

export function useUpdateProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      displayName,
      bio,
    }: { displayName: string; bio: string }) => {
      if (!actor) throw new Error("Not authenticated");
      return withAuthRetry(actor, () => actor.updateProfile(displayName, bio));
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.myProfile });
      await queryClient.refetchQueries({ queryKey: QUERY_KEYS.myProfile });
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.isAdmin });
      void queryClient.refetchQueries({ queryKey: QUERY_KEYS.isAdmin });
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.stats });
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.knownUsers });
    },
  });
}

export function useDeleteStudyPost() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("Not authenticated");
      return withAuthRetry(actor, () => actor.deleteStudyPost(id));
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.studyPosts });
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.stats });
    },
  });
}

export function useDeleteDoubt() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("Not authenticated");
      return withAuthRetry(actor, () => actor.deleteDoubt(id));
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.doubts });
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.stats });
    },
  });
}

export function useUpdateDoubt() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      title,
      content,
      subjectTag,
    }: { id: bigint; title: string; content: string; subjectTag: string }) => {
      if (!actor) throw new Error("Not authenticated");
      return withAuthRetry(actor, () =>
        actor.updateDoubt(id, title, content, subjectTag),
      );
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.doubts });
    },
  });
}

// Manual trigger for registering the user in the backend access control system.
// Useful as a fallback if the auto-registration hook hasn't fired yet.
export function useRegisterUser() {
  const { actor } = useActor();
  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("Not authenticated");
      return actor.registerUser();
    },
  });
}

// ─── Known Users ──────────────────────────────────────────────────────────────

/**
 * Returns all registered users by calling getAllUserProfiles() directly.
 * Filters out the current user from the list.
 */
export function useGetKnownUsers() {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();

  return useQuery<KnownUser[]>({
    queryKey: QUERY_KEYS.knownUsers,
    queryFn: async () => {
      if (!actor) return [];
      const myPrincipal = identity?.getPrincipal().toString();
      const entries = await actor.getAllUserProfiles();
      return entries
        .filter((entry) => entry.principal.toString() !== myPrincipal)
        .map((entry) => {
          const parsed = decodeProfile(entry.profile);
          return {
            principal: entry.principal.toString(),
            displayName: entry.profile.displayName,
            username: parsed.username,
            bio: parsed.bio,
            role: entry.profile.role,
          } as KnownUser;
        });
    },
    enabled: !!actor && !isFetching,
    staleTime: 30_000,
    refetchInterval: 30_000,
  });
}

/**
 * Save profile with username encoded in the bio field.
 * Uses saveCallerUserProfile which has no bio length limit.
 */
export function useSaveProfileWithUsername() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      displayName,
      username,
      bio,
    }: { displayName: string; username: string; bio: string }) => {
      if (!actor) throw new Error("Not authenticated");

      // Get current role from existing profile
      let role = "Student";
      try {
        const existingProfile = await actor.getMyProfile();
        if (existingProfile?.role) role = existingProfile.role;
      } catch {
        // ignore
      }

      // Get current following list
      let following: string[] = [];
      try {
        const existingProfile = await actor.getMyProfile();
        if (existingProfile) {
          following = decodeProfile(existingProfile).following;
        }
      } catch {
        // ignore
      }

      const encoded = encodeProfile(
        { username, bio, following },
        displayName,
        role,
      );

      return withAuthRetry(actor, () => actor.saveCallerUserProfile(encoded));
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.myProfile });
      await queryClient.refetchQueries({ queryKey: QUERY_KEYS.myProfile });
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.knownUsers });
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.isAdmin });
      void queryClient.refetchQueries({ queryKey: QUERY_KEYS.isAdmin });
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.stats });
    },
  });
}

/**
 * Follow a user — updates the current user's following list in their encoded bio.
 */
export function useFollowUser() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (targetPrincipal: string) => {
      if (!actor) throw new Error("Not authenticated");

      const existingProfile = await actor.getMyProfile();
      if (!existingProfile) throw new Error("Profile not set up");

      const parsed = decodeProfile(existingProfile);
      if (parsed.following.includes(targetPrincipal)) return; // already following

      const newFollowing = [...parsed.following, targetPrincipal];
      const encoded = encodeProfile(
        { ...parsed, following: newFollowing },
        existingProfile.displayName,
        existingProfile.role,
      );

      return withAuthRetry(actor, () => actor.saveCallerUserProfile(encoded));
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.myProfile });
      await queryClient.refetchQueries({ queryKey: QUERY_KEYS.myProfile });
    },
  });
}

/**
 * Unfollow a user — removes from following list in encoded bio.
 */
export function useUnfollowUser() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (targetPrincipal: string) => {
      if (!actor) throw new Error("Not authenticated");

      const existingProfile = await actor.getMyProfile();
      if (!existingProfile) throw new Error("Profile not set up");

      const parsed = decodeProfile(existingProfile);
      const newFollowing = parsed.following.filter(
        (p) => p !== targetPrincipal,
      );
      const encoded = encodeProfile(
        { ...parsed, following: newFollowing },
        existingProfile.displayName,
        existingProfile.role,
      );

      return withAuthRetry(actor, () => actor.saveCallerUserProfile(encoded));
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.myProfile });
      await queryClient.refetchQueries({ queryKey: QUERY_KEYS.myProfile });
    },
  });
}

/**
 * Get the following list for the current user.
 */
export function useGetFollowing() {
  const { data: profile } = useGetMyProfile();
  const following = profile ? decodeProfile(profile).following : [];
  return { following };
}

// ─── Direct Messages ─────────────────────────────────────────────────────────
// DMs are stored as group chat messages with format: __DM:targetPrincipal:content
// They are filtered OUT of the group chat display.

const DM_PREFIX = "__DM:";

export function parseDmContent(
  rawContent: string,
): { to: string; body: string } | null {
  if (!rawContent.startsWith(DM_PREFIX)) return null;
  const rest = rawContent.slice(DM_PREFIX.length);
  const colonIdx = rest.indexOf(":");
  if (colonIdx === -1) return null;
  return {
    to: rest.slice(0, colonIdx),
    body: rest.slice(colonIdx + 1),
  };
}

export function buildDmContent(toPrincipal: string, body: string): string {
  return `${DM_PREFIX}${toPrincipal}:${body}`;
}

/**
 * Send a direct message to another user.
 */
export function useSendDirectMessage() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      toPrincipal,
      body,
    }: { toPrincipal: string; body: string }) => {
      if (!actor) throw new Error("Not authenticated");
      const content = buildDmContent(toPrincipal, body);
      return withAuthRetry(actor, () => actor.sendChatMessage(content));
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.chatMessages });
    },
  });
}

/**
 * Get DMs between the current user and another principal.
 */
export function useGetDirectMessages(otherPrincipal: string) {
  const { data: allMessages = [], isLoading } = useGetChatMessages();
  const { identity } = useInternetIdentity();
  const myPrincipal = identity?.getPrincipal().toString() ?? "";

  const dms = allMessages
    .filter((msg) => {
      if (!msg.content.startsWith(DM_PREFIX)) return false;
      const parsed = parseDmContent(msg.content);
      if (!parsed) return false;
      const authorStr = msg.author.toString();

      // Messages I sent to them
      if (authorStr === myPrincipal && parsed.to === otherPrincipal)
        return true;
      // Messages they sent to me
      if (authorStr === otherPrincipal && parsed.to === myPrincipal)
        return true;
      return false;
    })
    .map((msg) => {
      const parsed = parseDmContent(msg.content);
      return {
        id: msg.id,
        author: msg.author.toString(),
        authorName: msg.authorName,
        body: parsed?.body ?? "",
        timestamp: msg.timestamp,
        isOwn: msg.author.toString() === myPrincipal,
      };
    })
    .sort((a, b) => Number(a.timestamp - b.timestamp));

  return { dms, isLoading };
}

/**
 * Get all conversation partners (principals who have DMed with the current user).
 */
export function useGetConversationPartners() {
  const { data: allMessages = [], isLoading } = useGetChatMessages();
  const { identity } = useInternetIdentity();
  const myPrincipal = identity?.getPrincipal().toString() ?? "";

  const partnerMap = new Map<
    string,
    {
      principal: string;
      lastMessage: string;
      lastTimestamp: bigint;
      authorName: string;
    }
  >();

  for (const msg of allMessages) {
    if (!msg.content.startsWith(DM_PREFIX)) continue;
    const parsed = parseDmContent(msg.content);
    if (!parsed) continue;

    const authorStr = msg.author.toString();
    let partnerPrincipal: string | null = null;
    let partnerName = "";

    if (authorStr === myPrincipal && parsed.to !== myPrincipal) {
      // I sent this DM to someone
      partnerPrincipal = parsed.to;
      partnerName = `${parsed.to.slice(0, 8)}...`;
    } else if (parsed.to === myPrincipal && authorStr !== myPrincipal) {
      // Someone sent this DM to me
      partnerPrincipal = authorStr;
      partnerName = msg.authorName;
    }

    if (!partnerPrincipal) continue;

    const existing = partnerMap.get(partnerPrincipal);
    if (!existing || msg.timestamp > existing.lastTimestamp) {
      partnerMap.set(partnerPrincipal, {
        principal: partnerPrincipal,
        lastMessage: parsed.body,
        lastTimestamp: msg.timestamp,
        authorName: partnerName,
      });
    }
  }

  const partners = Array.from(partnerMap.values()).sort((a, b) =>
    Number(b.lastTimestamp - a.lastTimestamp),
  );

  return { partners, isLoading };
}
