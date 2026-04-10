import { cn } from "@/lib/utils";
import { Mic, Square } from "lucide-react";

interface MicButtonProps {
  isRecording?: boolean;
  onClick: () => void;
  disabled?: boolean;
  size?: "sm" | "md" | "lg";
  label?: string;
  className?: string;
  "aria-label"?: string;
}

const sizeMap: Record<string, string> = {
  sm: "h-10 w-10",
  md: "h-14 w-14",
  lg: "h-[72px] w-[72px]",
};

const iconSizeMap: Record<string, number> = {
  sm: 16,
  md: 22,
  lg: 30,
};

const labelSizeMap: Record<string, string> = {
  sm: "text-[10px]",
  md: "text-xs",
  lg: "text-xs",
};

export function MicButton({
  isRecording = false,
  onClick,
  disabled = false,
  size = "md",
  label,
  className,
  "aria-label": ariaLabel,
}: MicButtonProps) {
  const defaultLabel = isRecording ? "Recording..." : "Tap to Record";
  const displayLabel = label ?? defaultLabel;

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        aria-label={
          ariaLabel ?? (isRecording ? "Stop recording" : "Start recording")
        }
        data-ocid="mic-button"
        className={cn(
          "relative flex items-center justify-center rounded-full",
          "transition-smooth focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          // Green background using secondary token (mapped to green in the design)
          "text-secondary-foreground shadow-md",
          sizeMap[size],
          // Recording pulse animation
          isRecording ? "pulse-micro" : "hover:brightness-110 active:scale-95",
          className,
        )}
        style={{
          backgroundColor: isRecording
            ? "oklch(0.50 0.18 145)"
            : "oklch(0.55 0.20 145)",
        }}
      >
        {isRecording ? (
          <Square
            size={iconSizeMap[size]}
            fill="currentColor"
            aria-hidden="true"
          />
        ) : (
          <Mic size={iconSizeMap[size]} aria-hidden="true" />
        )}
        {/* Outer ripple ring when recording */}
        {isRecording && (
          <span
            className="absolute inset-0 rounded-full animate-ping opacity-30"
            style={{ backgroundColor: "oklch(0.55 0.20 145)" }}
            aria-hidden="true"
          />
        )}
      </button>
      <span
        className={cn(
          "font-medium tracking-wide",
          labelSizeMap[size],
          isRecording ? "text-foreground" : "text-muted-foreground",
        )}
        style={isRecording ? { color: "oklch(0.50 0.18 145)" } : undefined}
      >
        {displayLabel}
      </span>
    </div>
  );
}
