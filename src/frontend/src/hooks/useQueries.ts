/**
 * React Query hooks for the Inpui Language Project backend.
 * Wired to the real backend actor via useActor from @caffeineai/core-infrastructure.
 * Adapter functions bridge backend types (bigint ids, different field names) to frontend types.
 */
import { useActor } from "@caffeineai/core-infrastructure";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createActor } from "../backend";
import type {
  ChatMessage as BackendChatMessage,
  Contributor as BackendContributor,
  CorpusEntry as BackendCorpusEntry,
  ParallelUploadEntry as BackendParallelEntry,
  QueueEntry as BackendQueueEntry,
} from "../backend";
import type {
  AdminSettings,
  ChatMessage,
  Contributor,
  CorpusEntry,
  FileParseRow,
  ParallelUploadEntry,
  PredictionFeedback,
  PredictionResult,
  QueueEntry,
  Stats,
} from "../types";

// ─── Type adapters ────────────────────────────────────────────────────────────

function adaptCorpusEntry(e: BackendCorpusEntry): CorpusEntry {
  return {
    id: String(e.id),
    inpui: e.inpui,
    english: e.english,
    category: e.category,
    tags: e.tags,
    audioId: e.audioId ?? null,
    audioStorageId: e.audioStorageId ?? null,
    contributorId: e.addedBy ?? null,
    isFavorite: false,
    createdAt: e.timestamp,
  };
}

function adaptQueueEntry(e: BackendQueueEntry): QueueEntry {
  return {
    id: String(e.id),
    inpui: e.inpui ?? "",
    english: e.english ?? "",
    submittedBy: e.submittedBy ?? null,
    submittedAt: e.timestamp,
    isDuplicate: e.isDuplicate,
    source: e.source,
  } as QueueEntry & { source: string };
}

function adaptContributor(c: BackendContributor): Contributor {
  return {
    id: c.id,
    name: c.name,
    contributions: Number(c.contributionCount),
    isVerified: c.isVerified,
    badges: [],
    joinedAt: c.joinedAt,
  };
}

function adaptParallelEntry(e: BackendParallelEntry): ParallelUploadEntry {
  const status = e.status as "pending" | "approved" | "rejected";
  return {
    id: String(e.id),
    inpui: e.inpui,
    english: e.english,
    status: ["pending", "approved", "rejected"].includes(status)
      ? status
      : "pending",
    submittedBy: e.submittedBy ?? null,
    submittedAt: e.timestamp,
  };
}

function adaptChatMessage(m: BackendChatMessage): ChatMessage {
  return {
    id: String(m.id),
    entryId: String(m.entryId),
    authorId: m.authorId,
    authorName: m.authorName,
    content: m.content,
    timestamp: Number(m.timestamp),
    isDeleted: m.isDeleted,
  };
}

// ─── Corpus ──────────────────────────────────────────────────────────────────

export function useCorpusEntries() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery<CorpusEntry[]>({
    queryKey: ["corpus"],
    queryFn: async () => {
      if (!actor) return [];
      const entries = await actor.getCorpusEntries();
      return entries.map(adaptCorpusEntry);
    },
    enabled: !!actor && !isFetching,
    staleTime: 30_000,
  });
}

export function useSearchCorpus(query: string, category?: string) {
  const { actor, isFetching } = useActor(createActor);
  return useQuery<CorpusEntry[]>({
    queryKey: ["corpus", "search", query, category ?? ""],
    queryFn: async () => {
      if (!actor) return [];
      const entries = await actor.searchCorpus(query, category ?? null);
      return entries.map(adaptCorpusEntry);
    },
    enabled: !!actor && !isFetching,
  });
}

export function useFavorites(userId?: string) {
  const { actor, isFetching } = useActor(createActor);
  return useQuery<string[]>({
    queryKey: ["favorites", userId ?? ""],
    queryFn: async () => {
      if (!actor || !userId) return [];
      const ids = await actor.getFavorites(userId);
      return ids.map(String);
    },
    enabled: !!actor && !isFetching && !!userId,
  });
}

export function useToggleFavorite() {
  const { actor } = useActor(createActor);
  const qc = useQueryClient();
  return useMutation<void, Error, string | { entryId: string; userId: string }>(
    {
      mutationFn: async (arg) => {
        if (!actor) return;
        const entryId = typeof arg === "string" ? arg : arg.entryId;
        const userId = typeof arg === "string" ? "" : arg.userId;
        await actor.toggleFavorite(BigInt(entryId), userId);
      },
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: ["corpus"] });
        qc.invalidateQueries({ queryKey: ["favorites"] });
      },
    },
  );
}

