import { MicButton } from "@/components/ui/MicButton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAddCorpusEntry } from "@/hooks/useQueries";
import { formatDuration, useAudioRecorder } from "@/lib/audio";
import { cn } from "@/lib/utils";
import { CloudUpload, Smartphone, Trash2, WifiOff } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────────────────────

interface OfflineRecording {
  id: string;
  inpui: string;
  english: string;
  category: string;
  savedAt: number;
}

const STORAGE_KEY = "fieldwork_recordings";

const CATEGORIES = [
  "Greetings",
  "Food",
  "Verbs",
  "Numbers",
  "Travel",
  "Family",
  "Nature",
  "Common Words",
  "Phrases",
];

// ─── Storage helpers ──────────────────────────────────────────────────────────

function loadOfflineRecordings(): OfflineRecording[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as OfflineRecording[]) : [];
  } catch {
    return [];
  }
}

function saveOfflineRecordings(items: OfflineRecording[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

// ─── Online status hook ───────────────────────────────────────────────────────

function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  useEffect(() => {
    const on = () => setIsOnline(true);
    const off = () => setIsOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);
  return isOnline;
}

// ─── Status banner ────────────────────────────────────────────────────────────

function StatusBanner({
  isOnline,
  pendingCount,
  onSync,
  isSyncing,
}: {
  isOnline: boolean;
  pendingCount: number;
  onSync: () => void;
  isSyncing: boolean;
}) {
  if (!isOnline) {
    return (
      <div
        className="flex items-start gap-3 rounded-xl px-4 py-3 mb-1 border"
        style={{
          backgroundColor: "oklch(0.95 0.08 75)",
          borderColor: "oklch(0.75 0.12 75)",
        }}
        role="alert"
        data-ocid="offline-banner"
      >
        <WifiOff
          size={18}
          className="mt-0.5 shrink-0"
          style={{ color: "oklch(0.5 0.12 65)" }}
        />
        <p
          className="text-sm font-medium"
          style={{ color: "oklch(0.35 0.10 65)" }}
        >
          You are offline — recordings will be saved locally and synced when you
          reconnect.
        </p>
      </div>
    );
  }

  if (pendingCount > 0) {
    return (
      <div
        className="flex items-center justify-between gap-3 rounded-xl px-4 py-3 mb-1 border"
        style={{
          backgroundColor: "oklch(0.95 0.10 145)",
          borderColor: "oklch(0.70 0.15 145)",
        }}
        aria-live="polite"
        data-ocid="pending-sync-banner"
      >
        <div className="flex items-center gap-2">
          <CloudUpload size={18} style={{ color: "oklch(0.40 0.16 145)" }} />
          <p
            className="text-sm font-medium"
            style={{ color: "oklch(0.30 0.12 145)" }}
          >
            {pendingCount} recording{pendingCount !== 1 ? "s" : ""} ready to
            sync
          </p>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={onSync}
          disabled={isSyncing}
          className="shrink-0 text-xs"
          data-ocid="quick-sync-btn"
        >
          {isSyncing ? "Syncing…" : "Sync now"}
        </Button>
      </div>
    );
  }

  return null;
}

// ─── Recording card ───────────────────────────────────────────────────────────

function RecordingCard({
  item,
  onDelete,
}: {
  item: OfflineRecording;
  onDelete: (id: string) => void;
}) {
  const date = new Date(item.savedAt).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div
      className="flex items-start justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3"
      data-ocid="offline-recording-item"
    >
      <div className="min-w-0 flex-1 space-y-0.5">
        <p className="font-semibold text-foreground leading-snug truncate">
          {item.inpui || "—"}
        </p>
        <p className="text-sm text-muted-foreground leading-snug truncate">
          {item.english || "—"}
        </p>
        <div className="flex items-center gap-2 pt-1 flex-wrap">
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
            {item.category}
          </Badge>
          <span className="text-[10px] text-muted-foreground">{date}</span>
        </div>
      </div>
      <button
        type="button"
        onClick={() => onDelete(item.id)}
        aria-label="Delete recording"
        className="shrink-0 mt-0.5 p-1.5 rounded-lg text-destructive hover:bg-destructive/10 transition-smooth focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        data-ocid="delete-recording-btn"
      >
        <Trash2 size={15} />
      </button>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function FieldworkPage() {
  const isOnline = useOnlineStatus();
  const addEntry = useAddCorpusEntry();

  const [offlineItems, setOfflineItems] = useState<OfflineRecording[]>(
    loadOfflineRecordings,
  );
  const [isSyncing, setIsSyncing] = useState(false);
  const [inpuiText, setInpuiText] = useState("");
  const [englishText, setEnglishText] = useState("");
  const [category, setCategory] = useState("Greetings");
  const autoSyncedRef = useRef(false);

  const inpuiRecorder = useAudioRecorder("en-IN");
  const englishRecorder = useAudioRecorder("en-US");

  // Copy transcript to text fields when recording finishes
  useEffect(() => {
    if (!inpuiRecorder.isRecording && inpuiRecorder.transcript) {
      setInpuiText((prev) => prev || inpuiRecorder.transcript);
    }
  }, [inpuiRecorder.isRecording, inpuiRecorder.transcript]);

  useEffect(() => {
    if (!englishRecorder.isRecording && englishRecorder.transcript) {
      setEnglishText((prev) => prev || englishRecorder.transcript);
    }
  }, [englishRecorder.isRecording, englishRecorder.transcript]);

  // ── Persist state ─────────────────────────────────────────────────────────

  const persistItems = useCallback((items: OfflineRecording[]) => {
    setOfflineItems(items);
    saveOfflineRecordings(items);
  }, []);

  // ── Sync all offline recordings ───────────────────────────────────────────

  const syncAll = useCallback(
    async (items: OfflineRecording[], auto = false) => {
      if (!items.length) return;
      setIsSyncing(true);
      try {
        for (const rec of items) {
          await addEntry.mutateAsync({
            inpui: rec.inpui,
            english: rec.english,
            category: rec.category,
            tags: [],
          });
        }
        persistItems([]);
        toast.success(
          `Synced ${items.length} recording${items.length !== 1 ? "s" : ""} successfully${auto ? " (auto-sync)" : ""}`,
        );
      } catch {
        toast.error("Sync failed — recordings kept offline");
      } finally {
        setIsSyncing(false);
      }
    },
    [addEntry, persistItems],
  );

  // Auto-sync on reconnect
  useEffect(() => {
    if (isOnline && offlineItems.length > 0 && !autoSyncedRef.current) {
      autoSyncedRef.current = true;
      syncAll(offlineItems, true);
    }
    if (!isOnline) {
      autoSyncedRef.current = false;
    }
  }, [isOnline, offlineItems, syncAll]);

  // ── Save handler ──────────────────────────────────────────────────────────

  const handleSaveOffline = () => {
    if (!inpuiText.trim() && !englishText.trim()) {
      toast.error("Add at least one word or phrase before saving");
      return;
    }
    const newItem: OfflineRecording = {
      id: `fw_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      inpui: inpuiText.trim(),
      english: englishText.trim(),
      category,
      savedAt: Date.now(),
    };

    if (isOnline) {
      // Direct upload — no need to queue
      syncAll([newItem]);
    } else {
      persistItems([newItem, ...offlineItems]);
      toast.success("Saved offline — will sync when you reconnect");
    }

    setInpuiText("");
    setEnglishText("");
    inpuiRecorder.clearRecording();
    englishRecorder.clearRecording();
  };

  const handleDelete = (id: string) => {
    persistItems(offlineItems.filter((r) => r.id !== id));
    toast.info("Recording removed");
  };

  const activeRecording =
    inpuiRecorder.isRecording || englishRecorder.isRecording;
  const canSave =
    !activeRecording &&
    !isSyncing &&
    (inpuiText.trim().length > 0 || englishText.trim().length > 0);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-xl mx-auto px-4 py-6 space-y-5">
        {/* Page header */}
        <div className="flex items-center gap-3">
          <div
            className="rounded-xl p-2.5 shrink-0"
            style={{ backgroundColor: "oklch(0.28 0.10 247)" }}
          >
            <Smartphone size={20} className="text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-display text-xl font-bold text-foreground leading-tight">
              Mobile Fieldwork
            </h1>
            <p className="text-xs text-muted-foreground">
              Record offline · syncs automatically when online
            </p>
          </div>
        </div>

        {/* Status banner */}
        <StatusBanner
          isOnline={isOnline}
          pendingCount={offlineItems.length}
          onSync={() => syncAll(offlineItems)}
          isSyncing={isSyncing}
        />

        {/* Recording card */}
        <Card className="card-elevated overflow-hidden">
          <CardHeader className="pb-3 pt-4 px-4 border-b border-border">
            <CardTitle className="text-base font-semibold text-foreground">
              New Recording
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pt-5 pb-5 space-y-5">
            {/* ── Inpui section ── */}
            <div className="space-y-3">
              <div className="flex items-center gap-4">
                <MicButton
                  size="lg"
                  isRecording={inpuiRecorder.isRecording}
                  disabled={englishRecorder.isRecording}
                  onClick={
                    inpuiRecorder.isRecording
                      ? inpuiRecorder.stopRecording
                      : inpuiRecorder.startRecording
                  }
                  aria-label={
                    inpuiRecorder.isRecording
                      ? "Stop Inpui recording"
                      : "Start Inpui recording"
                  }
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-foreground">Inpui</p>
                  <p
                    className={cn(
                      "text-xs font-mono mt-0.5 transition-colors",
                      inpuiRecorder.isRecording
                        ? "font-medium"
                        : "text-muted-foreground",
                    )}
                    style={
                      inpuiRecorder.isRecording
                        ? { color: "oklch(0.45 0.18 145)" }
                        : undefined
                    }
                  >
                    {inpuiRecorder.isRecording
                      ? `● REC  ${formatDuration(inpuiRecorder.duration)}`
                      : inpuiRecorder.audioUrl
                        ? `Recorded · ${formatDuration(inpuiRecorder.duration)}`
                        : "Tap mic to record"}
                  </p>
                </div>
              </div>
              <div>
                <Label
                  htmlFor="inpui-text"
                  className="text-xs text-muted-foreground mb-1 block"
                >
                  Inpui text (editable)
                </Label>
                <Textarea
                  id="inpui-text"
                  placeholder="Enter or speak the Inpui word / phrase…"
                  value={
                    inpuiRecorder.isRecording && inpuiRecorder.transcript
                      ? inpuiRecorder.transcript
                      : inpuiText
                  }
                  onChange={(e) => setInpuiText(e.target.value)}
                  rows={2}
                  className="resize-none text-sm"
                  data-ocid="inpui-text-input"
                />
              </div>
            </div>

            <div className="border-t border-border" />

            {/* ── English section ── */}
            <div className="space-y-3">
              <div className="flex items-center gap-4">
                <MicButton
                  size="lg"
                  isRecording={englishRecorder.isRecording}
                  disabled={inpuiRecorder.isRecording}
                  onClick={
                    englishRecorder.isRecording
                      ? englishRecorder.stopRecording
                      : englishRecorder.startRecording
                  }
                  aria-label={
                    englishRecorder.isRecording
                      ? "Stop English recording"
                      : "Start English recording"
                  }
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-foreground">
                    English
                  </p>
                  <p
                    className={cn(
                      "text-xs font-mono mt-0.5 transition-colors",
                      englishRecorder.isRecording
                        ? "font-medium"
                        : "text-muted-foreground",
                    )}
                    style={
                      englishRecorder.isRecording
                        ? { color: "oklch(0.45 0.18 145)" }
                        : undefined
                    }
                  >
                    {englishRecorder.isRecording
                      ? `● REC  ${formatDuration(englishRecorder.duration)}`
                      : englishRecorder.audioUrl
                        ? `Recorded · ${formatDuration(englishRecorder.duration)}`
                        : "Tap mic to record"}
                  </p>
                </div>
              </div>
              <div>
                <Label
                  htmlFor="english-text"
                  className="text-xs text-muted-foreground mb-1 block"
                >
                  English translation (editable)
                </Label>
                <Textarea
                  id="english-text"
                  placeholder="Enter or speak the English translation…"
                  value={
                    englishRecorder.isRecording && englishRecorder.transcript
                      ? englishRecorder.transcript
                      : englishText
                  }
                  onChange={(e) => setEnglishText(e.target.value)}
                  rows={2}
                  className="resize-none text-sm"
                  data-ocid="english-text-input"
                />
              </div>
            </div>

            {/* ── Category + Save ── */}
            <div className="space-y-3 pt-1">
              <div>
                <Label
                  htmlFor="category-select"
                  className="text-xs text-muted-foreground mb-1 block"
                >
                  Category
                </Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger
                    id="category-select"
                    className="w-full"
                    data-ocid="category-select"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button
                className="w-full h-12 text-base font-semibold"
                onClick={handleSaveOffline}
                disabled={!canSave}
                data-ocid="save-offline-btn"
              >
                {isOnline ? (
                  <>
                    <CloudUpload size={18} className="mr-2" />
                    Save &amp; Upload
                  </>
                ) : (
                  <>
                    <WifiOff size={18} className="mr-2" />
                    Save Offline
                  </>
                )}
              </Button>

              {/* Error messages */}
              {inpuiRecorder.error && (
                <p className="text-xs text-destructive" role="alert">
                  Inpui mic: {inpuiRecorder.error}
                </p>
              )}
              {englishRecorder.error && (
                <p className="text-xs text-destructive" role="alert">
                  English mic: {englishRecorder.error}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Offline queue */}
        <Card className="card-elevated overflow-hidden">
          <CardHeader className="pb-3 pt-4 px-4 border-b border-border">
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="text-base font-semibold text-foreground">
                Offline Queue
              </CardTitle>
              {offlineItems.length > 0 && (
                <Badge
                  className="text-xs font-semibold px-2"
                  style={{
                    backgroundColor: "oklch(0.28 0.10 247)",
                    color: "oklch(0.98 0 0)",
                  }}
                >
                  {offlineItems.length}
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="px-4 pt-4 pb-4 space-y-3">
            {offlineItems.length === 0 ? (
              <div
                className="flex flex-col items-center justify-center py-8 text-center"
                data-ocid="empty-offline-state"
              >
                <Smartphone
                  size={36}
                  className="text-muted-foreground mb-3 opacity-40"
                />
                <p className="text-sm font-medium text-muted-foreground">
                  No offline recordings
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Start recording above — saved entries appear here
                </p>
              </div>
            ) : (
              <>
                {offlineItems.map((item) => (
                  <RecordingCard
                    key={item.id}
                    item={item}
                    onDelete={handleDelete}
                  />
                ))}
                {isOnline && (
                  <Button
                    className="w-full mt-1 font-semibold"
                    onClick={() => syncAll(offlineItems)}
                    disabled={isSyncing}
                    data-ocid="batch-sync-btn"
                  >
                    <CloudUpload size={16} className="mr-2" />
                    {isSyncing
                      ? "Syncing…"
                      : `Sync ${offlineItems.length} recording${offlineItems.length !== 1 ? "s" : ""}`}
                  </Button>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Fieldwork tips */}
        <div
          className="rounded-xl border border-border px-4 py-4 bg-muted/40 space-y-1.5"
          data-ocid="fieldwork-tips"
        >
          <p className="text-xs font-semibold text-foreground uppercase tracking-wide">
            Fieldwork tips
          </p>
          <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
            <li>Record in a quiet environment for best transcription</li>
            <li>Speak clearly at a natural pace</li>
            <li>Add both Inpui and English for complete entries</li>
            <li>Offline recordings sync automatically on reconnect</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
