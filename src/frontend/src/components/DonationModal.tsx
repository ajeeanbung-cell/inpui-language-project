import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAdminSettings } from "@/hooks/useQueries";
import { Copy, Heart, QrCode, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface DonationModalProps {
  open: boolean;
  onClose: () => void;
}

export function DonationModal({ open, onClose }: DonationModalProps) {
  const { data: settings, isLoading } = useAdminSettings();
  const [copied, setCopied] = useState(false);
  const backdropRef = useRef<HTMLDivElement>(null);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  // Prevent background scroll
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  const upiId = settings?.upiId ?? "";
  const qrData = settings?.upiQrCode ?? null;
  const hasUpi = upiId.trim().length > 0;
  const hasQr =
    qrData !== null &&
    (qrData.startsWith("http") || qrData.startsWith("data:image"));

  async function handleCopy() {
    if (!upiId) return;
    try {
      await navigator.clipboard.writeText(upiId);
    } catch {
      const el = document.createElement("textarea");
      el.value = upiId;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  return (
    <div
      ref={backdropRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{
        backgroundColor: "oklch(0.1 0 0 / 0.55)",
        backdropFilter: "blur(4px)",
      }}
      onClick={(e) => {
        if (e.target === backdropRef.current) onClose();
      }}
      onKeyDown={(e) => {
        if (e.key === "Escape") onClose();
      }}
      data-ocid="donation-modal-backdrop"
    >
      <dialog
        open
        className="relative w-full max-w-md bg-card border border-border rounded-2xl shadow-xl overflow-hidden m-0 p-0"
        aria-label="Donation information"
        data-ocid="donation-modal"
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4 border-b border-border"
          style={{ background: "oklch(0.28 0.10 247)" }}
        >
          <div className="flex items-center gap-2">
            <Heart
              className="h-5 w-5"
              style={{ color: "oklch(0.82 0.18 65)" }}
            />
            <h2
              className="font-display text-lg font-bold"
              style={{ color: "oklch(0.98 0 0)" }}
            >
              Support the Inpui Project
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1.5 transition-smooth hover:bg-white/10"
            aria-label="Close donation modal"
            data-ocid="donation-modal-close"
          >
            <X className="h-4 w-4" style={{ color: "oklch(0.98 0 0)" }} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-6 space-y-6">
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-40 w-40 mx-auto rounded-lg" />
            </div>
          ) : !hasUpi ? (
            <div
              className="flex flex-col items-center gap-3 py-8 text-center"
              data-ocid="donation-unconfigured"
            >
              <QrCode className="h-10 w-10 text-muted-foreground" />
              <p className="text-foreground font-semibold">
                Donation info not configured yet
              </p>
              <p className="text-muted-foreground text-sm">
                An admin can set up UPI details in the Admin Panel.
              </p>
            </div>
          ) : (
            <>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Your support helps us preserve the Inpui tribal language for
                future generations. Every contribution matters — thank you!
              </p>

              {/* UPI ID row */}
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  UPI ID
                </p>
                <div className="flex items-center gap-2">
                  <div
                    className="flex-1 rounded-lg border border-border bg-muted/40 px-4 py-2.5 font-mono text-sm text-foreground truncate select-all"
                    data-ocid="upi-id-display"
                  >
                    {upiId}
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleCopy}
                    className="shrink-0 gap-1.5 border-border transition-smooth"
                    data-ocid="copy-upi-btn"
                  >
                    <Copy className="h-3.5 w-3.5 icon-gold" />
                    {copied ? "Copied!" : "Copy"}
                  </Button>
                </div>
              </div>

              {/* QR Code */}
              {hasQr && (
                <div
                  className="flex flex-col items-center gap-3"
                  data-ocid="donation-qr"
                >
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Scan to Pay
                  </p>
                  <div className="rounded-xl border border-border bg-muted/30 p-3">
                    <img
                      src={qrData!}
                      alt="UPI QR Code for donation"
                      className="h-48 w-48 object-contain rounded-md"
                    />
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border bg-muted/20 flex justify-end">
          <Button
            variant="outline"
            onClick={onClose}
            className="border-border"
            data-ocid="donation-modal-cancel"
          >
            Close
          </Button>
        </div>
      </dialog>
    </div>
  );
}