export function useAddCorpusEntry() {
  const { actor } = useActor(createActor);
  const qc = useQueryClient();
  return useMutation<
    void,
    Error,
    {
      inpui: string;
      english: string;
      category: string;
      tags: string[];
      audioId?: string | null;
    }
  >({
    mutationFn: async (data) => {
      if (!actor) return;
      await actor.addCorpusEntry(
        data.inpui,
        data.english,
        data.category,
        data.tags,
        data.audioId ?? null,
      );
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["corpus"] });
      qc.invalidateQueries({ queryKey: ["stats"] });
    },
  });
}

export function useUpdateCorpusEntry() {
  const { actor } = useActor(createActor);
  const qc = useQueryClient();
  return useMutation<
    void,
    Error,
    {
      id: string;
      inpui: string;
      english: string;
      category: string;
      tags: string[];
    }
  >({
    mutationFn: async (data) => {
      if (!actor) return;
      const result = await actor.updateCorpusEntry(
        BigInt(data.id),
        data.inpui,
        data.english,
        data.category,
        data.tags,
      );
      if (result.__kind__ === "err") throw new Error(result.err);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["corpus"] });
    },
  });
}

export function useDeleteCorpusEntry() {
  const { actor } = useActor(createActor);
  const qc = useQueryClient();
  return useMutation<string | null, Error, string>({
    mutationFn: async (id) => {
      if (!actor) return null;
      const result = await actor.deleteCorpusEntry(BigInt(id));
      if (result.__kind__ === "err") throw new Error(result.err);
      return result.ok;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["corpus"] });
      qc.invalidateQueries({ queryKey: ["stats"] });
    },
  });
}

// ─── Translation Queue ────────────────────────────────────────────────────────

export function useQueue() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery<QueueEntry[]>({
    queryKey: ["queue"],
    queryFn: async () => {
      if (!actor) return [];
      const entries = await actor.getQueue();
      return entries.map(adaptQueueEntry);
    },
    enabled: !!actor && !isFetching,
    staleTime: 10_000,
  });
}

export function useAddToQueue() {
  const { actor } = useActor(createActor);
  const qc = useQueryClient();
  return useMutation<
    void,
    Error,
    { inpui: string; english: string; source?: string }
  >({
    mutationFn: async (data) => {
      if (!actor) return;
      await actor.addToQueue(
        data.inpui || null,
        data.english || null,
        data.source ?? "manual",
      );
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["queue"] });
      qc.invalidateQueries({ queryKey: ["stats"] });
    },
  });
}

export function useAddBulkToQueue() {
  const { actor } = useActor(createActor);
  const qc = useQueryClient();
  return useMutation<void, Error, FileParseRow[]>({
    mutationFn: async (rows) => {
      if (!actor) return;
      const entries: [string | null, string | null][] = rows.map((r) => [
        r.inpui || null,
        r.english || null,
      ]);
      await actor.addBulkToQueue(entries, "csv");
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["queue"] });
      qc.invalidateQueries({ queryKey: ["stats"] });
    },
  });
}

export function useRemoveFromQueue() {
  const { actor } = useActor(createActor);
  const qc = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: async (id) => {
      if (!actor) return;
      await actor.removeFromQueue(BigInt(id));
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["queue"] });
    },
  });
}

export function useApproveQueueEntry() {
  const { actor } = useActor(createActor);
  const qc = useQueryClient();
  return useMutation<
    void,
    Error,
    {
      id: string;
      inpui: string;
      english: string;
      category: string;
      tags: string[];
    }
  >({
    mutationFn: async (data) => {
      if (!actor) return;
      await actor.approveQueueEntry(
        BigInt(data.id),
        data.inpui,
        data.english,
        data.category,
        data.tags,
      );
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["queue"] });
      qc.invalidateQueries({ queryKey: ["corpus"] });
    },
  });
}

// ─── Parallel Upload ──────────────────────────────────────────────────────────

