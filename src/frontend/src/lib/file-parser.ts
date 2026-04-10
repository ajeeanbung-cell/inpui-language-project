import type { FileParseResult, FileParseRow } from "../types";

// ─── Utilities ────────────────────────────────────────────────────────────────

/** Strip UTF-8 BOM if present */
function stripBOM(text: string): string {
  return text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
}

/** Normalize line endings to LF */
function normalizeLineEndings(text: string): string {
  return text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
}

// ─── CSV Parser ───────────────────────────────────────────────────────────────

/**
 * Parse a single CSV line per RFC 4180:
 * - quoted fields preserve commas, newlines, and special chars
 * - doubled quotes ("") inside quoted fields become a single quote
 * - supports tab as an alternative delimiter if no comma is present
 */
function parseCSVLine(line: string): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;
  let i = 0;

  // Determine delimiter: tab if no commas, otherwise comma
  const delimiter = line.includes(",") ? "," : "\t";

  while (i < line.length) {
    const ch = line[i];

    if (inQuotes) {
      if (ch === '"') {
        // Escaped quote (doubled) or end of quoted field
        if (i + 1 < line.length && line[i + 1] === '"') {
          current += '"';
          i += 2;
        } else {
          inQuotes = false;
          i++;
        }
      } else {
        current += ch;
        i++;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
        i++;
      } else if (ch === delimiter) {
        fields.push(current.trim());
        current = "";
        i++;
      } else {
        current += ch;
        i++;
      }
    }
  }

  fields.push(current.trim());
  return fields;
}

/**
 * Detect if a row is a header row by checking common header keywords.
 */
function isHeaderRow(fields: string[]): boolean {
  const first = (fields[0] ?? "").toLowerCase().trim();
  const second = (fields[1] ?? "").toLowerCase().trim();
  const headerKeywords = [
    "inpui",
    "english",
    "source",
    "translation",
    "word",
    "phrase",
    "lang",
  ];
  return headerKeywords.includes(first) || headerKeywords.includes(second);
}

/**
 * Parse CSV text — handles BOM, CRLF/LF, quoted fields with escaped quotes,
 * Unicode/diacriticals, empty rows, header detection, two-column and single-column modes.
 */
export function parseCSV(text: string): FileParseRow[] {
  const clean = normalizeLineEndings(stripBOM(text));
  const lines = clean.split("\n");
  const rows: FileParseRow[] = [];
  let headerSkipped = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;

    const fields = parseCSVLine(line);

    // Skip header row (only check first non-empty row)
    if (!headerSkipped && isHeaderRow(fields)) {
      headerSkipped = true;
      continue;
    }
    headerSkipped = true;

    if (fields.length === 0) continue;

    const inpui = (fields[0] ?? "").trim();
    const english = (fields[1] ?? "").trim();

    // Only push if at least inpui text is present
    if (inpui) {
      rows.push({ inpui, english });
    }
  }

  return rows;
}

// ─── TXT Parser ───────────────────────────────────────────────────────────────

/**
 * Parse plain text — split on tab first, then pipe (|), then comma.
 * Each line is one entry. Single-column lines get empty english.
 */
export function parseTXT(text: string): FileParseRow[] {
  const clean = normalizeLineEndings(stripBOM(text));
  const lines = clean.split("\n");
  const rows: FileParseRow[] = [];

  for (const line of lines) {
    if (!line.trim()) continue;

    let parts: string[];
    if (line.includes("\t")) {
      parts = line.split("\t");
    } else if (line.includes("|")) {
      parts = line.split("|");
    } else if (line.includes(",")) {
      parts = parseCSVLine(line);
    } else {
      // Single-column entry — whole line is Inpui
      parts = [line];
    }

    const inpui = (parts[0] ?? "").trim();
    const english = (parts[1] ?? "").trim();

    if (inpui) {
      rows.push({ inpui, english });
    }
  }

  return rows;
}

// ─── XLSX Parser ──────────────────────────────────────────────────────────────

const XLSX_PK_HEADER = [0x50, 0x4b, 0x03, 0x04]; // PK\x03\x04

/**
 * XLSX detection + friendly error.
 *
 * Binary XLSX files start with a ZIP PK header. If we detect that, we return a
 * friendly error asking the user to export as CSV instead of silently producing
 * garbled output. Non-ZIP files are attempted as CSV text (edge case: .xlsx
 * saved as plain XML or CSV with wrong extension).
 */
export function parseXLSX(buffer: ArrayBuffer): FileParseRow[] {
  const bytes = new Uint8Array(buffer.slice(0, 4));
  const isZip = XLSX_PK_HEADER.every((b, i) => bytes[i] === b);

  if (isZip) {
    // Throw so parseFile can catch and surface a friendly message
    throw new Error(
      "XLSX parsing requires the app to be rebuilt with XLSX support. " +
        "Please export your file as CSV and upload that instead.",
    );
  }

  // Non-zip: try treating as UTF-8 text and parse as CSV
  const decoder = new TextDecoder("utf-8");
  const text = decoder.decode(buffer);
  return parseCSV(text);
}

// ─── Validation ───────────────────────────────────────────────────────────────

const MAX_LEN = 500;

/**
 * Validate parsed rows:
 * - Filter rows where both fields are blank
 * - Trim whitespace
 * - Check max lengths
 */
export function validateRows(rows: FileParseRow[]): FileParseResult {
  const valid: FileParseRow[] = [];
  const errors: string[] = [];

  for (let i = 0; i < rows.length; i++) {
    const inpui = rows[i].inpui.trim();
    const english = rows[i].english.trim();
    const rowNum = i + 1;

    if (!inpui && !english) {
      errors.push(`Row ${rowNum}: Both fields are empty — skipped.`);
      continue;
    }
    if (!inpui) {
      errors.push(`Row ${rowNum}: Missing Inpui text — skipped.`);
      continue;
    }
    if (inpui.length > MAX_LEN) {
      errors.push(
        `Row ${rowNum}: Inpui text too long (${inpui.length} chars, max ${MAX_LEN}) — skipped.`,
      );
      continue;
    }
    if (english.length > MAX_LEN) {
      errors.push(
        `Row ${rowNum}: English text too long (${english.length} chars, max ${MAX_LEN}) — skipped.`,
      );
      continue;
    }

    valid.push({ inpui, english });
  }

  return { valid, errors };
}

// ─── Main Entry Point ─────────────────────────────────────────────────────────

/**
 * Parse a File by extension, returning validated rows and any errors.
 * Handles CSV, TXT, XLSX (with friendly fallback).
 */
export async function parseFile(file: File): Promise<FileParseResult> {
  const name = file.name.toLowerCase();

  try {
    if (name.endsWith(".csv")) {
      const text = await file.text();
      return validateRows(parseCSV(text));
    }

    if (name.endsWith(".txt")) {
      const text = await file.text();
      return validateRows(parseTXT(text));
    }

    if (name.endsWith(".xlsx") || name.endsWith(".xls")) {
      const buffer = await file.arrayBuffer();
      // parseXLSX throws a friendly error for real binary XLSX
      const rows = parseXLSX(buffer);
      return validateRows(rows);
    }

    return {
      valid: [],
      errors: [
        `Unsupported file type: "${file.name}". Please upload a .csv, .txt, or .xlsx file.`,
      ],
    };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Unknown parsing error.";
    return { valid: [], errors: [message] };
  }
}
