import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useCorpusEntries } from "@/hooks/useQueries";
import type { CorpusEntry } from "@/types";
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Shuffle,
  Star,
  XCircle,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

// ─── Constants ────────────────────────────────────────────────────────────────

const KNOWN_CATEGORIES = [
  "All",
  "Greetings",
  "Food",
  "Verbs",
  "Travel",
  "Numbers",
  "Family",
  "Common Words",
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function shuffleArray<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function getWrongAnswers(correct: CorpusEntry, pool: CorpusEntry[]): string[] {
  const others = pool.filter((e) => e.id !== correct.id);
  return shuffleArray(others)
    .slice(0, 3)
    .map((e) => e.english);
}

// ─── Flashcard component ──────────────────────────────────────────────────────

interface FlashcardProps {
  entry: CorpusEntry;
  isFlipped: boolean;
  onFlip: () => void;
}

function Flashcard({ entry, isFlipped, onFlip }: FlashcardProps) {
  return (
    <button
      type="button"
      className="w-full cursor-pointer select-none text-left"
      style={{ perspective: "1200px", minHeight: "280px" }}
      onClick={onFlip}
      aria-label={
        isFlipped
          ? `Back: ${entry.english}. Press to flip back.`
          : `Front: ${entry.inpui}. Press to reveal translation.`
      }
      data-ocid="flashcard-flip"
    >
      <div
        className="relative w-full"
        style={{
          transition: "transform 600ms cubic-bezier(0.4, 0, 0.2, 1)",
          transformStyle: "preserve-3d",
          transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
          minHeight: "280px",
        }}
      >
        {/* Front face */}
        <div
          className="absolute inset-0 rounded-2xl flex flex-col items-center justify-center p-8 gap-4 shadow-xl"
          style={{
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
            background: "oklch(0.28 0.10 247)",
          }}
        >
          <span
            className="text-xs font-medium uppercase tracking-widest"
            style={{ color: "oklch(0.72 0.2 65)" }}
          >
            Inpui
          </span>
          <p
            className="font-display text-4xl md:text-5xl font-bold text-center leading-tight"
            style={{ color: "oklch(0.98 0 0)" }}
          >
            {entry.inpui}
          </p>
          {entry.category && (
            <Badge
              variant="outline"
              className="text-xs mt-2"
              style={{
                borderColor: "oklch(0.72 0.2 65 / 0.5)",
                color: "oklch(0.72 0.2 65)",
              }}
            >
              {entry.category}
            </Badge>
          )}
          <p className="text-xs mt-2" style={{ color: "oklch(0.62 0 0)" }}>
            Tap to reveal
          </p>
        </div>

        {/* Back face */}
        <div
          className="absolute inset-0 rounded-2xl flex flex-col items-center justify-center p-8 gap-4 bg-card shadow-xl"
          style={{
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
            borderTop: "4px solid oklch(0.65 0.18 65)",
          }}
        >
          <span className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
            English
          </span>
          <p className="font-display text-4xl md:text-5xl font-bold text-center text-foreground leading-tight">
            {entry.english}
          </p>
          <div className="flex flex-wrap gap-2 mt-2 justify-center">
            {entry.tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
          <p className="text-xs mt-2 text-muted-foreground">Tap to go back</p>
        </div>
      </div>
    </button>
  );
}

// ─── Mode toggle ──────────────────────────────────────────────────────────────

type Mode = "flashcard" | "quiz";

interface ModeToggleProps {
  mode: Mode;
  onChange: (m: Mode) => void;
}

function ModeToggle({ mode, onChange }: ModeToggleProps) {
  return (
    <div
      className="flex rounded-xl bg-muted p-1 gap-1 w-full max-w-xs"
      role="tablist"
      aria-label="Practice mode"
    >
      {(["flashcard", "quiz"] as Mode[]).map((m) => (
        <button
          key={m}
          type="button"
          role="tab"
          aria-selected={mode === m}
          onClick={() => onChange(m)}
          data-ocid={`mode-toggle-${m}`}
          className={[
            "flex-1 rounded-lg py-2 text-sm font-medium transition-smooth capitalize",
            mode === m
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          ].join(" ")}
        >
          {m === "flashcard" ? "Flashcard" : "Quiz"}
        </button>
      ))}
    </div>
  );
}

// ─── Category selector ────────────────────────────────────────────────────────

interface CategorySelectorProps {
  categories: string[];
  selected: string;
  onChange: (c: string) => void;
}

function CategorySelector({
  categories,
  selected,
  onChange,
}: CategorySelectorProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  return (
    <div
      ref={scrollRef}
      className="flex gap-2 overflow-x-auto pb-1"
      aria-label="Filter by category"
      style={{ scrollbarWidth: "none" }}
    >
      {categories.map((cat) => (
        <button
          key={cat}
          type="button"
          aria-pressed={selected === cat}
          onClick={() => onChange(cat)}
          data-ocid={`category-${cat.toLowerCase().replace(/\s+/g, "-")}`}
          className={[
            "whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium transition-smooth flex-shrink-0",
            selected === cat
              ? "text-primary-foreground shadow-sm"
              : "bg-muted text-muted-foreground hover:text-foreground",
          ].join(" ")}
          style={
            selected === cat
              ? { background: "oklch(0.28 0.10 247)" }
              : undefined
          }
        >
          {cat}
        </button>
      ))}
    </div>
  );
}

// ─── Flashcard Mode ───────────────────────────────────────────────────────────

interface FlashcardModeProps {
  entries: CorpusEntry[];
}

function FlashcardMode({ entries }: FlashcardModeProps) {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [deck, setDeck] = useState<CorpusEntry[]>([]);
  const [index, setIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  const filtered = useMemo(
    () =>
      selectedCategory === "All"
        ? entries
        : entries.filter((e) => e.category === selectedCategory),
    [entries, selectedCategory],
  );

  const availableCategories = useMemo(() => {
    const cats = Array.from(new Set(entries.map((e) => e.category))).filter(
      Boolean,
    );
    const known = cats.filter((c) => KNOWN_CATEGORIES.includes(c));
    const others = cats.filter(
      (c) => !KNOWN_CATEGORIES.includes(c) && c !== "All",
    );
    return ["All", ...known, ...others];
  }, [entries]);

  useEffect(() => {
    setDeck(filtered);
    setIndex(0);
    setIsFlipped(false);
  }, [filtered]);

  const handleShuffle = useCallback(() => {
    setDeck((prev) => shuffleArray(prev));
    setIndex(0);
    setIsFlipped(false);
  }, []);

  const handlePrev = () => {
    setIndex((i) => Math.max(0, i - 1));
    setIsFlipped(false);
  };

  const handleNext = () => {
    setIndex((i) => Math.min(deck.length - 1, i + 1));
    setIsFlipped(false);
  };

  const progress = deck.length > 0 ? ((index + 1) / deck.length) * 100 : 0;
  const current = deck[index];

  return (
    <div className="flex flex-col gap-5">
      <CategorySelector
        categories={availableCategories}
        selected={selectedCategory}
        onChange={(cat) => {
          setSelectedCategory(cat);
          setIsFlipped(false);
        }}
      />

      {deck.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center py-20 gap-4 text-center"
          data-ocid="flashcard-empty"
        >
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
            <RotateCcw className="w-7 h-7 text-muted-foreground" />
          </div>
          <p className="font-display text-xl font-bold text-foreground">
            No cards in this category
          </p>
          <p className="text-muted-foreground text-sm max-w-xs">
            Try selecting "All" or a different category to start practicing.
          </p>
          <Button variant="outline" onClick={() => setSelectedCategory("All")}>
            Show All Cards
          </Button>
        </div>
      ) : (
        <>
          {/* Progress bar */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${progress}%`,
                  background: "oklch(0.28 0.10 247)",
                }}
                aria-label={`${index + 1} of ${deck.length} cards`}
              />
            </div>
            <span className="text-sm font-medium text-muted-foreground tabular-nums whitespace-nowrap">
              {index + 1} / {deck.length}
            </span>
          </div>

          {/* Card */}
          {current && (
            <Flashcard
              entry={current}
              isFlipped={isFlipped}
              onFlip={() => setIsFlipped((f) => !f)}
            />
          )}

          {/* Controls */}
          <div className="flex items-center justify-between gap-3 mt-1">
            <Button
              variant="outline"
              size="icon"
              onClick={handlePrev}
              disabled={index === 0}
              aria-label="Previous card"
              data-ocid="flashcard-prev"
              className="h-11 w-11 rounded-xl"
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>

            <Button
              variant="outline"
              onClick={handleShuffle}
              className="flex items-center gap-2 rounded-xl"
              data-ocid="flashcard-shuffle"
            >
              <Shuffle className="w-4 h-4 icon-gold" />
              Shuffle
            </Button>

            <Button
              variant="outline"
              size="icon"
              onClick={handleNext}
              disabled={index === deck.length - 1}
              aria-label="Next card"
              data-ocid="flashcard-next"
              className="h-11 w-11 rounded-xl"
            >
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Quiz Mode ────────────────────────────────────────────────────────────────

type AnswerState = "idle" | "correct" | "wrong";

interface QuizModeProps {
  entries: CorpusEntry[];
}

function QuizMode({ entries }: QuizModeProps) {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [deck, setDeck] = useState<CorpusEntry[]>([]);
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [total, setTotal] = useState(0);
  const [choices, setChoices] = useState<string[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [answerState, setAnswerState] = useState<AnswerState>("idle");
  const [isComplete, setIsComplete] = useState(false);

  const filtered = useMemo(
    () =>
      selectedCategory === "All"
        ? entries
        : entries.filter((e) => e.category === selectedCategory),
    [entries, selectedCategory],
  );

  const availableCategories = useMemo(() => {
    const cats = Array.from(new Set(entries.map((e) => e.category))).filter(
      Boolean,
    );
    const known = cats.filter((c) => KNOWN_CATEGORIES.includes(c));
    const others = cats.filter(
      (c) => !KNOWN_CATEGORIES.includes(c) && c !== "All",
    );
    return ["All", ...known, ...others];
  }, [entries]);

  const buildChoices = useCallback(
    (card: CorpusEntry, pool: CorpusEntry[]) => {
      const wrongs = getWrongAnswers(card, pool.length >= 4 ? pool : entries);
      setChoices(shuffleArray([card.english, ...wrongs]));
    },
    [entries],
  );

  const initDeck = useCallback(
    (pool: CorpusEntry[]) => {
      const shuffled = shuffleArray(pool);
      setDeck(shuffled);
      setIndex(0);
      setScore(0);
      setTotal(0);
      setSelected(null);
      setAnswerState("idle");
      setIsComplete(false);
      if (shuffled.length > 0) {
        buildChoices(shuffled[0], pool);
      }
    },
    [buildChoices],
  );

  useEffect(() => {
    initDeck(filtered);
  }, [filtered, initDeck]);

  const handleAnswer = (choice: string) => {
    if (answerState !== "idle") return;
    const correct = deck[index]?.english;
    setSelected(choice);
    const isCorrect = choice === correct;
    setAnswerState(isCorrect ? "correct" : "wrong");
    setTotal((t) => t + 1);
    if (isCorrect) setScore((s) => s + 1);
  };

  const handleNext = () => {
    const nextIdx = index + 1;
    if (nextIdx >= deck.length) {
      setIsComplete(true);
      return;
    }
    setIndex(nextIdx);
    setSelected(null);
    setAnswerState("idle");
    buildChoices(deck[nextIdx], deck);
  };

  const current = deck[index];

  if (deck.length === 0) {
    return (
      <div className="flex flex-col gap-5">
        <CategorySelector
          categories={availableCategories}
          selected={selectedCategory}
          onChange={setSelectedCategory}
        />
        <div
          className="flex flex-col items-center justify-center py-20 gap-4 text-center"
          data-ocid="quiz-empty"
        >
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
            <XCircle className="w-7 h-7 text-muted-foreground" />
          </div>
          <p className="font-display text-xl font-bold text-foreground">
            No entries in this category
          </p>
          <p className="text-muted-foreground text-sm">
            Try "All" to quiz across the full corpus.
          </p>
          <Button variant="outline" onClick={() => setSelectedCategory("All")}>
            Show All
          </Button>
        </div>
      </div>
    );
  }

  if (isComplete) {
    const pct = total > 0 ? Math.round((score / total) * 100) : 0;
    const message =
      pct === 100
        ? "Perfect! 100% 🎉"
        : pct >= 70
          ? `Great job! ${pct}%`
          : `Keep practicing! ${pct}%`;
    const isGreat = pct >= 70;

    return (
      <div className="flex flex-col gap-5">
        <CategorySelector
          categories={availableCategories}
          selected={selectedCategory}
          onChange={setSelectedCategory}
        />
        <AnimatePresence>
          <motion.div
            key="quiz-complete"
            className="flex flex-col items-center justify-center py-16 gap-6 text-center"
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, type: "spring", stiffness: 120 }}
            data-ocid="quiz-complete"
          >
            <motion.div
              className="w-20 h-20 rounded-full flex items-center justify-center"
              style={{
                background: isGreat
                  ? "oklch(0.65 0.18 65 / 0.15)"
                  : "oklch(0.28 0.10 247 / 0.1)",
              }}
              animate={{ rotate: pct === 100 ? [0, -10, 10, -5, 5, 0] : 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
            >
              {pct === 100 ? (
                <Star
                  className="w-10 h-10"
                  style={{ color: "oklch(0.65 0.18 65)" }}
                />
              ) : (
                <CheckCircle2
                  className="w-10 h-10"
                  style={{
                    color: isGreat
                      ? "oklch(0.65 0.18 65)"
                      : "oklch(0.28 0.10 247)",
                  }}
                />
              )}
            </motion.div>
            <div>
              <motion.p
                className="font-display text-3xl font-bold text-foreground mb-1"
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.15 }}
              >
                {message}
              </motion.p>
              <p className="text-muted-foreground">
                You answered {score} of {total} correctly
              </p>
            </div>
            <motion.div
              className="rounded-2xl px-10 py-6 flex flex-col items-center gap-1"
              style={{
                background: isGreat
                  ? "oklch(0.65 0.18 65 / 0.10)"
                  : "oklch(0.28 0.10 247 / 0.08)",
              }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <span
                className="font-display text-5xl font-bold"
                style={{
                  color: isGreat
                    ? "oklch(0.45 0.18 65)"
                    : "oklch(0.28 0.10 247)",
                }}
              >
                {score}/{total}
              </span>
              <span className="text-muted-foreground text-sm">
                {pct}% correct
              </span>
            </motion.div>
            <Button
              size="lg"
              onClick={() => initDeck(filtered)}
              data-ocid="quiz-restart"
              className="rounded-xl px-8"
              style={{
                background: "oklch(0.28 0.10 247)",
                color: "oklch(0.98 0 0)",
              }}
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
          </motion.div>
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <CategorySelector
        categories={availableCategories}
        selected={selectedCategory}
        onChange={setSelectedCategory}
      />

      {/* Score bar */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground">
          Question {index + 1} of {deck.length}
        </span>
        <span
          className="text-sm font-medium tabular-nums rounded-full px-3 py-1"
          style={{
            background: "oklch(0.65 0.18 65 / 0.12)",
            color: "oklch(0.45 0.18 65)",
          }}
          data-ocid="quiz-score"
        >
          Score: {score} / {total}
        </span>
      </div>

      {/* Question card */}
      <div
        className="rounded-2xl p-8 flex flex-col items-center gap-3 shadow-lg"
        style={{ background: "oklch(0.28 0.10 247)", minHeight: "160px" }}
        data-ocid="quiz-question"
      >
        <span
          className="text-xs font-medium uppercase tracking-widest"
          style={{ color: "oklch(0.72 0.2 65)" }}
        >
          Translate this Inpui phrase
        </span>
        <p
          className="font-display text-4xl font-bold text-center leading-tight"
          style={{ color: "oklch(0.98 0 0)" }}
        >
          {current?.inpui}
        </p>
        {current?.category && (
          <Badge
            variant="outline"
            className="text-xs"
            style={{
              borderColor: "oklch(0.72 0.2 65 / 0.5)",
              color: "oklch(0.72 0.2 65)",
            }}
          >
            {current.category}
          </Badge>
        )}
      </div>

      {/* Answer choices — 2×2 grid */}
      <div className="grid grid-cols-2 gap-3" aria-label="Answer choices">
        {choices.map((choice) => {
          const isCorrect = choice === current?.english;
          const isSelected = choice === selected;
          const revealed = answerState !== "idle";

          let extraStyle: React.CSSProperties | undefined;
          let extraClass =
            "bg-card border border-border text-foreground hover:bg-muted";

          if (revealed) {
            if (isCorrect) {
              extraClass = "border-transparent text-white";
              extraStyle = { background: "oklch(0.48 0.18 142)" };
            } else if (isSelected) {
              extraClass = "border-transparent text-white";
              extraStyle = { background: "oklch(0.55 0.22 25)" };
            } else {
              extraClass = "bg-muted border-border text-muted-foreground";
            }
          }

          return (
            <button
              key={choice}
              type="button"
              aria-pressed={isSelected}
              disabled={revealed}
              onClick={() => handleAnswer(choice)}
              data-ocid="quiz-choice"
              className={[
                "flex items-center gap-2 rounded-xl px-4 py-4 text-sm font-medium text-left transition-smooth focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed",
                extraClass,
              ].join(" ")}
              style={extraStyle}
            >
              {revealed && isCorrect && (
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              )}
              {revealed && isSelected && !isCorrect && (
                <XCircle className="w-4 h-4 flex-shrink-0" />
              )}
              <span className="min-w-0 break-words">{choice}</span>
            </button>
          );
        })}
      </div>

      {/* Next button — appears after answer */}
      {answerState !== "idle" && (
        <Button
          onClick={handleNext}
          data-ocid="quiz-next"
          size="lg"
          className="w-full rounded-xl mt-1"
          style={{
            background: "oklch(0.28 0.10 247)",
            color: "oklch(0.98 0 0)",
          }}
        >
          {index + 1 >= deck.length ? "See Results" : "Next Question"}
          <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function FlashcardsPage() {
  const { data: entries = [], isLoading } = useCorpusEntries();
  const [mode, setMode] = useState<Mode>("flashcard");

  return (
    <div
      className="max-w-2xl mx-auto px-4 py-8 flex flex-col gap-6"
      data-ocid="flashcards-page"
    >
      {/* Header */}
      <div>
        <h1 className="font-display text-3xl font-bold text-foreground mb-1">
          Practice
        </h1>
        <p className="text-muted-foreground text-sm">
          Strengthen your Inpui vocabulary with flashcards and quiz challenges.
        </p>
      </div>

      {/* Mode toggle */}
      <ModeToggle mode={mode} onChange={setMode} />

      {/* Content */}
      {isLoading ? (
        <div className="flex flex-col gap-4" data-ocid="flashcards-loading">
          <div className="h-8 bg-muted rounded-full w-full animate-pulse" />
          <div className="h-64 bg-muted rounded-2xl animate-pulse" />
          <div className="flex gap-3">
            <div className="h-11 bg-muted rounded-xl w-11 animate-pulse" />
            <div className="h-11 bg-muted rounded-xl flex-1 animate-pulse" />
            <div className="h-11 bg-muted rounded-xl w-11 animate-pulse" />
          </div>
        </div>
      ) : mode === "flashcard" ? (
        <FlashcardMode entries={entries} />
      ) : (
        <QuizMode entries={entries} />
      )}
    </div>
  );
}