export function usePendingParallelEntries() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery<ParallelUploadEntry[]>({
    queryKey: ["parallelEntries", "pending"],
    queryFn: async () => {
      if (!actor) return [];
      const entries = await actor.getPendingParallelEntries();
      return entries.map(adaptParallelEntry);
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSubmitParallelEntries() {
  const { actor } = useActor(createActor);
  const qc = useQueryClient();
  return useMutation<void, Error, FileParseRow[]>({
    mutationFn: async (rows) => {
      if (!actor) return;
      const pairs: [string, string][] = rows.map((r) => [r.inpui, r.english]);
      await actor.submitParallelEntries(pairs);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["parallelEntries"] });
    },
  });
}

export function useApproveParallelEntry() {
  const { actor } = useActor(createActor);
  const qc = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: async (id) => {
      if (!actor) return;
      await actor.approveParallelEntry(BigInt(id));
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["parallelEntries"] });
      qc.invalidateQueries({ queryKey: ["corpus"] });
    },
  });
}

export function useRejectParallelEntry() {
  const { actor } = useActor(createActor);
  const qc = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: async (id) => {
      if (!actor) return;
      await actor.rejectParallelEntry(BigInt(id));
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["parallelEntries"] });
    },
  });
}

// ─── Contributors & Leaderboard ───────────────────────────────────────────────

export function useContributors() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery<Contributor[]>({
    queryKey: ["contributors"],
    queryFn: async () => {
      if (!actor) return [];
      const contributors = await actor.getContributors();
      return contributors.map(adaptContributor);
    },
    enabled: !!actor && !isFetching,
  });
}

export function useLeaderboard() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery<Contributor[]>({
    queryKey: ["leaderboard"],
    queryFn: async () => {
      if (!actor) return [];
      const contributors = await actor.getLeaderboard();
      return contributors.map(adaptContributor);
    },
    enabled: !!actor && !isFetching,
  });
}

export function useRegisterContributor() {
  const { actor } = useActor(createActor);
  const qc = useQueryClient();
  return useMutation<void, Error, { name: string }>({
    mutationFn: async (data) => {
      if (!actor) return;
      await actor.registerContributor(data.name);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["contributors"] });
    },
  });
}

export function useAwardBadge() {
  const { actor } = useActor(createActor);
  const qc = useQueryClient();
  return useMutation<void, Error, { contributorId: string; badge: string }>({
    mutationFn: async (data) => {
      if (!actor) return;
      await actor.awardBadge(data.contributorId);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["contributors"] });
      qc.invalidateQueries({ queryKey: ["leaderboard"] });
    },
  });
}

// ─── Predictions ──────────────────────────────────────────────────────────────

export function useGetPredictions(input: string) {
  const { actor, isFetching } = useActor(createActor);
  return useQuery<PredictionResult[]>({
    queryKey: ["predictions", input],
    queryFn: async () => {
      if (!actor || !input.trim()) return [];
      const results = await actor.getPredictions(input);
      return results.map(([entry, confidence]) => ({
        inpui: entry.inpui,
        english: entry.english,
        confidence: Number(confidence),
        sourceEntryId: String(entry.id),
      }));
    },
    enabled: !!actor && !isFetching && input.trim().length > 1,
  });
}

export function useSubmitPredictionFeedback() {
  const { actor } = useActor(createActor);
  return useMutation<void, Error, PredictionFeedback>({
    mutationFn: async (feedback) => {
      if (!actor) return;
      await actor.submitPredictionFeedback(
        BigInt(feedback.predictionId),
        feedback.correction ?? "",
        feedback.isCorrect,
      );
    },
  });
}

// ─── Admin ────────────────────────────────────────────────────────────────────

export function useAdminSettings() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery<AdminSettings>({
    queryKey: ["adminSettings"],
    queryFn: async () => {
      if (!actor) return { upiId: "", upiQrCode: null, adminPrincipal: "" };
      const s = await actor.getAdminSettings();
      return {
        upiId: s.upiId,
        upiQrCode: s.qrCodeData || null,
        adminPrincipal: s.adminPrincipals[0] ?? "",
      };
    },
    enabled: !!actor && !isFetching,
  });
}

export function useUpdateAdminSettings() {
  const { actor } = useActor(createActor);
  const qc = useQueryClient();
  return useMutation<void, Error, Partial<AdminSettings>>({
    mutationFn: async (settings) => {
      if (!actor) return;
      await actor.updateAdminSettings(
        settings.upiId ?? "",
        settings.upiQrCode ?? "",
      );
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["adminSettings"] });
    },
  });
}

