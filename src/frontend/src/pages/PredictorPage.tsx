import { MicButton } from "@/components/ui/MicButton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useGetPredictions,
  useSubmitPredictionFeedback,
} from "@/hooks/useQueries";
import { useAudioRecorder } from "@/lib/audio";
import { cn } from "@/lib/utils";
import type { PredictionResult } from "@/types";
import { ArrowLeftRight, Brain, ThumbsDown, ThumbsUp } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

type LangDirection = "inpui-to-english" | "english-to-inpui";

interface FeedbackState {
  given: boolean;
  value: boolean | null;
}

// ─── Confidence Badge ─────────────────────────────────────────────────────────

function ConfidenceBadge({ score }: { score: number }) {
  const pct = Math.round(score * 100);
  return (
    <Badge
      className="rounded-full px-3 py-0.5 text-sm font-bold border-0"
      style={{
        backgroundColor: "oklch(0.88 0.14 85)",
        color: "oklch(0.28 0.10 60)",
      }}
      aria-label={`${pct}% confidence`}
    >
      {pct}%
    </Badge>
  );
}

// ─── Confidence Bar ───────────────────────────────────────────────────────────

function ConfidenceBar({ score }: { score: number }) {
  const pct = Math.round(score * 100);
  return (
    <div
      className="h-1.5 w-full rounded-full overflow-hidden"
      style={{ backgroundColor: "oklch(0.90 0.04 85)" }}
      aria-hidden="true"
    >
      <motion.div
        className="h-full rounded-full"
        style={{ backgroundColor: "oklch(0.72 0.18 75)" }}
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      />
    </div>
  );
}

// ─── Prediction Card ──────────────────────────────────────────────────────────

interface PredictionCardProps {
  result: PredictionResult;
  index: number;
  direction: LangDirection;
  onFeedback: (result: PredictionResult, isCorrect: boolean) => void;
  feedback: FeedbackState;
}

