import { MicButton } from "@/components/ui/MicButton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAddCorpusEntry } from "@/hooks/useQueries";
import { formatDuration, useAudioRecorder } from "@/lib/audio";
import { createActorWithConfig } from "@caffeineai/core-infrastructure";
import {
  AlertCircle,
  FileAudio,
  Loader2,
  Mic,
  RotateCcw,
  Upload,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { ExternalBlob, createActor } from "../backend";

const CATEGORIES = [
  "greetings",
  "food",
  "verbs",
  "travel",
  "numbers",
  "family",
  "expressions",
  "other",
];

const ACCEPTED_AUDIO = ".mp3,.wav,.m4a,.webm,.ogg";
const MAX_FILE_SIZE_MB = 50;

// ─── Upload audio to object-storage via the actor ─────────────────────────────

type ActorWithInternals = {
  _uploadFile: (file: ExternalBlob) => Promise<Uint8Array>;
  _downloadFile: (hash: Uint8Array) => Promise<ExternalBlob>;
};

async function uploadAudioToStorage(blob: Blob): Promise<string | null> {
  try {
    // createActorWithConfig wires real StorageClient upload/download functions.
    // _uploadFile uploads bytes → returns hash; _downloadFile hash → returns ExternalBlob with CDN URL.
    const actor = await createActorWithConfig(createActor);
    const internals = actor as unknown as ActorWithInternals;
    const bytes = new Uint8Array(await blob.arrayBuffer());
    const externalBlob = ExternalBlob.fromBytes(bytes);
    const hashBytes = await internals._uploadFile(externalBlob);
    const stored = await internals._downloadFile(hashBytes);
    return stored.getDirectURL();
  } catch {
    return null;
  }
}

// ─── Recording Panel ──────────────────────────────────────────────────────────

interface RecordingPanelProps {
  lang: "inpui" | "english";
  transcript: string;
  onTranscriptChange: (t: string) => void;
  onAudioBlob: (blob: Blob | null) => void;
}

function RecordingPanel({
  lang,
  transcript,
  onTranscriptChange,
  onAudioBlob,
}: RecordingPanelProps) {
  const speechLang = lang === "english" ? "en-US" : "en-IN";
  const recorder = useAudioRecorder(speechLang);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);

  // Propagate blob to parent when recording stops
  useEffect(() => {
    if (recorder.audioBlob) {
      onAudioBlob(recorder.audioBlob);
    }
  }, [recorder.audioBlob, onAudioBlob]);

  const handleToggle = () => {
    if (recorder.isRecording) {
      recorder.stopRecording();
    } else {
      recorder.startRecording();
    }
  };

  const handleClear = () => {
    recorder.clearRecording();
    onTranscriptChange("");
    onAudioBlob(null);
    setUploadedFileName(null);
    setUploadedUrl(null);
  };

  // Sync recorder transcript to parent
  if (!recorder.isRecording && recorder.transcript && !transcript) {
    onTranscriptChange(recorder.transcript);
  }

  const handleTextChange = (val: string) => {
    onTranscriptChange(val);
  };

  const syncedTranscript = recorder.isRecording
    ? recorder.transcript
    : transcript;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      toast.error(`File too large. Max ${MAX_FILE_SIZE_MB}MB allowed.`);
      return;
    }
    const url = URL.createObjectURL(file);
    setUploadedFileName(file.name);
    setUploadedUrl(url);
    onAudioBlob(file);
    toast.success(`Audio file "${file.name}" loaded.`);
    e.target.value = "";
  };

  const isInpui = lang === "inpui";
  const activeAudioUrl = uploadedUrl ?? recorder.audioUrl;

  return (
    <div className="card-elevated p-6 flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Mic size={16} className="icon-gold" aria-hidden="true" />
        <h2 className="font-display text-lg font-bold text-foreground">
          {isInpui ? "Record in Inpui" : "Record in English"}
        </h2>
      </div>

      {/* MicButton hero */}
      <div className="flex flex-col items-center gap-2 py-4">
        <MicButton
          size="lg"
          isRecording={recorder.isRecording}
          onClick={handleToggle}
          aria-label={
            recorder.isRecording
              ? `Stop ${isInpui ? "Inpui" : "English"} recording`
              : `Start ${isInpui ? "Inpui" : "English"} recording`
          }
          data-ocid={`mic-btn-${lang}`}
        />

        {/* Timer */}
        {(recorder.isRecording || recorder.duration > 0) && (
          <div className="flex items-center gap-2 mt-1">
            {recorder.isRecording && (
              <span className="inline-block h-2 w-2 rounded-full bg-destructive animate-pulse" />
            )}
            <span className="font-mono text-sm font-semibold text-foreground tabular-nums">
              {formatDuration(recorder.duration)}
            </span>
          </div>
        )}

        {recorder.isTranscribing && (
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Loader2 size={12} className="animate-spin" />
            Transcribing...
          </span>
        )}
      </div>

      {/* Or: upload file */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-border" />
        <span className="text-xs text-muted-foreground">or upload audio</span>
        <div className="flex-1 h-px bg-border" />
      </div>

      <div>
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPTED_AUDIO}
          onChange={handleFileUpload}
          className="hidden"
          aria-label={`Upload audio file for ${lang}`}
          data-ocid={`audio-upload-input-${lang}`}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          className="w-full gap-2 border-dashed"
          data-ocid={`audio-upload-btn-${lang}`}
        >
          {uploadedFileName ? (
            <>
              <FileAudio size={14} className="icon-gold" />
              <span className="truncate max-w-[160px]">{uploadedFileName}</span>
            </>
          ) : (
            <>
              <Upload size={14} className="icon-gold" />
              Upload MP3, WAV, M4A, WebM (max 50MB)
            </>
          )}
        </Button>
      </div>

      {/* Audio playback */}
      {activeAudioUrl && (
        <div className="rounded-lg bg-muted p-3">
          <p className="text-xs text-muted-foreground mb-2 font-medium uppercase tracking-wide">
            Playback
          </p>
          {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
          <audio
            controls
            src={activeAudioUrl}
            className="w-full h-9"
            data-ocid={`audio-player-${lang}`}
            aria-label={`Playback of ${lang === "inpui" ? "Inpui" : "English"} recording`}
          >
            <track kind="captions" />
          </audio>
        </div>
      )}

      {/* Error */}
      {recorder.error && (
        <div className="flex items-start gap-2 text-destructive text-sm rounded-lg bg-destructive/10 px-3 py-2">
          <AlertCircle size={14} className="mt-0.5 shrink-0" />
          <span>{recorder.error}</span>
        </div>
      )}

      {/* Transcription textarea */}
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor={`transcript-${lang}`}
          className="text-xs font-semibold text-muted-foreground uppercase tracking-wide"
        >
          Transcription
          <span className="ml-1 text-muted-foreground font-normal normal-case">
            (editable)
          </span>
        </label>
        <textarea
          id={`transcript-${lang}`}
          rows={3}
          value={syncedTranscript}
          onChange={(e) => handleTextChange(e.target.value)}
          placeholder="Transcription will appear here..."
          data-ocid={`transcript-${lang}`}
          className="w-full resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:border-accent transition-smooth"
        />
      </div>

      {/* Clear button */}
      {(activeAudioUrl || syncedTranscript) && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleClear}
          className="self-start text-muted-foreground gap-1"
          data-ocid={`clear-btn-${lang}`}
        >
          <RotateCcw size={13} />
          Clear recording
        </Button>
      )}
    </div>
  );
}

