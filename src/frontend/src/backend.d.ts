import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface Doubt {
    id: bigint;
    title: string;
    content: string;
    authorName: string;
    author: Principal;
    subjectTag: string;
    timestamp: bigint;
    comments: Array<Comment>;
}
export interface Comment {
    content: string;
    authorName: string;
    author: Principal;
    timestamp: bigint;
}
export interface Event {
    id: bigint;
    title: string;
    createdBy: Principal;
    description: string;
    timestamp: bigint;
    eventDate: bigint;
}
export interface UserProfileEntry {
    principal: Principal;
    profile: UserProfile;
}
export interface StudyPost {
    id: bigint;
    title: string;
    content: string;
    authorName: string;
    author: Principal;
    likes: Array<Principal>;
    subjectTag: string;
    timestamp: bigint;
}
export interface Stats {
    eventCount: bigint;
    doubtCount: bigint;
    userCount: bigint;
    announcementCount: bigint;
    studyPostCount: bigint;
}
export interface ChatMessage {
    id: bigint;
    content: string;
    authorName: string;
    author: Principal;
    timestamp: bigint;
}
export interface Announcement {
    id: bigint;
    title: string;
    content: string;
    createdBy: Principal;
    timestamp: bigint;
}
export interface UserProfile {
    bio: string;
    displayName: string;
    role: string;
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addComment(doubtId: bigint, content: string): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    createAnnouncement(title: string, content: string): Promise<void>;
    createDoubt(title: string, content: string, subjectTag: string): Promise<void>;
    createEvent(title: string, description: string, eventDate: bigint): Promise<void>;
    createStudyPost(title: string, content: string, subjectTag: string): Promise<void>;
    deleteDoubt(id: bigint): Promise<void>;
    deleteStudyPost(id: bigint): Promise<void>;
    getAllUserProfiles(): Promise<Array<UserProfileEntry>>;
    getAnnouncements(): Promise<Array<Announcement>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getChatMessages(): Promise<Array<ChatMessage>>;
    getDoubts(): Promise<Array<Doubt>>;
    getEvents(): Promise<Array<Event>>;
    getMyProfile(): Promise<UserProfile | null>;
    getStats(): Promise<Stats>;
    getStudyPosts(): Promise<Array<StudyPost>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isAdmin(): Promise<boolean>;
    isCallerAdmin(): Promise<boolean>;
    likeStudyPost(id: bigint): Promise<void>;
    registerUser(): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    sendChatMessage(content: string): Promise<void>;
    updateDoubt(id: bigint, title: string, content: string, subjectTag: string): Promise<void>;
    updateProfile(displayName: string, bio: string): Promise<void>;
}
