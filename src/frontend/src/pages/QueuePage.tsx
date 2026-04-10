import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useAddBulkToQueue,
  useAddToQueue,
  useQueue,
  useRemoveFromQueue,
} from "@/hooks/useQueries";
import { parseFile } from "@/lib/file-parser";
import type { FileParseResult, QueueEntry } from "@/types";
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  FileText,
  ListOrdered,
  Loader2,
  Plus,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { useCallback, useRef, useState } from "react";

// ─── Source badge ─────────────────────────────────────────────────────────────

type SourceKey = "manual" | "csv" | "xlsx" | "txt";

const SOURCE_STYLES: Record<SourceKey, string> = {
  manual: "bg-primary/15 text-primary border-primary/30",
  csv: "bg-secondary/15 text-secondary border-secondary/30",
  xlsx: "bg-purple-500/15 text-purple-700 border-purple-400/30",
  txt: "bg-orange-500/15 text-orange-700 border-orange-400/30",
};

function SourceBadge({ source }: { source: string }) {
  const key = (
    ["manual", "csv", "xlsx", "txt"].includes(source) ? source : "manual"
  ) as SourceKey;
  const cls = SOURCE_STYLES[key];
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${cls}`}
    >
      {key}
    </span>
  );
}

// ─── Queue row ────────────────────────────────────────────────────────────────

function QueueRow({
  entry,
  index,
  onRemove,
  removing,
}: {
  entry: QueueEntry;
  index: number;
  onRemove: (id: string) => void;
  removing: boolean;
}) {
  const ts =
    typeof entry.submittedAt === "bigint"
      ? new Date(Number(entry.submittedAt)).toLocaleDateString()
      : "";

  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 text-sm transition-colors ${
        index % 2 === 0 ? "bg-muted/30" : "bg-card"
      }`}
      data-ocid="queue-row"
    >
      <span className="flex-1 min-w-0 font-medium text-foreground truncate">
        {entry.inpui || (
          <em className="text-muted-foreground font-normal">—</em>
        )}
      </span>

      <span className="flex-1 min-w-0 text-muted-foreground truncate">
        {entry.english || <em className="text-muted-foreground">—</em>}
      </span>

      <div className="hidden sm:flex items-center gap-1.5 shrink-0">
        <SourceBadge
          source={
            (entry as QueueEntry & { source?: string }).source ?? "manual"
          }
        />
        {entry.isDuplicate && (
          <span className="inline-flex items-center gap-0.5 rounded-full border border-amber-400/40 bg-amber-400/15 px-2 py-0.5 text-xs font-medium text-amber-700">
            <AlertTriangle className="w-3 h-3" />
            Duplicate
          </span>
        )}
      </div>

      <span className="hidden md:block text-xs text-muted-foreground shrink-0 w-20 text-right">
        {ts}
      </span>

      <Button
        variant="ghost"
        size="icon"
        className="shrink-0 h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-smooth"
        onClick={() => onRemove(entry.id)}
        disabled={removing}
        aria-label="Remove from queue"
        data-ocid="queue-remove-btn"
      >
        {removing ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <Trash2 className="w-3.5 h-3.5" />
        )}
      </Button>
    </div>
  );
}

// ─── Manual entry form ────────────────────────────────────────────────────────