export function useExportCorpus() {
  const { actor } = useActor(createActor);
  return useMutation<string, Error, "csv" | "json">({
    mutationFn: async (format) => {
      if (!actor) return "";
      const entries = await actor.exportCorpus();
      const adapted = entries.map(adaptCorpusEntry);
      if (format === "json") {
        return JSON.stringify(adapted, null, 2);
      }
      const header = "inpui,english,category,tags\n";
      const rows = adapted
        .map(
          (e) =>
            `"${e.inpui}","${e.english}","${e.category}","${e.tags.join(";")}"`,
        )
        .join("\n");
      return header + rows;
    },
  });
}

// ─── Admin Roles ──────────────────────────────────────────────────────────────

export function useIsCallerAdmin() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery<boolean>({
    queryKey: ["isCallerAdmin"],
    queryFn: async () => {
      if (!actor) return false;
      return actor.isCallerAdmin();
    },
    enabled: !!actor && !isFetching,
    staleTime: 60_000,
  });
}

export function useAutoSetFirstAdmin() {
  const { actor } = useActor(createActor);
  const qc = useQueryClient();
  return useMutation<void, Error, void>({
    mutationFn: async () => {
      if (!actor) return;
      await actor.autoSetFirstAdmin();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["isCallerAdmin"] });
      qc.invalidateQueries({ queryKey: ["adminPrincipals"] });
    },
  });
}

export function useGetAdminPrincipals() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery<string[]>({
    queryKey: ["adminPrincipals"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAdminPrincipals();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAddAdminPrincipal() {
  const { actor } = useActor(createActor);
  const qc = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: async (principal) => {
      if (!actor) return;
      const result = await actor.addAdminPrincipal(principal);
      if (result.__kind__ === "err") throw new Error(result.err);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["adminPrincipals"] });
    },
  });
}

export function useRemoveAdminPrincipal() {
  const { actor } = useActor(createActor);
  const qc = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: async (principal) => {
      if (!actor) return;
      const result = await actor.removeAdminPrincipal(principal);
      if (result.__kind__ === "err") throw new Error(result.err);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["adminPrincipals"] });
    },
  });
}

// ─── Chat ─────────────────────────────────────────────────────────────────────

export function useGetChatMessages(entryId: string, enabled = true) {
  const { actor, isFetching } = useActor(createActor);
  return useQuery<ChatMessage[]>({
    queryKey: ["chat", entryId],
    queryFn: async () => {
      if (!actor) return [];
      const msgs = await actor.getChatMessages(BigInt(entryId));
      return msgs.filter((m) => !m.isDeleted).map(adaptChatMessage);
    },
    enabled: !!actor && !isFetching && enabled,
    refetchInterval: enabled ? 10_000 : false,
    staleTime: 5_000,
  });
}

export function useAddChatMessage() {
  const { actor } = useActor(createActor);
  const qc = useQueryClient();
  return useMutation<
    void,
    Error,
    { entryId: string; authorName: string; content: string }
  >({
    mutationFn: async (data) => {
      if (!actor) return;
      const result = await actor.addChatMessage(
        BigInt(data.entryId),
        data.authorName,
        data.content,
      );
      if (result.__kind__ === "err") throw new Error(result.err);
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ["chat", vars.entryId] });
    },
  });
}

export function useDeleteChatMessage() {
  const { actor } = useActor(createActor);
  const qc = useQueryClient();
  return useMutation<void, Error, { messageId: string; entryId: string }>({
    mutationFn: async (data) => {
      if (!actor) return;
      const result = await actor.deleteChatMessage(BigInt(data.messageId));
      if (result.__kind__ === "err") throw new Error(result.err);
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ["chat", vars.entryId] });
    },
  });
}

// ─── Stats ────────────────────────────────────────────────────────────────────

export function useStats() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery<Stats>({
    queryKey: ["stats"],
    queryFn: async () => {
      if (!actor) {
        return {
          totalCorpusEntries: BigInt(0),
          activeContributors: BigInt(0),
          queueCount: BigInt(0),
          pendingParallelEntries: BigInt(0),
        };
      }
      const s = await actor.getStats();
      return {
        totalCorpusEntries: s.totalEntries,
        activeContributors: s.activeContributors,
        queueCount: s.queueSize,
        pendingParallelEntries: BigInt(0),
      };
    },
    enabled: !!actor && !isFetching,
  });
}
