import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  useAddBulkToQueue,
  useSubmitParallelEntries,
} from "@/hooks/useQueries";
import { parseFile } from "@/lib/file-parser";
import type { FileParseResult, FileParseRow } from "@/types";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  CloudUpload,
  FileText,
  Loader2,
  X,
} from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";

// ─── Shared sub-components ────────────────────────────────────────────────────

interface DropZoneProps {
  id: string;
  label: string;
  accept?: string;
  file: File | null;
  onFile: (file: File) => void;
  onClear: () => void;
  disabled?: boolean;
}

function DropZone({
  id,
  label,
  accept = ".csv,.txt,.xlsx",
  file,
  onFile,
  onClear,
  disabled,
}: DropZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setDragging(false);
      const dropped = e.dataTransfer.files[0];
      if (dropped) onFile(dropped);
    },
    [onFile],
  );

  const dropZoneClass = [
    "relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 text-center transition-smooth w-full",
    dragging ? "border-primary bg-primary/5" : "border-border bg-muted/30",
    disabled ? "opacity-50 pointer-events-none" : "",
  ].join(" ");

  return (
    <div
      className={dropZoneClass}
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      data-ocid={`dropzone-${id}`}
    >
      <input
        ref={inputRef}
        id={`file-input-${id}`}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) {
            onFile(f);
            e.target.value = "";
          }
        }}
      />

      {file ? (
        <div className="flex flex-col items-center gap-2 w-full">
          <FileText className="h-8 w-8 text-primary" />
          <span className="text-sm font-medium text-foreground truncate max-w-full px-2">
            {file.name}
          </span>
          <span className="text-xs text-muted-foreground">
            {(file.size / 1024).toFixed(1)} KB
          </span>
          <button
            type="button"
            className="mt-2 flex items-center gap-1 text-xs text-destructive hover:text-destructive/80 transition-colors"
            onClick={onClear}
            aria-label="Remove file"
          >
            <X className="h-3 w-3" /> Remove
          </button>
        </div>
      ) : (
        <>
          <CloudUpload className="h-10 w-10 text-muted-foreground mb-3" />
          <label
            htmlFor={`file-input-${id}`}
            className="text-sm font-medium text-foreground cursor-pointer hover:text-primary transition-colors"
          >
            {label}
          </label>
          <p className="text-xs text-muted-foreground mt-1">
            Drag &amp; drop or click to browse
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Accepts CSV, TXT, XLSX
          </p>
        </>
      )}
    </div>
  );
}

// ─── Preview table ────────────────────────────────────────────────────────────

interface PreviewTableProps {
  rows: FileParseRow[];
  maxRows?: number;
}

