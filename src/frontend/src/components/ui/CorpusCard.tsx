import { ChatThread } from "@/components/ChatThread";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Pause, Play, Star, Volume2 } from "lucide-react";
import type { CSSProperties } from "react";
import { useRef, useState } from "react";
import type { CorpusEntry } from "../../types";

// Category color palettes using OKLCH tokens (hue, chroma, lightness pairs)
// Each entry: [bg-oklch, text-oklch, border-oklch]
const CATEGORY_COLORS: Record<string, [string, string, string]> = {
  greetings: [
    "oklch(0.94 0.04 240 / 0.5)",
    "oklch(0.35 0.12 240)",
    "oklch(0.82 0.06 240 / 0.6)",
  ],
  food: [
    "oklch(0.95 0.06 65 / 0.4)",
    "oklch(0.42 0.13 65)",
    "oklch(0.82 0.08 65 / 0.6)",
  ],
  verbs: [
    "oklch(0.94 0.05 155 / 0.4)",
    "oklch(0.38 0.12 155)",
    "oklch(0.82 0.07 155 / 0.6)",
  ],
  travel: [
    "oklch(0.93 0.05 185 / 0.4)",
    "oklch(0.38 0.11 185)",
    "oklch(0.82 0.07 185 / 0.6)",
  ],
  numbers: [
    "oklch(0.94 0.05 300 / 0.4)",
    "oklch(0.38 0.12 300)",
    "oklch(0.82 0.07 300 / 0.6)",
  ],
  family: [
    "oklch(0.94 0.06 350 / 0.4)",
    "oklch(0.38 0.12 350)",
    "oklch(0.82 0.07 350 / 0.6)",
  ],
  expressions: [
    "oklch(0.94 0.06 40 / 0.4)",
    "oklch(0.40 0.13 40)",
    "oklch(0.82 0.08 40 / 0.6)",
  ],
  "common words": [
    "oklch(0.93 0.04 220 / 0.4)",
    "oklch(0.38 0.10 220)",
    "oklch(0.82 0.06 220 / 0.6)",
  ],
};

function getCategoryInlineStyle(category: string): CSSProperties {
  const key = category.toLowerCase();
  const colors = CATEGORY_COLORS[key];
  if (!colors) return {};
  return {
    backgroundColor: colors[0],
    color: colors[1],
    borderColor: colors[2],
  };
}

// ─── AudioPlayer component ─────────────────────────────────────────────────────

const SPEEDS = [0.75, 1, 1.25, 1.5] as const;

interface AudioPlayerProps {
  src: string;
  entryLabel: string;
}