// ─── Tag chips input ──────────────────────────────────────────────────────────

interface TagsInputProps {
  tags: string[];
  onChange: (tags: string[]) => void;
}

function TagsInput({ tags, onChange }: TagsInputProps) {
  const [inputValue, setInputValue] = useState("");

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "," || e.key === "Enter") {
      e.preventDefault();
      const val = inputValue.trim().toLowerCase();
      if (val && !tags.includes(val)) {
        onChange([...tags, val]);
      }
      setInputValue("");
    } else if (e.key === "Backspace" && !inputValue && tags.length > 0) {
      onChange(tags.slice(0, -1));
    }
  };

  return (
    <div className="flex flex-wrap gap-1.5 items-center min-h-[40px] w-full rounded-lg border border-input bg-background px-2.5 py-2 focus-within:ring-2 transition-smooth">
      {tags.map((tag) => (
        <Badge
          key={tag}
          variant="secondary"
          className="gap-1 pr-1.5 text-xs cursor-default"
        >
          {tag}
          <button
            type="button"
            onClick={() => onChange(tags.filter((t) => t !== tag))}
            aria-label={`Remove tag ${tag}`}
            className="ml-0.5 hover:text-destructive transition-colors"
          >
            <X size={10} />
          </button>
        </Badge>
      ))}
      <input
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={tags.length === 0 ? "Add tags, press Enter or comma…" : ""}
        className="flex-1 min-w-[120px] bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
        data-ocid="tags-input"
        aria-label="Tags input"
      />
    </div>
  );
}

