import { CorpusCard } from "@/components/ui/CorpusCard";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useCorpusEntries,
  useFavorites,
  useToggleFavorite,
} from "@/hooks/useQueries";
import type { CorpusEntry } from "@/types";
import { BookOpen, Search, Star } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

// ─── Category configuration ───────────────────────────────────────────────────

const CATEGORIES = [
  "All",
  "Greetings",
  "Food",
  "Verbs",
  "Travel",
  "Numbers",
  "Family",
  "Expressions",
  "Common Words",
  "Other",
];

const TAB_VIEWS = ["Browse", "Favorites"] as const;
type TabView = (typeof TAB_VIEWS)[number];

// ─── Sub-components ───────────────────────────────────────────────────────────

function LoadingSkeleton() {
  return (
    <div className="divide-y divide-border/40">
      {["s1", "s2", "s3", "s4", "s5", "s6"].map((sk) => (
        <div key={sk} className="flex items-start gap-3 px-4 py-3">
          <div className="flex-1 min-w-0 space-y-2">
            <div className="flex gap-2">
              <Skeleton className="h-4 w-28 rounded" />
              <Skeleton className="h-4 w-40 rounded" />
            </div>
            <div className="flex gap-1">
              <Skeleton className="h-4 w-16 rounded-full" />
              <Skeleton className="h-4 w-12 rounded-full" />
            </div>
          </div>
          <div className="flex gap-1 pt-0.5">
            <Skeleton className="h-7 w-7 rounded" />
            <Skeleton className="h-7 w-7 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState({ view, query }: { view: TabView; query: string }) {
  return (
    <div
      className="flex flex-col items-center justify-center py-16 px-4 text-center"
      data-ocid="corpus-empty-state"
    >
      <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mb-4">
        {view === "Favorites" ? (
          <Star size={24} className="text-accent" />
        ) : (
          <BookOpen size={24} className="text-muted-foreground" />
        )}
      </div>
      {view === "Favorites" ? (
        <>
          <p className="font-display text-lg font-semibold text-foreground">
            No favorites yet
          </p>
          <p className="text-sm text-muted-foreground mt-1 max-w-xs">
            Star entries in the Browse tab to save them here for quick access.
          </p>
        </>
      ) : query ? (
        <>
          <p className="font-display text-lg font-semibold text-foreground">
            No results for "{query}"
          </p>
          <p className="text-sm text-muted-foreground mt-1 max-w-xs">
            Try a different search term or clear the filter.
          </p>
        </>
      ) : (
        <>
          <p className="font-display text-lg font-semibold text-foreground">
            The corpus is empty
          </p>
          <p className="text-sm text-muted-foreground mt-1 max-w-xs">
            Contribute voice recordings or add entries to start building the
            Inpui language corpus.
          </p>
        </>
      )}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function CorpusPage() {
  const [searchRaw, setSearchRaw] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [activeView, setActiveView] = useState<TabView>("Browse");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const { data: allEntries = [], isLoading } = useCorpusEntries();
  const { data: favoriteIds = [] } = useFavorites();
  const toggleFavorite = useToggleFavorite();

  // Keyboard shortcut: Cmd/Ctrl+K to focus search
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      setSearchRaw(val);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => setSearchQuery(val), 300);
    },
    [],
  );

  const filteredEntries = useMemo<CorpusEntry[]>(() => {
    let entries =
      activeView === "Favorites"
        ? allEntries.filter((e) => favoriteIds.includes(e.id))
        : allEntries;

    if (activeCategory !== "All") {
      entries = entries.filter(
        (e) => e.category.toLowerCase() === activeCategory.toLowerCase(),
      );
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      entries = entries.filter(
        (e) =>
          e.inpui.toLowerCase().includes(q) ||
          e.english.toLowerCase().includes(q) ||
          e.category.toLowerCase().includes(q) ||
          e.tags.some((t) => t.toLowerCase().includes(q)),
      );
    }

    return entries;
  }, [allEntries, favoriteIds, activeView, activeCategory, searchQuery]);

  return (
    <div className="container max-w-screen-xl mx-auto px-4 py-8">
      {/* Page header */}
      <div className="mb-6">
        <h1 className="font-display text-3xl font-bold text-foreground mb-1">
          Corpus Browser
        </h1>
        <p className="text-muted-foreground text-sm">
          Explore the growing Inpui language corpus. Search, filter, and save
          phrases you love.
        </p>
      </div>

      {/* Search + view tabs row */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        {/* Search */}
        <div className="relative flex-1">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
          />
          <Input
            type="search"
            placeholder="Search Inpui, English, or category…"
            value={searchRaw}
            onChange={handleSearchChange}
            className="pl-9"
            ref={searchInputRef}
            data-ocid="corpus-search-input"
          />
        </div>

        {/* Browse / Favorites tabs */}
        <div
          className="flex items-center gap-1 bg-muted/50 border border-border/60 rounded-lg p-1 shrink-0"
          role="tablist"
          aria-label="View tabs"
        >
          {TAB_VIEWS.map((view) => (
            <button
              key={view}
              type="button"
              role="tab"
              aria-selected={activeView === view}
              onClick={() => setActiveView(view)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-smooth ${
                activeView === view
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              data-ocid={`view-tab-${view.toLowerCase()}`}
            >
              {view === "Favorites" && (
                <Star
                  size={13}
                  fill={activeView === "Favorites" ? "currentColor" : "none"}
                  className="text-accent"
                />
              )}
              {view}
            </button>
          ))}
        </div>
      </div>

      {/* Category filter chips */}
      <fieldset
        className="flex flex-wrap gap-2 mb-5 border-0 p-0 m-0"
        aria-label="Category filters"
      >
        <legend className="sr-only">Filter by category</legend>
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setActiveCategory(cat)}
            className={`px-3 py-1 rounded-full text-xs font-medium border transition-smooth ${
              activeCategory === cat
                ? "bg-primary text-primary-foreground border-primary shadow-sm"
                : "bg-transparent text-muted-foreground border-border hover:border-primary/50 hover:text-foreground"
            }`}
            data-ocid={`category-filter-${cat.toLowerCase().replace(/\s+/g, "-")}`}
          >
            {cat}
          </button>
        ))}
      </fieldset>

      {/* Results panel */}
      <div className="rounded-xl border border-border overflow-hidden bg-card shadow-sm">
        {/* Panel header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/20">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            {isLoading
              ? "Loading…"
              : `${filteredEntries.length} ${filteredEntries.length === 1 ? "entry" : "entries"}`}
          </span>
          {activeCategory !== "All" && (
            <button
              type="button"
              onClick={() => setActiveCategory("All")}
              className="text-xs text-muted-foreground hover:text-foreground transition-smooth"
            >
              Clear filter ✕
            </button>
          )}
        </div>

        {/* Content */}
        {isLoading ? (
          <LoadingSkeleton />
        ) : filteredEntries.length === 0 ? (
          <EmptyState view={activeView} query={searchQuery} />
        ) : (
          <ul className="divide-y divide-border/40" aria-label="Corpus entries">
            {filteredEntries.map((entry, index) => (
              <li key={entry.id}>
                <CorpusCard
                  entry={entry}
                  isFavorited={favoriteIds.includes(entry.id)}
                  alternating={index % 2 === 1}
                  onToggleFavorite={(id) => toggleFavorite.mutate(id)}
                />
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Entry count footer */}
      {!isLoading && filteredEntries.length > 0 && (
        <p className="text-xs text-muted-foreground text-center mt-4">
          Showing {filteredEntries.length} of {allEntries.length} total entries
        </p>
      )}
    </div>
  );
}
