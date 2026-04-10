import { Skeleton } from "@/components/ui/skeleton";
import { useCorpusEntries, useFavorites, useStats } from "@/hooks/useQueries";
import type { CorpusEntry } from "@/types";
import { BookOpen, List, Star, Users } from "lucide-react";
import { motion } from "motion/react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

// ─── Category bar chart data ──────────────────────────────────────────────────

function computeCategoryData(
  entries: CorpusEntry[],
): { category: string; count: number }[] {
  const counts: Record<string, number> = {};
  for (const e of entries) {
    const cat = e.category || "Other";
    counts[cat] = (counts[cat] ?? 0) + 1;
  }
  return Object.entries(counts)
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
}

const GOLD_COLOR = "oklch(0.65 0.18 65)";

// ─── Stat Card ────────────────────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: string;
  icon: React.ReactNode;
  iconBg: string;
  index: number;
}

function StatCard({ label, value, icon, iconBg, index }: StatCardProps) {
  return (
    <motion.div
      className="card-elevated p-5 flex items-center gap-4"
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.08 }}
      data-ocid="stat-card"
    >
      <div className="rounded-xl p-3 shrink-0" style={{ background: iconBg }}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-3xl font-display font-bold text-foreground leading-none">
          {value}
        </p>
        <p className="text-sm text-muted-foreground mt-1 truncate">{label}</p>
      </div>
    </motion.div>
  );
}

// ─── Recent contribution row ──────────────────────────────────────────────────

const MOCK_CONTRIBUTOR_MAP: Record<string, string> = {
  c1: "Lalruati Pachuau",
  c2: "Vanlalruata Hmar",
  c3: "Zodinpuii Renthlei",
  c4: "Thangliana Sailo",
};

function timeAgo(ts: bigint): string {
  const ms = Number(ts);
  const diff = Date.now() - ms;
  if (diff < 60_000) return "just now";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return `${Math.floor(diff / 86_400_000)}d ago`;
}

function RecentRow({
  entry,
  index,
}: {
  entry: CorpusEntry;
  index: number;
}) {
  const contributor = entry.contributorId
    ? (MOCK_CONTRIBUTOR_MAP[entry.contributorId] ?? "Unknown")
    : "Anonymous";
  return (
    <motion.div
      className="flex items-center justify-between gap-3 py-3 border-b border-border last:border-0"
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.25, delay: 0.4 + index * 0.07 }}
    >
      <div className="min-w-0 flex-1">
        <span className="font-semibold text-foreground text-sm">
          {entry.inpui}
        </span>
        <span className="mx-2 text-muted-foreground text-xs">→</span>
        <span className="text-sm text-foreground">{entry.english}</span>
      </div>
      <div className="text-right shrink-0">
        <p className="text-xs text-muted-foreground truncate max-w-[120px]">
          {contributor}
        </p>
        <p className="text-xs text-muted-foreground">
          {timeAgo(entry.createdAt)}
        </p>
      </div>
    </motion.div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { data: stats, isLoading: statsLoading } = useStats();
  const { data: entries = [], isLoading: entriesLoading } = useCorpusEntries();
  const { data: favorites = [] } = useFavorites();

  const totalEntries = stats ? Number(stats.totalCorpusEntries) : 0;
  const activeContributors = stats ? Number(stats.activeContributors) : 0;
  const queueCount = stats ? Number(stats.queueCount) : 0;
  const favoritesCount = favorites.length;

  const recentEntries = [...entries].slice(-5).reverse();
  const categoryData = computeCategoryData(entries);

  const statCards = [
    {
      label: "Total Corpus Entries",
      value: statsLoading ? "—" : totalEntries.toLocaleString(),
      icon: <BookOpen size={22} className="text-primary" />,
      iconBg: "oklch(0.35 0.12 247 / 0.12)",
    },
    {
      label: "Active Contributors",
      value: statsLoading ? "—" : activeContributors.toLocaleString(),
      icon: <Users size={22} className="icon-gold" />,
      iconBg: "oklch(0.65 0.18 65 / 0.12)",
    },
    {
      label: "Words in Queue",
      value: statsLoading ? "—" : queueCount.toLocaleString(),
      icon: <List size={22} style={{ color: "oklch(0.72 0.17 55)" }} />,
      iconBg: "oklch(0.72 0.17 55 / 0.12)",
    },
    {
      label: "Total Favorites",
      value: statsLoading ? "—" : favoritesCount.toLocaleString(),
      icon: <Star size={22} style={{ color: "oklch(0.65 0.22 0)" }} />,
      iconBg: "oklch(0.65 0.22 0 / 0.12)",
    },
  ];

  return (
    <div className="container max-w-screen-xl mx-auto px-4 py-8 space-y-8">
      {/* Page heading */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h1 className="font-display text-3xl font-bold text-foreground mb-1">
          Statistics Dashboard
        </h1>
        <p className="text-muted-foreground text-sm">
          Overview of corpus growth, contributions, and project progress.
        </p>
      </motion.div>

      {/* Stats cards row */}
      <div
        className="grid grid-cols-2 lg:grid-cols-4 gap-4"
        data-ocid="stats-row"
      >
        {statCards.map((card, i) => (
          <StatCard key={card.label} {...card} index={i} />
        ))}
      </div>

      {/* Chart + Recent contributions */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Bar chart */}
        <motion.div
          className="card-elevated p-6 lg:col-span-3"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.35 }}
          data-ocid="category-chart"
        >
          <h2 className="font-display text-lg font-bold text-foreground mb-4">
            Entries by Category
          </h2>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart
              data={categoryData}
              margin={{ top: 4, right: 8, left: -10, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="oklch(0.88 0.01 0)"
                vertical={false}
              />
              <XAxis
                dataKey="category"
                tick={{ fontSize: 11, fill: "oklch(0.45 0 0)" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "oklch(0.45 0 0)" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  background: "oklch(1.0 0.01 0)",
                  border: "1px solid oklch(0.88 0.01 0)",
                  borderRadius: "8px",
                  fontSize: 12,
                }}
                cursor={{ fill: "oklch(0.65 0.18 65 / 0.08)" }}
              />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {categoryData.map((entry) => (
                  <Cell key={entry.category} fill={GOLD_COLOR} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Recent contributions */}
        <motion.div
          className="card-elevated p-6 lg:col-span-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.45 }}
          data-ocid="recent-contributions"
        >
          <h2 className="font-display text-lg font-bold text-foreground mb-4">
            Recent Contributions
          </h2>
          {entriesLoading ? (
            <div className="space-y-3">
              {["sk1", "sk2", "sk3", "sk4", "sk5"].map((k) => (
                <Skeleton key={k} className="h-10 w-full rounded-md" />
              ))}
            </div>
          ) : recentEntries.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-8">
              No contributions yet.
            </p>
          ) : (
            <div>
              {recentEntries.map((entry, i) => (
                <RecentRow key={entry.id} entry={entry} index={i} />
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