// ─── VoicePage ────────────────────────────────────────────────────────────────

export default function VoicePage() {
  const [inpuiText, setInpuiText] = useState("");
  const [englishText, setEnglishText] = useState("");
  const [category, setCategory] = useState("greetings");
  const [tags, setTags] = useState<string[]>([]);
  const [contributorName, setContributorName] = useState("");
  const [resetKey, setResetKey] = useState(0);
  const [inpuiAudioBlob, setInpuiAudioBlob] = useState<Blob | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const addEntry = useAddCorpusEntry();

  // Keyboard shortcut: Cmd/Ctrl+R to focus mic
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "r") {
        e.preventDefault();
        const btn = document.querySelector<HTMLButtonElement>(
          '[data-ocid="mic-btn-inpui"]',
        );
        btn?.click();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!inpuiText.trim() || !englishText.trim()) {
      toast.error(
        "Please provide both Inpui and English text before submitting.",
      );
      return;
    }

    let audioStorageId: string | null = null;

    if (inpuiAudioBlob) {
      setIsUploading(true);
      setUploadProgress(20);
      try {
        audioStorageId = await uploadAudioToStorage(inpuiAudioBlob);
        setUploadProgress(80);
      } catch {
        toast.error("Audio upload failed. Submitting without audio.");
      } finally {
        setIsUploading(false);
        setUploadProgress(0);
      }
    }

    try {
      await addEntry.mutateAsync({
        inpui: inpuiText.trim(),
        english: englishText.trim(),
        category,
        tags,
        audioId: audioStorageId,
      });

      toast.success(
        "Contribution submitted! Thank you for preserving the Inpui language.",
      );

      setInpuiText("");
      setEnglishText("");
      setCategory("greetings");
      setTags([]);
      setContributorName("");
      setInpuiAudioBlob(null);
      setResetKey((k) => k + 1);
    } catch {
      toast.error("Failed to submit contribution. Please try again.");
    }
  };

  return (
    <div className="container max-w-screen-lg mx-auto px-4 py-8 space-y-8">
      {/* Page header */}
      <div>
        <h1 className="font-display text-3xl font-bold text-foreground mb-1">
          Voice Contribution
        </h1>
        <p className="text-muted-foreground">
          Record yourself speaking Inpui and English — your voice helps preserve
          the language for future generations.{" "}
          <kbd className="text-xs bg-muted border border-border rounded px-1 py-0.5">
            Ctrl+R
          </kbd>{" "}
          to toggle recording.
        </p>
      </div>

      {/* Recording panels */}
      <div
        key={resetKey}
        className="grid grid-cols-1 md:grid-cols-2 gap-6"
        data-ocid="recording-panels"
      >
        <RecordingPanel
          lang="inpui"
          transcript={inpuiText}
          onTranscriptChange={setInpuiText}
          onAudioBlob={setInpuiAudioBlob}
        />
        <RecordingPanel
          lang="english"
          transcript={englishText}
          onTranscriptChange={setEnglishText}
          onAudioBlob={() => {}}
        />
      </div>

      {/* Upload progress */}
      {isUploading && (
        <div className="rounded-lg border border-border bg-card p-4 space-y-2">
          <div className="flex items-center gap-2 text-sm text-foreground">
            <Loader2 size={14} className="animate-spin icon-gold" />
            Uploading audio to storage…
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${uploadProgress}%`,
                backgroundColor: "oklch(0.65 0.18 65)",
              }}
            />
          </div>
        </div>
      )}

      {/* Contribution form */}
      <form
        onSubmit={handleSubmit}
        className="card-elevated p-6 space-y-5"
        data-ocid="contribution-form"
      >
        <div className="flex items-center gap-2 mb-1">
          <span className="icon-gold font-display text-lg font-bold">◆</span>
          <h2 className="font-display text-xl font-bold text-foreground">
            Submit Contribution
          </h2>
        </div>

        {/* Inpui text */}
        <div className="space-y-1.5">
          <label
            htmlFor="form-inpui"
            className="text-sm font-semibold text-foreground"
          >
            Inpui Text <span className="text-destructive">*</span>
          </label>
          <textarea
            id="form-inpui"
            rows={2}
            value={inpuiText}
            onChange={(e) => setInpuiText(e.target.value)}
            placeholder="Enter or correct the Inpui text…"
            required
            data-ocid="form-inpui"
            className="w-full resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:border-accent transition-smooth"
          />
        </div>

        {/* English text */}
        <div className="space-y-1.5">
          <label
            htmlFor="form-english"
            className="text-sm font-semibold text-foreground"
          >
            English Text <span className="text-destructive">*</span>
          </label>
          <textarea
            id="form-english"
            rows={2}
            value={englishText}
            onChange={(e) => setEnglishText(e.target.value)}
            placeholder="Enter or correct the English text…"
            required
            data-ocid="form-english"
            className="w-full resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:border-accent transition-smooth"
          />
        </div>

        {/* Category + contributor row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label
              htmlFor="form-category"
              className="text-sm font-semibold text-foreground"
            >
              Category
            </label>
            <select
              id="form-category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              data-ocid="form-category"
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 transition-smooth capitalize"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c} className="capitalize">
                  {c.charAt(0).toUpperCase() + c.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="form-contributor"
              className="text-sm font-semibold text-foreground"
            >
              Your Name{" "}
              <span className="text-muted-foreground font-normal">
                (optional)
              </span>
            </label>
            <input
              id="form-contributor"
              type="text"
              value={contributorName}
              onChange={(e) => setContributorName(e.target.value)}
              placeholder="e.g. Lalruati Pachuau"
              data-ocid="form-contributor"
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 transition-smooth"
            />
          </div>
        </div>

        {/* Tags */}
        <div className="space-y-1.5">
          <p className="text-sm font-semibold text-foreground">
            Tags{" "}
            <span className="text-muted-foreground font-normal">
              (press Enter or comma to add)
            </span>
          </p>
          <TagsInput tags={tags} onChange={setTags} />
        </div>

        {/* Audio status */}
        {inpuiAudioBlob && (
          <div className="flex items-center gap-2 text-sm text-secondary rounded-lg bg-secondary/10 px-3 py-2">
            <FileAudio size={14} className="shrink-0" />
            Audio attached and will be uploaded with this contribution.
          </div>
        )}

        {/* Submit */}
        <div className="flex items-center justify-between pt-2">
          <p className="text-xs text-muted-foreground">
            Both Inpui and English texts are required.
          </p>
          <Button
            type="submit"
            disabled={
              addEntry.isPending ||
              isUploading ||
              !inpuiText.trim() ||
              !englishText.trim()
            }
            data-ocid="submit-contribution"
            className="gap-2 px-6"
            style={{
              backgroundColor: "oklch(0.28 0.10 247)",
              color: "oklch(0.98 0 0)",
            }}
          >
            {addEntry.isPending || isUploading ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                {isUploading ? "Uploading audio…" : "Submitting…"}
              </>
            ) : (
              "Submit Contribution"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