function AudioPlayer({ src, entryLabel }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [speed, setSpeed] = useState(1);

  function togglePlay() {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(() => {});
    }
  }

  function handleTimeUpdate() {
    if (!audioRef.current) return;
    setProgress(audioRef.current.currentTime);
  }

  function handleLoadedMetadata() {
    if (!audioRef.current) return;
    setDuration(audioRef.current.duration);
  }

  function handleSeek(e: React.ChangeEvent<HTMLInputElement>) {
    if (!audioRef.current) return;
    const val = Number(e.target.value);
    audioRef.current.currentTime = val;
    setProgress(val);
  }

  function handleSpeedChange(s: number) {
    setSpeed(s);
    if (audioRef.current) audioRef.current.playbackRate = s;
  }

  function fmt(sec: number) {
    const m = Math.floor(sec / 60)
      .toString()
      .padStart(2, "0");
    const s = Math.floor(sec % 60)
      .toString()
      .padStart(2, "0");
    return `${m}:${s}`;
  }

  return (
    <div
      className="mt-2 rounded-lg bg-muted/50 px-3 py-2 space-y-1.5"
      data-ocid="audio-player-card"
    >
      {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
      <audio
        ref={audioRef}
        src={src}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => {
          setIsPlaying(false);
          setProgress(0);
        }}
        aria-label={`Audio for ${entryLabel}`}
      >
        <track kind="captions" />
      </audio>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={togglePlay}
          className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-smooth hover:opacity-80"
          style={{
            backgroundColor: "oklch(0.35 0.12 247)",
            color: "oklch(0.98 0 0)",
          }}
          aria-label={isPlaying ? "Pause" : "Play"}
        >
          {isPlaying ? <Pause size={12} /> : <Play size={12} />}
        </button>

        <span className="text-xs tabular-nums text-muted-foreground w-9 shrink-0">
          {fmt(progress)}
        </span>

        <input
          type="range"
          min={0}
          max={duration || 1}
          step={0.1}
          value={progress}
          onChange={handleSeek}
          className="flex-1 h-1 accent-primary cursor-pointer"
          aria-label="Seek"
        />

        <span className="text-xs tabular-nums text-muted-foreground w-9 shrink-0 text-right">
          {fmt(duration)}
        </span>
      </div>

      {/* Speed selector */}
      <div className="flex items-center gap-1">
        <span className="text-[10px] text-muted-foreground mr-1">Speed:</span>
        {SPEEDS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => handleSpeedChange(s)}
            className={cn(
              "text-[10px] px-1.5 py-0.5 rounded transition-smooth",
              speed === s
                ? "font-semibold text-primary-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
            style={
              speed === s
                ? { backgroundColor: "oklch(0.35 0.12 247)" }
                : undefined
            }
            aria-label={`Speed ${s}x`}
            aria-pressed={speed === s}
          >
            {s}x
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── CorpusCard ────────────────────────────────────────────────────────────────

interface CorpusCardProps {
  entry: CorpusEntry;
  isFavorited?: boolean;
  onToggleFavorite?: (id: string) => void;
  onPlayAudio?: (audioId: string) => void;
  alternating?: boolean;
  className?: string;
  showChat?: boolean;
}

export function CorpusCard({
  entry,
  isFavorited,
  onToggleFavorite,
  alternating = false,
  className,
  showChat = true,
}: CorpusCardProps) {
  const favorited = isFavorited ?? entry.isFavorite;
  const audioSrc = entry.audioStorageId || null;
  const [showAudio, setShowAudio] = useState(false);

  return (
    <div
      data-ocid={`corpus-card-${entry.id}`}
      className={cn(
        "transition-smooth",
        alternating ? "bg-muted/30" : "bg-transparent",
        "hover:bg-muted/50",
        className,
      )}
    >
      <div className="group flex items-start gap-3 px-4 py-3">
        {/* Main content */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 min-w-0">
            <span className="font-display text-base font-semibold text-foreground leading-snug">
              {entry.inpui}
            </span>
            <span className="text-sm text-muted-foreground leading-snug truncate max-w-[240px]">
              {entry.english}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-1 mt-1.5">
            <Badge
              variant="outline"
              className="text-xs font-medium border px-1.5 py-0 leading-5"
              style={getCategoryInlineStyle(entry.category)}
            >
              {entry.category}
            </Badge>
            {entry.tags.map((tag) => (
              <Badge
                key={tag}
                variant="outline"
                className="text-xs font-normal text-muted-foreground border-border/60 px-1.5 py-0 leading-5"
              >
                #{tag}
              </Badge>
            ))}
          </div>

          {/* Audio player (expanded) */}
          {showAudio && audioSrc && (
            <AudioPlayer src={audioSrc} entryLabel={entry.inpui} />
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-0.5 shrink-0 pt-0.5 opacity-60 group-hover:opacity-100 transition-smooth">
          {audioSrc && (
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "h-7 w-7",
                showAudio
                  ? "text-primary"
                  : "text-primary hover:text-primary/80",
              )}
              onClick={() => setShowAudio((s) => !s)}
              aria-label={
                showAudio
                  ? `Hide audio for ${entry.inpui}`
                  : `Play audio for ${entry.inpui}`
              }
              data-ocid={`play-audio-${entry.id}`}
            >
              <Volume2 size={14} />
            </Button>
          )}
          {!audioSrc && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground/30 cursor-not-allowed pointer-events-none"
              disabled
              aria-label="No audio available"
            >
              <Volume2 size={14} />
            </Button>
          )}
          {onToggleFavorite && (
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "h-7 w-7 transition-smooth",
                favorited
                  ? "text-accent hover:text-accent/80"
                  : "text-muted-foreground hover:text-accent",
              )}
              onClick={() => onToggleFavorite(entry.id)}
              aria-label={
                favorited
                  ? `Remove ${entry.inpui} from favorites`
                  : `Add ${entry.inpui} to favorites`
              }
              data-ocid={`favorite-btn-${entry.id}`}
            >
              <Star size={14} fill={favorited ? "currentColor" : "none"} />
            </Button>
          )}
        </div>
      </div>

      {/* Community chat */}
      {showChat && <ChatThread entryId={entry.id} />}
    </div>
  );
}