function PredictionCard({
  result,
  index,
  direction,
  onFeedback,
  feedback,
}: PredictionCardProps) {
  const sourceLang =
    direction === "inpui-to-english" ? result.inpui : result.english;
  const targetLang =
    direction === "inpui-to-english" ? result.english : result.inpui;
  const sourceLabel = direction === "inpui-to-english" ? "Inpui" : "English";
  const targetLabel = direction === "inpui-to-english" ? "English" : "Inpui";

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.08 }}
    >
      <Card className="card-elevated overflow-hidden">
        <CardContent className="p-0">
          {/* Header row */}
          <div className="flex items-center justify-between px-5 pt-4 pb-2">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Match #{index + 1}
            </span>
            <ConfidenceBadge score={result.confidence} />
          </div>

          {/* Phrase pair */}
          <div className="grid grid-cols-2 gap-px mx-5 mb-3 rounded-lg overflow-hidden border border-border">
            <div className="bg-muted px-3 py-2.5">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-0.5">
                {sourceLabel}
              </p>
              <p className="text-sm font-semibold text-foreground leading-snug">
                {sourceLang}
              </p>
            </div>
            <div className="bg-card px-3 py-2.5">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-0.5">
                {targetLabel}
              </p>
              <p className="text-sm font-semibold text-foreground leading-snug">
                {targetLang}
              </p>
            </div>
          </div>

          {/* Confidence bar */}
          <div className="px-5 mb-4">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                Confidence
              </span>
              <span
                className="text-[10px] font-medium"
                style={{ color: "oklch(0.62 0.14 75)" }}
              >
                {Math.round(result.confidence * 100)}%
              </span>
            </div>
            <ConfidenceBar score={result.confidence} />
          </div>

          {/* Feedback row */}
          <div
            className="flex items-center justify-between px-5 py-3 border-t border-border"
            style={{ backgroundColor: "oklch(0.97 0.005 0)" }}
          >
            <span className="text-xs text-muted-foreground">
              Is this prediction correct?
            </span>
            <AnimatePresence mode="wait">
              {feedback.given ? (
                <motion.span
                  key="thanks"
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  className="text-xs font-medium"
                  style={{ color: "oklch(0.50 0.18 145)" }}
                >
                  ✓ Thank you for your feedback!
                </motion.span>
              ) : (
                <motion.div
                  key="buttons"
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  className="flex gap-2"
                >
                  <button
                    type="button"
                    onClick={() => onFeedback(result, true)}
                    disabled={feedback.given}
                    data-ocid="feedback-yes"
                    aria-label="Mark prediction as correct"
                    className={cn(
                      "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-smooth",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      "disabled:opacity-50 disabled:cursor-not-allowed",
                    )}
                    style={{
                      backgroundColor: "oklch(0.92 0.08 145)",
                      color: "oklch(0.30 0.14 145)",
                    }}
                  >
                    <ThumbsUp size={13} aria-hidden="true" />
                    Yes
                  </button>
                  <button
                    type="button"
                    onClick={() => onFeedback(result, false)}
                    disabled={feedback.given}
                    data-ocid="feedback-no"
                    aria-label="Mark prediction as incorrect"
                    className={cn(
                      "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-smooth",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      "disabled:opacity-50 disabled:cursor-not-allowed",
                    )}
                    style={{
                      backgroundColor: "oklch(0.93 0.08 22)",
                      color: "oklch(0.38 0.16 22)",
                    }}
                  >
                    <ThumbsDown size={13} aria-hidden="true" />
                    No
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ─── Loading Skeletons ────────────────────────────────────────────────────────

function PredictionSkeletons() {
  return (
    <div className="flex flex-col gap-3">
      {[0, 1, 2].map((i) => (
        <Card key={i} className="card-elevated">
          <CardContent className="p-5 space-y-3">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-6 w-14 rounded-full" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Skeleton className="h-12 rounded-lg" />
              <Skeleton className="h-12 rounded-lg" />
            </div>
            <Skeleton className="h-2 w-full rounded-full" />
            <Skeleton className="h-10 w-full rounded-lg" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ─── Empty / No Results ───────────────────────────────────────────────────────

function EmptyResults({ searched }: { searched: boolean }) {
  if (!searched) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
          style={{ backgroundColor: "oklch(0.94 0.04 85)" }}
        >
          <Brain
            size={32}
            style={{ color: "oklch(0.62 0.14 75)" }}
            aria-hidden="true"
          />
        </div>
        <h3 className="font-display text-lg font-semibold text-foreground mb-2">
          Ready to Predict
        </h3>
        <p className="text-sm text-muted-foreground max-w-xs">
          Enter a word or phrase above and press{" "}
          <span
            className="font-medium"
            style={{ color: "oklch(0.62 0.14 75)" }}
          >
            Predict
          </span>{" "}
          to find the closest matches from the corpus.
        </p>
      </div>
    );
  }
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div
        className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
        style={{ backgroundColor: "oklch(0.94 0.04 85)" }}
      >
        <Brain
          size={32}
          style={{ color: "oklch(0.72 0.08 75)" }}
          aria-hidden="true"
        />
      </div>
      <h3 className="font-display text-lg font-semibold text-foreground mb-2">
        No predictions found
      </h3>
      <p className="text-sm text-muted-foreground max-w-xs">
        No close matches in the corpus for this input. Try a different word or
        contribute this phrase to the queue.
      </p>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function PredictorPage() {
  const [inputText, setInputText] = useState("");
  const [submittedInput, setSubmittedInput] = useState("");
  const [direction, setDirection] = useState<LangDirection>("inpui-to-english");
  const [feedbackMap, setFeedbackMap] = useState<Record<string, FeedbackState>>(
    {},
  );
  const [totalFeedback, setTotalFeedback] = useState(0);

  const inputRef = useRef<HTMLInputElement>(null);
  const mic = useAudioRecorder(
    direction === "inpui-to-english" ? "en-IN" : "en-US",
  );
  const { mutate: submitFeedback } = useSubmitPredictionFeedback();

  const { data: results = [], isFetching } = useGetPredictions(submittedInput);

  // When recording stops and transcript is ready, fill input
  useEffect(() => {
    if (!mic.isRecording && mic.transcript) {
      setInputText(mic.transcript.trim());
    }
  }, [mic.isRecording, mic.transcript]);

  const handleToggleMic = useCallback(async () => {
    if (mic.isRecording) {
      mic.stopRecording();
    } else {
      mic.clearRecording();
      await mic.startRecording();
    }
  }, [mic]);

  const handlePredict = useCallback(() => {
    const trimmed = inputText.trim();
    if (!trimmed) return;
    setSubmittedInput(trimmed);
    setFeedbackMap({});
  }, [inputText]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") handlePredict();
    },
    [handlePredict],
  );

  const handleToggleDirection = useCallback(() => {
    setDirection((d) =>
      d === "inpui-to-english" ? "english-to-inpui" : "inpui-to-english",
    );
    setInputText("");
    setSubmittedInput("");
    setFeedbackMap({});
  }, []);

  const handleFeedback = useCallback(
    (result: PredictionResult, isCorrect: boolean) => {
      const key = result.sourceEntryId ?? `${result.inpui}:${result.english}`;
      setFeedbackMap((prev) => ({
        ...prev,
        [key]: { given: true, value: isCorrect },
      }));
      setTotalFeedback((n) => n + 1);
      submitFeedback({
        predictionId: key,
        isCorrect,
        correction: null,
      });
    },
    [submitFeedback],
  );

  const directionLabel =
    direction === "inpui-to-english" ? "Inpui → English" : "English → Inpui";
  const inputPlaceholder =
    direction === "inpui-to-english"
      ? "Enter Inpui text or phrase…"
      : "Enter English text or phrase…";

  const hasSearched = submittedInput.length > 0;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        {/* Page header */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Brain size={22} className="icon-gold" aria-hidden="true" />
            <h1 className="font-display text-2xl font-bold text-foreground">
              Semantic Predictor
            </h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Enter a word or phrase to find the closest semantic matches in the
            Inpui corpus. Your feedback trains the predictor to improve over
            time.
          </p>
        </div>

        {/* Input card */}
        <Card className="card-elevated">
          <CardContent className="p-5 space-y-4">
            {/* Direction toggle */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Translation Direction
              </span>
              <button
                type="button"
                onClick={handleToggleDirection}
                data-ocid="direction-toggle"
                aria-label={`Switch direction. Currently: ${directionLabel}`}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold",
                  "border border-border transition-smooth",
                  "hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                )}
                style={{ color: "oklch(0.35 0.12 247)" }}
              >
                <ArrowLeftRight size={13} aria-hidden="true" />
                {directionLabel}
              </button>
            </div>

            {/* Input + MicButton row */}
            <div className="flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <Input
                  ref={inputRef}
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={inputPlaceholder}
                  data-ocid="predictor-input"
                  className="h-11 text-sm"
                  aria-label="Prediction input"
                />
              </div>

              {/* Green pulsing mic button */}
              <MicButton
                isRecording={mic.isRecording}
                onClick={handleToggleMic}
                size="sm"
                aria-label={
                  mic.isRecording ? "Stop voice input" : "Start voice input"
                }
              />
            </div>

            {/* Live transcript preview */}
            <AnimatePresence>
              {mic.isRecording && mic.transcript && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="rounded-lg px-3 py-2 text-sm text-muted-foreground border border-border bg-muted overflow-hidden"
                >
                  <span
                    className="text-[10px] uppercase tracking-wider font-medium block mb-0.5"
                    style={{ color: "oklch(0.50 0.18 145)" }}
                  >
                    Transcribing…
                  </span>
                  {mic.transcript}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Mic error */}
            {mic.error && (
              <p className="text-xs text-destructive" role="alert">
                {mic.error}
              </p>
            )}

            {/* Predict button */}
            <Button
              onClick={handlePredict}
              disabled={!inputText.trim() || isFetching}
              data-ocid="predict-button"
              className="w-full h-11 font-semibold text-sm border-0"
              style={{
                backgroundColor: "oklch(0.72 0.18 75)",
                color: "oklch(0.15 0.04 60)",
              }}
            >
              {isFetching ? "Searching corpus…" : "Predict"}
            </Button>
          </CardContent>
        </Card>

        {/* Results section */}
        <div data-ocid="results-section">
          {isFetching ? (
            <PredictionSkeletons />
          ) : hasSearched && results.length > 0 ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-foreground">
                  {results.length} match{results.length !== 1 ? "es" : ""} found
                </h2>
                <span className="text-xs text-muted-foreground">
                  for &ldquo;{submittedInput}&rdquo;
                </span>
              </div>
              {results.map((result, i) => {
                const key =
                  result.sourceEntryId ?? `${result.inpui}:${result.english}`;
                return (
                  <PredictionCard
                    key={key}
                    result={result}
                    index={i}
                    direction={direction}
                    onFeedback={handleFeedback}
                    feedback={feedbackMap[key] ?? { given: false, value: null }}
                  />
                );
              })}
            </div>
          ) : (
            <EmptyResults searched={hasSearched} />
          )}
        </div>

        {/* Feedback history summary */}
        <AnimatePresence>
          {totalFeedback > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              data-ocid="feedback-summary"
            >
              <Card className="card-elevated">
                <CardContent className="px-5 py-4 flex items-start gap-3">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{ backgroundColor: "oklch(0.92 0.08 145)" }}
                    aria-hidden="true"
                  >
                    <ThumbsUp
                      size={15}
                      style={{ color: "oklch(0.35 0.14 145)" }}
                    />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      You&apos;ve provided{" "}
                      <span style={{ color: "oklch(0.50 0.18 145)" }}>
                        {totalFeedback} feedback response
                        {totalFeedback !== 1 ? "s" : ""}
                      </span>
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      This helps improve predictions over time. Thank you for
                      contributing to the Inpui language project!
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