function ManualEntryForm({ onAdded }: { onAdded: () => void }) {
  const [inpui, setInpui] = useState("");
  const [english, setEnglish] = useState("");
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [errMsg, setErrMsg] = useState("");
  const addToQueue = useAddToQueue();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!inpui.trim() && !english.trim()) {
      setStatus("error");
      setErrMsg("At least one field (Inpui or English) is required.");
      return;
    }
    setStatus("idle");
    try {
      await addToQueue.mutateAsync({
        inpui: inpui.trim(),
        english: english.trim(),
      });
      setInpui("");
      setEnglish("");
      setStatus("success");
      onAdded();
      setTimeout(() => setStatus("idle"), 3000);
    } catch {
      setStatus("error");
      setErrMsg("Failed to add entry. Please try again.");
    }
  }

  return (
    <Card className="card-elevated" data-ocid="manual-entry-form">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base font-semibold text-foreground">
          <Plus className="w-4 h-4 icon-gold" />
          Add Manually
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label
                htmlFor="inpui-phrase"
                className="text-sm font-medium text-foreground"
              >
                Inpui Phrase
              </Label>
              <Input
                id="inpui-phrase"
                placeholder="e.g. Ka lawm e"
                value={inpui}
                onChange={(e) => {
                  setInpui(e.target.value);
                  setStatus("idle");
                }}
                className="bg-muted/40 border-input focus:border-primary"
                data-ocid="manual-inpui-input"
              />
            </div>
            <div className="space-y-1.5">
              <Label
                htmlFor="english-phrase"
                className="text-sm font-medium text-foreground"
              >
                English Translation
              </Label>
              <Input
                id="english-phrase"
                placeholder="e.g. Thank you"
                value={english}
                onChange={(e) => {
                  setEnglish(e.target.value);
                  setStatus("idle");
                }}
                className="bg-muted/40 border-input focus:border-primary"
                data-ocid="manual-english-input"
              />
            </div>
          </div>

          {status === "success" && (
            <div className="flex items-center gap-2 text-sm text-secondary">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              Entry added to the queue successfully.
            </div>
          )}
          {status === "error" && (
            <div className="flex items-center gap-2 text-sm text-destructive">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {errMsg}
            </div>
          )}

          <Button
            type="submit"
            disabled={addToQueue.isPending}
            className="w-full sm:w-auto bg-primary text-primary-foreground hover:bg-primary/90 transition-smooth"
            data-ocid="manual-submit-btn"
          >
            {addToQueue.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Adding…
              </>
            ) : (
              <>
                <Plus className="w-4 h-4 mr-2" />
                Add to Queue
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

// ─── File upload section ──────────────────────────────────────────────────────

function FileUploadSection({ onUploaded }: { onUploaded: () => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [parseResult, setParseResult] = useState<FileParseResult | null>(null);
  const [parsing, setParsing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadDone, setUploadDone] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const addBulk = useAddBulkToQueue();

  const handleFile = useCallback(async (f: File) => {
    const ext = f.name.slice(f.name.lastIndexOf(".")).toLowerCase();
    const allowed = [".csv", ".txt", ".xlsx", ".xls"];
    setFile(f);
    setParseResult(null);
    setUploadDone(false);
    setUploadError("");

    if (!allowed.includes(ext)) {
      setParseResult({
        valid: [],
        errors: [
          `Unsupported file type "${ext}". Please upload .csv, .txt, or .xlsx`,
        ],
      });
      return;
    }

    setParsing(true);
    try {
      const result = await parseFile(f);
      setParseResult(result);
    } catch {
      setParseResult({
        valid: [],
        errors: [
          "Failed to parse file. Please check the format and try again.",
        ],
      });
    } finally {
      setParsing(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const dropped = e.dataTransfer.files[0];
      if (dropped) handleFile(dropped);
    },
    [handleFile],
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) handleFile(selected);
    e.target.value = "";
  };

  const handleUpload = async () => {
    if (!parseResult || parseResult.valid.length === 0) return;
    setUploading(true);
    setUploadError("");
    try {
      await addBulk.mutateAsync(parseResult.valid);
      setUploadDone(true);
      setFile(null);
      setParseResult(null);
      onUploaded();
      setTimeout(() => setUploadDone(false), 4000);
    } catch {
      setUploadError("Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const handleClear = () => {
    setFile(null);
    setParseResult(null);
    setUploadDone(false);
    setUploadError("");
  };

  return (
    <Card className="card-elevated" data-ocid="file-upload-section">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base font-semibold text-foreground">
          <Upload className="w-4 h-4 icon-gold" />
          Upload File
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Drop zone */}
        <button
          type="button"
          className={`w-full border-2 border-dashed rounded-lg p-8 flex flex-col items-center gap-3 transition-smooth cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
            dragOver
              ? "border-accent bg-accent/5"
              : "border-border hover:border-accent/60 hover:bg-muted/30"
          }`}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          aria-label="Upload file — drop here or click to browse"
          data-ocid="file-drop-zone"
        >
          <FileText
            className={`w-10 h-10 transition-smooth ${
              dragOver ? "text-accent" : "text-muted-foreground"
            }`}
          />
          <div className="text-center">
            <p className="text-sm font-medium text-foreground">
              Drop file here or{" "}
              <span className="text-accent font-semibold">click to upload</span>
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Accepts .csv, .txt, .xlsx — UTF-8 encoded
            </p>
          </div>
        </button>
        <input
          ref={inputRef}
          type="file"
          accept=".csv,.txt,.xlsx,.xls"
          onChange={handleInputChange}
          className="hidden"
          data-ocid="file-input"
        />

        {/* Selected file chip */}
        {file && (
          <div className="flex items-center gap-2 rounded-lg bg-muted/40 px-3 py-2 text-sm">
            <FileText className="w-4 h-4 text-accent shrink-0" />
            <span className="flex-1 min-w-0 truncate text-foreground font-medium">
              {file.name}
            </span>
            <button
              type="button"
              onClick={handleClear}
              className="text-muted-foreground hover:text-foreground transition-smooth"
              aria-label="Remove selected file"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Parsing spinner */}
        {parsing && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" />
            Parsing file…
          </div>
        )}

        {/* Parse results */}
        {parseResult && !parsing && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle2 className="w-4 h-4 text-secondary shrink-0" />
              <span className="text-foreground">
                Found{" "}
                <strong className="font-semibold">
                  {parseResult.valid.length}
                </strong>{" "}
                valid {parseResult.valid.length === 1 ? "entry" : "entries"}
                {parseResult.errors.length > 0 && (
                  <>
                    ,{" "}
                    <strong className="font-semibold text-destructive">
                      {parseResult.errors.length}
                    </strong>{" "}
                    {parseResult.errors.length === 1 ? "issue" : "issues"}
                  </>
                )}
              </span>
            </div>

            {parseResult.errors.length > 0 && (
              <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-destructive uppercase tracking-wide mb-2">
                  <AlertCircle className="w-3.5 h-3.5" />
                  Validation Issues
                </div>
                <ul className="space-y-1">
                  {parseResult.errors.map((err) => (
                    <li
                      key={err}
                      className="text-xs text-destructive/90 flex gap-1.5"
                    >
                      <span className="shrink-0">•</span>
                      <span>{err}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Upload success */}
        {uploadDone && (
          <div className="flex items-center gap-2 text-sm text-secondary">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            Entries uploaded to queue successfully!
          </div>
        )}

        {/* Upload error */}
        {uploadError && (
          <div className="flex items-center gap-2 text-sm text-destructive">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {uploadError}
          </div>
        )}

        {/* Action buttons */}
        {parseResult && !parsing && (
          <div className="flex gap-2 flex-wrap">
            <Button
              onClick={handleUpload}
              disabled={uploading || parseResult.valid.length === 0}
              className="bg-primary text-primary-foreground hover:bg-primary/90 transition-smooth"
              data-ocid="file-upload-btn"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Uploading…
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload {parseResult.valid.length}{" "}
                  {parseResult.valid.length === 1 ? "Entry" : "Entries"}
                </>
              )}
            </Button>
            <Button
              variant="ghost"
              onClick={handleClear}
              className="text-muted-foreground hover:text-foreground transition-smooth"
              data-ocid="file-clear-btn"
            >
              Cancel
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Queue list ───────────────────────────────────────────────────────────────

function QueueList() {
  const { data: queue, isLoading, refetch } = useQueue();
  const removeMut = useRemoveFromQueue();
  const [removingId, setRemovingId] = useState<string | null>(null);

  const handleRemove = async (id: string) => {
    setRemovingId(id);
    try {
      await removeMut.mutateAsync(id);
      refetch();
    } finally {
      setRemovingId(null);
    }
  };

  const sorted = queue
    ? [...queue].sort((a, b) => Number(b.submittedAt - a.submittedAt))
    : [];

  return (
    <Card className="card-elevated overflow-hidden" data-ocid="queue-list">
      <CardHeader className="pb-3 border-b border-border">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base font-semibold text-foreground">
            <ListOrdered className="w-4 h-4 icon-gold" />
            Translation Queue
          </CardTitle>
          {!isLoading && (
            <Badge
              variant="secondary"
              className="bg-primary/10 text-primary border-primary/20 font-semibold"
              data-ocid="queue-count-badge"
            >
              {sorted.length} {sorted.length === 1 ? "entry" : "entries"}
            </Badge>
          )}
        </div>
      </CardHeader>

      {/* Column header row */}
      {!isLoading && sorted.length > 0 && (
        <div className="flex items-center gap-3 px-4 py-2 border-b border-border bg-muted/20">
          <span className="flex-1 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Inpui
          </span>
          <span className="flex-1 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            English
          </span>
          <span className="hidden sm:block text-xs font-semibold text-muted-foreground uppercase tracking-wide w-28">
            Source
          </span>
          <span className="hidden md:block text-xs font-semibold text-muted-foreground uppercase tracking-wide w-20 text-right">
            Date
          </span>
          <span className="w-7" />
        </div>
      )}

      {/* Loading skeletons */}
      {isLoading && (
        <div className="p-4 space-y-2" data-ocid="queue-loading">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-3">
              <Skeleton className="flex-1 h-4 rounded" />
              <Skeleton className="flex-1 h-4 rounded" />
              <Skeleton className="hidden sm:block h-5 w-14 rounded-full" />
              <Skeleton className="h-7 w-7 rounded" />
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && sorted.length === 0 && (
        <div
          className="flex flex-col items-center justify-center py-16 px-4 text-center"
          data-ocid="queue-empty-state"
        >
          <ListOrdered className="w-12 h-12 text-muted-foreground/40 mb-4" />
          <p className="text-base font-medium text-foreground mb-1">
            Queue is empty
          </p>
          <p className="text-sm text-muted-foreground">
            Add phrases above using the manual form or file upload.
          </p>
        </div>
      )}

      {/* Rows */}
      {!isLoading && sorted.length > 0 && (
        <div className="divide-y divide-border/50">
          {sorted.map((entry, i) => (
            <QueueRow
              key={entry.id}
              entry={entry}
              index={i}
              onRemove={handleRemove}
              removing={removingId === entry.id}
            />
          ))}
        </div>
      )}
    </Card>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function QueuePage() {
  const { refetch } = useQueue();

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">
          Translation Queue
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Submit Inpui phrases and English translations for review and addition
          to the corpus.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <ManualEntryForm onAdded={refetch} />
        <FileUploadSection onUploaded={refetch} />
      </div>

      <QueueList />
    </div>
  );
}
