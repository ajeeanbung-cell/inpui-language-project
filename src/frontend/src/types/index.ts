export interface CorpusEntry {
  id: string;
  inpui: string;
  english: string;
  category: string;
  tags: string[];
  audioId: string | null;
  audioStorageId: string | null;
  contributorId: string | null;
  isFavorite: boolean;
  createdAt: bigint;
}

export interface Contributor {
  id: string;
  name: string;
  contributions: number;
  isVerified: boolean;
  badges: string[];
  joinedAt: bigint;
}

export interface QueueEntry {
  id: string;
  inpui: string;
  english: string;
  submittedBy: string | null;
  submittedAt: bigint;
  isDuplicate: boolean;
}

export interface ParallelUploadEntry {
  id: string;
  inpui: string;
  english: string;
  status: "pending" | "approved" | "rejected";
  submittedBy: string | null;
  submittedAt: bigint;
}

export interface PredictionResult {
  inpui: string;
  english: string;
  confidence: number;
  sourceEntryId: string | null;
}

export interface PredictionFeedback {
  predictionId: string;
  isCorrect: boolean;
  correction: string | null;
}

export interface AdminSettings {
  upiId: string;
  upiQrCode: string | null;
  adminPrincipal: string;
}

export interface Stats {
  totalCorpusEntries: bigint;
  activeContributors: bigint;
  queueCount: bigint;
  pendingParallelEntries: bigint;
}

export type FileParseRow = {
  inpui: string;
  english: string;
};

export type FileParseResult = {
  valid: FileParseRow[];
  errors: string[];
};

export type NavTab = {
  id: string;
  label: string;
  path: string;
  icon: string;
  mobileOnly?: boolean;
  adminOnly?: boolean;
};

export interface ChatMessage {
  id: string;
  entryId: string;
  authorId: string;
  authorName: string;
  content: string;
  timestamp: number;
  isDeleted: boolean;
}