function PreviewTable({ rows, maxRows = 10 }: PreviewTableProps) {
  const displayed = rows.slice(0, maxRows);

  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <div className="overflow-y-auto max-h-64">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-card border-b border-border">
            <tr>
              <th className="text-left py-2 px-3 text-xs font-semibold text-muted-foreground w-8">
                #
              </th>
              <th className="text-left py-2 px-3 text-xs font-semibold text-muted-foreground">
                Inpui
              </th>
              <th className="text-left py-2 px-3 text-xs font-semibold text-muted-foreground">
                English
              </th>
            </tr>
          </thead>
          <tbody>
            {displayed.map((row, i) => (
              <tr
                key={`${row.inpui}-${i}`}
                className={i % 2 === 0 ? "bg-background" : "bg-muted/20"}
              >
                <td className="py-1.5 px-3 text-xs text-muted-foreground">
                  {i + 1}
                </td>
                <td className="py-1.5 px-3 text-foreground font-medium">
                  {row.inpui}
                </td>
                <td className="py-1.5 px-3 text-muted-foreground">
                  {row.english || (
                    <span className="italic text-muted-foreground/50">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {rows.length > maxRows && (
        <div className="px-3 py-2 bg-muted/30 border-t border-border text-xs text-muted-foreground">
          Showing {maxRows} of {rows.length} entries
        </div>
      )}
    </div>
  );
}

// ─── Error list ───────────────────────────────────────────────────────────────

function ErrorList({ errors }: { errors: string[] }) {
  const [expanded, setExpanded] = useState(false);

  if (errors.length === 0) return null;

  return (
    <div className="rounded-lg border border-amber-400/40 bg-amber-50/60 dark:bg-amber-950/20 overflow-hidden">
      <button
        type="button"
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-amber-100/40 dark:hover:bg-amber-900/20 transition-colors"
        onClick={() => setExpanded((v) => !v)}
        data-ocid="error-list-toggle"
        aria-expanded={expanded}
      >
        <span className="flex items-center gap-2 text-sm font-medium text-amber-700 dark:text-amber-400">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {errors.length} {errors.length === 1 ? "issue" : "issues"} found
        </span>
        {expanded ? (
          <ChevronDown className="h-4 w-4 text-amber-600" />
        ) : (
          <ChevronRight className="h-4 w-4 text-amber-600" />
        )}
      </button>
      {expanded && (
        <ul className="px-4 pb-3 space-y-1 max-h-40 overflow-y-auto">
          {errors.map((err, i) => (
            <li
              key={`err-${i}-${err.slice(0, 20)}`}
              className="text-xs text-amber-700 dark:text-amber-400 flex gap-2"
            >
              <span className="shrink-0">•</span>
              <span>{err}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ─── ParseSummary ─────────────────────────────────────────────────────────────

function ParseSummary({ result }: { result: FileParseResult }) {
  return (
    <div className="flex items-center gap-3 flex-wrap">
      <Badge className="bg-secondary/20 text-secondary-foreground border-secondary/30 gap-1.5">
        <CheckCircle2 className="h-3.5 w-3.5" />
        {result.valid.length} valid{" "}
        {result.valid.length === 1 ? "entry" : "entries"}
      </Badge>
      {result.errors.length > 0 && (
        <Badge
          variant="outline"
          className="text-amber-700 border-amber-400/50 gap-1.5"
        >
          <AlertTriangle className="h-3.5 w-3.5" />
          {result.errors.length}{" "}
          {result.errors.length === 1 ? "error" : "errors"}
        </Badge>
      )}
    </div>
  );
}

// ─── Tab: Bulk Upload ─────────────────────────────────────────────────────────

function BulkUploadTab() {
  const [file, setFile] = useState<File | null>(null);
  const [parseResult, setParseResult] = useState<FileParseResult | null>(null);
  const [parsing, setParsing] = useState(false);
  const addBulk = useAddBulkToQueue();

  const handleFile = useCallback(async (f: File) => {
    setFile(f);
    setParsing(true);
    setParseResult(null);
    try {
      const result = await parseFile(f);
      setParseResult(result);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to parse file.";
      setParseResult({ valid: [], errors: [msg] });
    } finally {
      setParsing(false);
    }
  }, []);

  const handleClear = () => {
    setFile(null);
    setParseResult(null);
  };

  const handleSubmit = async () => {
    if (!parseResult || parseResult.valid.length === 0) return;
    try {
      await addBulk.mutateAsync(parseResult.valid);
      toast.success(
        `${parseResult.valid.length} entries added to the Translation Queue!`,
      );
      handleClear();
    } catch {
      toast.error("Failed to add entries. Please try again.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="font-display text-xl font-bold text-foreground">
          Bulk Upload
        </h2>
        <p className="text-muted-foreground text-sm">
          Upload a CSV, TXT, or XLSX file to add multiple phrases to the
          Translation Queue at once.
        </p>
      </div>

      <DropZone
        id="bulk"
        label="Drag & drop your file here"
        file={file}
        onFile={handleFile}
        onClear={handleClear}
        disabled={parsing}
      />

      {parsing && (
        <div className="flex items-center justify-center gap-2 py-4 text-muted-foreground text-sm">
          <Loader2 className="h-4 w-4 animate-spin" />
          Parsing file…
        </div>
      )}

      {parseResult && (
        <div className="space-y-4" data-ocid="bulk-parse-result">
          <ParseSummary result={parseResult} />
          {parseResult.errors.length > 0 && (
            <ErrorList errors={parseResult.errors} />
          )}
          {parseResult.valid.length > 0 && (
            <>
              <h3 className="text-sm font-semibold text-foreground">
                Preview (first 10 rows)
              </h3>
              <PreviewTable rows={parseResult.valid} />
              <Button
                className="w-full sm:w-auto"
                onClick={handleSubmit}
                disabled={addBulk.isPending}
                data-ocid="bulk-submit-btn"
              >
                {addBulk.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Adding…
                  </>
                ) : (
                  `Add ${parseResult.valid.length} ${parseResult.valid.length === 1 ? "entry" : "entries"} to Translation Queue`
                )}
              </Button>
            </>
          )}
          {parseResult.valid.length === 0 &&
            parseResult.errors.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No valid entries found in this file.
              </p>
            )}
        </div>
      )}
    </div>
  );
}

// ─── Tab: Parallel Upload ─────────────────────────────────────────────────────

function ParallelUploadTab() {
  const [inpuiFile, setInpuiFile] = useState<File | null>(null);
  const [englishFile, setEnglishFile] = useState<File | null>(null);
  const [inpuiRows, setInpuiRows] = useState<FileParseRow[] | null>(null);
  const [englishRows, setEnglishRows] = useState<FileParseRow[] | null>(null);
  const [parsing, setParsing] = useState(false);
  const [alignedRows, setAlignedRows] = useState<FileParseRow[] | null>(null);
  const submitParallel = useSubmitParallelEntries();

  const processFiles = useCallback(
    async (iFile: File | null, eFile: File | null) => {
      if (!iFile || !eFile) return;
      setParsing(true);
      setAlignedRows(null);
      try {
        const [iResult, eResult] = await Promise.all([
          parseFile(iFile),
          parseFile(eFile),
        ]);
        setInpuiRows(iResult.valid);
        setEnglishRows(eResult.valid);

        const minLen = Math.min(iResult.valid.length, eResult.valid.length);
        const aligned: FileParseRow[] = [];
        for (let i = 0; i < minLen; i++) {
          aligned.push({
            inpui: iResult.valid[i].inpui,
            english: eResult.valid[i].english || eResult.valid[i].inpui,
          });
        }
        setAlignedRows(aligned);
      } finally {
        setParsing(false);
      }
    },
    [],
  );

  const handleInpuiFile = (f: File) => {
    setInpuiFile(f);
    processFiles(f, englishFile);
  };

  const handleEnglishFile = (f: File) => {
    setEnglishFile(f);
    processFiles(inpuiFile, f);
  };

  const handleClearInpui = () => {
    setInpuiFile(null);
    setInpuiRows(null);
    setAlignedRows(null);
  };

  const handleClearEnglish = () => {
    setEnglishFile(null);
    setEnglishRows(null);
    setAlignedRows(null);
  };

  const handleSubmit = async () => {
    if (!alignedRows || alignedRows.length === 0) return;
    try {
      await submitParallel.mutateAsync(alignedRows);
      toast.success(
        `Submitted ${alignedRows.length} entries for admin approval!`,
      );
      setInpuiFile(null);
      setEnglishFile(null);
      setInpuiRows(null);
      setEnglishRows(null);
      setAlignedRows(null);
    } catch {
      toast.error("Submission failed. Please try again.");
    }
  };

  const inpuiCount = inpuiRows?.length ?? 0;
  const englishCount = englishRows?.length ?? 0;
  const countMismatch =
    inpuiRows !== null && englishRows !== null && inpuiCount !== englishCount;

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="font-display text-xl font-bold text-foreground">
          Parallel Upload
        </h2>
        <p className="text-muted-foreground text-sm">
          Upload one Inpui file and one English file. Lines will be
          automatically aligned by position. Entries are submitted for admin
          review before going public.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <p className="text-sm font-semibold text-foreground flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-primary" />
            Inpui File
          </p>
          <DropZone
            id="parallel-inpui"
            label="Upload Inpui phrases"
            file={inpuiFile}
            onFile={handleInpuiFile}
            onClear={handleClearInpui}
            disabled={parsing}
          />
          {inpuiRows !== null && (
            <p className="text-xs text-muted-foreground">
              {inpuiCount} lines detected
            </p>
          )}
        </div>

        <div className="space-y-2">
          <p className="text-sm font-semibold text-foreground flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-accent" />
            English File
          </p>
          <DropZone
            id="parallel-english"
            label="Upload English translations"
            file={englishFile}
            onFile={handleEnglishFile}
            onClear={handleClearEnglish}
            disabled={parsing}
          />
          {englishRows !== null && (
            <p className="text-xs text-muted-foreground">
              {englishCount} lines detected
            </p>
          )}
        </div>
      </div>

      {parsing && (
        <div className="flex items-center justify-center gap-2 py-4 text-muted-foreground text-sm">
          <Loader2 className="h-4 w-4 animate-spin" />
          Aligning files…
        </div>
      )}

      {countMismatch && (
        <div
          className="flex items-start gap-3 rounded-lg border border-amber-400/40 bg-amber-50/60 dark:bg-amber-950/20 px-4 py-3"
          data-ocid="parallel-mismatch-warning"
        >
          <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
          <p className="text-sm text-amber-700 dark:text-amber-400">
            Files have different line counts ({inpuiCount} vs {englishCount}) —
            extra lines will be ignored. Only{" "}
            {Math.min(inpuiCount, englishCount)} pairs will be submitted.
          </p>
        </div>
      )}

      {alignedRows && alignedRows.length > 0 && (
        <div className="space-y-4" data-ocid="parallel-preview">
          <div className="flex items-center gap-3">
            <Badge className="bg-secondary/20 text-secondary-foreground border-secondary/30 gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5" />
              {alignedRows.length} aligned{" "}
              {alignedRows.length === 1 ? "pair" : "pairs"}
            </Badge>
          </div>
          <h3 className="text-sm font-semibold text-foreground">
            Preview (first 10 pairs)
          </h3>
          <PreviewTable rows={alignedRows} />
          <Button
            className="w-full sm:w-auto"
            onClick={handleSubmit}
            disabled={submitParallel.isPending}
            data-ocid="parallel-submit-btn"
          >
            {submitParallel.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Submitting…
              </>
            ) : (
              `Submit ${alignedRows.length} entries for Admin Approval`
            )}
          </Button>
        </div>
      )}

      {!inpuiFile && !englishFile && (
        <div
          className="rounded-lg bg-muted/30 border border-border px-4 py-5 text-sm text-muted-foreground"
          data-ocid="parallel-empty"
        >
          <p className="font-medium text-foreground mb-1">How it works</p>
          <ol className="list-decimal list-inside space-y-1">
            <li>Upload an Inpui file (one phrase per line)</li>
            <li>
              Upload an English file (one translation per line, same order)
            </li>
            <li>
              Lines are matched by position — line 1 Inpui pairs with line 1
              English
            </li>
            <li>
              Pairs are submitted to admins for review before appearing in the
              corpus
            </li>
          </ol>
        </div>
      )}
    </div>
  );
}

// ─── UploadPage ───────────────────────────────────────────────────────────────

type UploadTab = "bulk" | "parallel";

export default function UploadPage() {
  const [activeTab, setActiveTab] = useState<UploadTab>("bulk");

  const tabs: { id: UploadTab; label: string }[] = [
    { id: "bulk", label: "Bulk Upload" },
    { id: "parallel", label: "Parallel Upload" },
  ];

  return (
    <div className="container max-w-screen-md mx-auto px-4 py-8 space-y-6">
      {/* Page header */}
      <div>
        <h1 className="font-display text-3xl font-bold text-foreground mb-1">
          Upload
        </h1>
        <p className="text-muted-foreground">
          Add vocabulary to the corpus in bulk or align parallel Inpui–English
          files.
        </p>
      </div>

      {/* Tab switcher */}
      <div
        className="flex gap-2 p-1 rounded-full bg-muted/40 border border-border w-fit"
        role="tablist"
        data-ocid="upload-tabs"
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={activeTab === tab.id}
            type="button"
            className={[
              "px-5 py-2 rounded-full text-sm font-medium transition-smooth focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              activeTab === tab.id
                ? "bg-card text-foreground shadow-sm border-b-2 border-accent"
                : "text-muted-foreground hover:text-foreground",
            ].join(" ")}
            onClick={() => setActiveTab(tab.id)}
            data-ocid={`upload-tab-${tab.id}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="card-elevated p-6">
        {activeTab === "bulk" ? <BulkUploadTab /> : <ParallelUploadTab />}
      </div>
    </div>
  );
}
