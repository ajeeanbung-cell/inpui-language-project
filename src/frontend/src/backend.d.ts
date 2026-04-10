import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export type UserId = string;
export type Timestamp = bigint;
export interface Contributor {
    id: UserId;
    name: string;
    joinedAt: Timestamp;
    contributionCount: bigint;
    isVerified: boolean;
}
export interface ParallelUploadEntry {
    id: bigint;
    status: string;
    submittedBy: UserId;
    timestamp: Timestamp;
    inpui: string;
    english: string;
}
export interface QueueEntry {
    id: bigint;
    source: string;
    submittedBy: UserId;
    isDuplicate: boolean;
    timestamp: Timestamp;
    inpui?: string;
    english?: string;
}
export interface CorpusEntry {
    id: bigint;
    isApproved: boolean;
    tags: Array<string>;
    audioId?: string;
    addedBy: UserId;
    audioStorageId?: string;
    timestamp: Timestamp;
    category: string;
    inpui: string;
    english: string;
}
export interface Stats {
    totalFavorites: bigint;
    totalEntries: bigint;
    queueSize: bigint;
    activeContributors: bigint;
}
export interface ChatMessage {
    id: bigint;
    isDeleted: boolean;
    content: string;
    authorId: UserId;
    authorName: string;
    entryId: bigint;
    timestamp: Timestamp;
}
export interface AdminSettings {
    qrCodeData: string;
    adminPrincipals: Array<string>;
    upiId: string;
}
export interface backendInterface {
    addAdminPrincipal(principal: string): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    addBulkToQueue(entries: Array<[string | null, string | null]>, source: string): Promise<bigint>;
    addChatMessage(entryId: bigint, authorName: string, content: string): Promise<{
        __kind__: "ok";
        ok: bigint;
    } | {
        __kind__: "err";
        err: string;
    }>;
    addCorpusEntry(inpui: string, english: string, category: string, tags: Array<string>, audioId: string | null): Promise<bigint>;
    addToQueue(inpui: string | null, english: string | null, source: string): Promise<bigint>;
    approveParallelEntry(id: bigint): Promise<boolean>;
    approveQueueEntry(id: bigint, inpui: string, english: string, category: string, tags: Array<string>): Promise<bigint>;
    autoSetFirstAdmin(): Promise<void>;
    awardBadge(contributorId: string): Promise<boolean>;
    deleteChatMessage(messageId: bigint): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    deleteCorpusEntry(id: bigint): Promise<{
        __kind__: "ok";
        ok: string | null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    exportCorpus(): Promise<Array<CorpusEntry>>;
    getAdminPrincipals(): Promise<Array<string>>;
    getAdminSettings(): Promise<AdminSettings>;
    getChatMessages(entryId: bigint): Promise<Array<ChatMessage>>;
    getContributors(): Promise<Array<Contributor>>;
    getCorpusEntries(): Promise<Array<CorpusEntry>>;
    getFavorites(userId: string): Promise<Array<bigint>>;
    getLeaderboard(): Promise<Array<Contributor>>;
    getPendingParallelEntries(): Promise<Array<ParallelUploadEntry>>;
    getPredictions(text: string): Promise<Array<[CorpusEntry, number]>>;
    getQueue(): Promise<Array<QueueEntry>>;
    getStats(): Promise<Stats>;
    isCallerAdmin(): Promise<boolean>;
    registerContributor(name: string): Promise<boolean>;
    rejectParallelEntry(id: bigint): Promise<boolean>;
    removeAdminPrincipal(principal: string): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    removeFromQueue(id: bigint): Promise<boolean>;
    searchCorpus(searchTerm: string, category: string | null): Promise<Array<CorpusEntry>>;
    submitParallelEntries(entries: Array<[string, string]>): Promise<bigint>;
    submitPredictionFeedback(entryId: bigint, predictedTranslation: string, isCorrect: boolean): Promise<boolean>;
    toggleFavorite(entryId: bigint, userId: string): Promise<boolean>;
    updateAdminSettings(upiId: string, qrCodeData: string): Promise<boolean>;
    updateCorpusEntry(id: bigint, inpui: string, english: string, category: string, tags: Array<string>): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
}
