import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";

const TOUR_COMPLETE_KEY = "inpui_tour_complete";

export function markTourComplete() {
  localStorage.setItem(TOUR_COMPLETE_KEY, "true");
}

export function shouldAutoShowTour() {
  return !localStorage.getItem(TOUR_COMPLETE_KEY);
}

// ─── Decorative wave SVG for step 1 ──────────────────────────────────────────

function WaveDecoration() {
  return (
    <div
      className="w-full h-28 rounded-xl overflow-hidden flex items-center justify-center relative"
      style={{ backgroundColor: "oklch(0.28 0.10 247)" }}
      role="img"
      aria-label="Decorative wave pattern representing the Inpui language"
    >
      {/* Layered wave paths */}
      <svg
        viewBox="0 0 400 100"
        className="absolute inset-0 w-full h-full"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <title>Decorative waves</title>
        <path
          d="M0 60 C100 20 200 80 300 40 S400 60 400 60 L400 100 L0 100 Z"
          fill="oklch(0.65 0.18 65 / 0.25)"
        />
        <path
          d="M0 70 C80 40 160 90 240 55 S360 70 400 65 L400 100 L0 100 Z"
          fill="oklch(0.65 0.18 65 / 0.15)"
        />
      </svg>
      {/* Central emblem */}
      <div
        className="relative z-10 w-16 h-16 rounded-full flex items-center justify-center text-2xl font-display font-bold shadow-lg border-2"
        style={{
          backgroundColor: "oklch(0.65 0.18 65)",
          color: "oklch(0.28 0.10 247)",
          borderColor: "oklch(0.65 0.18 65 / 0.6)",
        }}
      >
        IP
      </div>
    </div>
  );
}

// ─── Tour step icon badges ─────────────────────────────────────────────────

function StepIcon({ emoji }: { emoji: string }) {
  return (
    <div
      className="w-14 h-14 rounded-full text-2xl flex items-center justify-center shadow-sm border"
      style={{
        backgroundColor: "oklch(0.28 0.10 247 / 0.08)",
        borderColor: "oklch(0.28 0.10 247 / 0.15)",
      }}
      aria-hidden="true"
    >
      {emoji}
    </div>
  );
}

// ─── Step definitions ─────────────────────────────────────────────────────

interface TourStep {
  title: string;
  content: string;
  visual: React.ReactNode;
  cta?: string;
}

const STEPS: TourStep[] = [
  {
    title: "Welcome to the Inpui Language Project",
    content:
      "The Inpui language is a tribal language spoken by the Inpui people of Manipur, India. This platform helps preserve and document the language for future generations.",
    visual: <WaveDecoration />,
  },
  {
    title: "Explore Our Language Corpus",
    content:
      "Browse hundreds of Inpui words and phrases with English translations. Search by keyword or filter by category like Greetings, Food, or Verbs.",
    visual: <StepIcon emoji="📖" />,
  },
  {
    title: "Contribute Voice Recordings",
    content:
      "Use the Voice tab to record Inpui and English phrases. Your recordings help others hear the authentic pronunciation of the language.",
    visual: <StepIcon emoji="🎙️" />,
  },
  {
    title: "Add to the Translation Queue",
    content:
      "Have phrases that need translation? Add them to the queue via manual entry or upload a CSV file. Community members will help translate them.",
    visual: <StepIcon emoji="⚡" />,
  },
  {
    title: "You're Ready!",
    content:
      "Start exploring the corpus, recording contributions, or browsing our flashcards. Together, we preserve the Inpui language.",
    visual: <StepIcon emoji="🎉" />,
    cta: "Start Exploring",
  },
];

// ─── Props ────────────────────────────────────────────────────────────────────

interface OnboardingTourProps {
  isOpen: boolean;
  onClose: () => void;
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function OnboardingTour({
  isOpen,
  onClose,
}: OnboardingTourProps) {
  const [step, setStep] = useState(0);
  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  function handleClose() {
    markTourComplete();
    setStep(0);
    onClose();
  }

  function handleNext() {
    if (isLast) {
      handleClose();
    } else {
      setStep((s) => s + 1);
    }
  }

  function handleBack() {
    setStep((s) => Math.max(0, s - 1));
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="tour-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[200] bg-foreground/40 backdrop-blur-sm"
            onClick={handleClose}
            onKeyDown={(e) => {
              if (e.key === "Escape") handleClose();
            }}
            role="presentation"
            aria-hidden="true"
          />

          {/* Modal wrapper (positions the dialog) */}
          <div className="fixed inset-0 z-[201] flex items-center justify-center p-4 pointer-events-none">
            <motion.dialog
              key="tour-modal"
              aria-label={`Onboarding tour: ${current.title}`}
              open={isOpen}
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
              className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-md pointer-events-auto overflow-hidden p-0 m-0"
              style={{ position: "relative" }}
            >
              {/* Modal header */}
              <div className="flex items-center justify-between px-5 pt-5 pb-0">
                <span className="text-xs font-medium text-muted-foreground tracking-wider uppercase">
                  Step {step + 1} of {STEPS.length}
                </span>
                <button
                  type="button"
                  onClick={handleClose}
                  className="h-7 w-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-smooth focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  aria-label="Skip tour"
                  data-ocid="tour-skip-btn"
                >
                  <X size={15} />
                </button>
              </div>

              {/* Step content */}
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={step}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2, ease: "easeInOut" }}
                  className="px-5 pt-5 pb-4"
                >
                  {/* Visual area */}
                  <div className="mb-5 flex justify-center">
                    {current.visual}
                  </div>

                  {/* Title */}
                  <h2 className="font-display text-xl font-bold text-foreground mb-2 leading-snug">
                    {current.title}
                  </h2>

                  {/* Content */}
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {current.content}
                  </p>
                </motion.div>
              </AnimatePresence>

              {/* Progress dots */}
              <div className="flex items-center justify-center gap-1.5 py-3">
                {STEPS.map((s, i) => (
                  <button
                    key={s.title}
                    type="button"
                    onClick={() => setStep(i)}
                    aria-label={`Go to step ${i + 1}`}
                    data-ocid={`tour-dot-${i + 1}`}
                    className={cn(
                      "rounded-full transition-smooth focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      i === step
                        ? "w-5 h-2"
                        : "w-2 h-2 hover:bg-muted-foreground/50",
                    )}
                    style={{
                      backgroundColor:
                        i === step
                          ? "oklch(0.65 0.18 65)"
                          : "oklch(0.80 0.01 0)",
                    }}
                  />
                ))}
              </div>

              {/* Footer actions */}
              <div className="flex items-center justify-between gap-3 px-5 pb-5">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleBack}
                  disabled={step === 0}
                  className="gap-1.5 font-normal"
                  data-ocid="tour-back-btn"
                >
                  <ChevronLeft size={15} />
                  Back
                </Button>

                <Button
                  size="sm"
                  onClick={handleNext}
                  className="gap-1.5 font-normal px-5"
                  style={{
                    backgroundColor: "oklch(0.65 0.18 65)",
                    color: "oklch(0.28 0.10 247)",
                  }}
                  data-ocid="tour-next-btn"
                >
                  {isLast ? (current.cta ?? "Start Exploring") : "Next"}
                  {!isLast && <ChevronRight size={15} />}
                </Button>
              </div>
            </motion.dialog>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
