import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useLeaderboard } from "@/hooks/useQueries";
import type { Contributor } from "@/types";
import { useInternetIdentity } from "@caffeineai/core-infrastructure";
import { CheckCircle, Medal, Trophy } from "lucide-react";
import { motion } from "motion/react";

// ─── Medal config ─────────────────────────────────────────────────────────────

const MEDALS = [
  {
    bg: "oklch(0.65 0.18 65 / 0.15)",
    border: "oklch(0.65 0.18 65 / 0.45)",
    label: "Gold",
    color: "oklch(0.65 0.18 65)",
    textColor: "oklch(0.42 0.14 65)",
  },
  {
    bg: "oklch(0.68 0.03 0 / 0.15)",
    border: "oklch(0.68 0.03 0 / 0.40)",
    label: "Silver",
    color: "oklch(0.62 0.02 0)",
    textColor: "oklch(0.38 0.02 0)",
  },
  {
    bg: "oklch(0.58 0.12 40 / 0.15)",
    border: "oklch(0.58 0.12 40 / 0.40)",
    label: "Bronze",
    color: "oklch(0.55 0.14 45)",
    textColor: "oklch(0.38 0.12 45)",
  },
];

// ─── Verified Badge chip ──────────────────────────────────────────────────────

function VerifiedChip() {
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
      style={{
        background: "oklch(0.35 0.12 247 / 0.12)",
        color: "oklch(0.35 0.12 247)",
        border: "1px solid oklch(0.35 0.12 247 / 0.3)",
      }}
    >
      <CheckCircle size={11} strokeWidth={2.5} />
      Verified
    </span>
  );
}

// ─── Top 3 card ───────────────────────────────────────────────────────────────

function TopThreeCard({
  contributor,
  rank,
}: {
  contributor: Contributor;
  rank: number;
}) {
  const medal = MEDALS[rank - 1];
  const isGold = rank === 1;

  return (
    <motion.div
      className="relative rounded-xl p-5 flex flex-col items-center text-center gap-2"
      style={{
        background: medal.bg,
        border: `1.5px solid ${medal.border}`,
      }}
      initial={{ opacity: 0, scale: 0.93 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.35, delay: rank * 0.1 }}
      data-ocid={`top-${rank}-card`}
    >
      {isGold && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-lg">
          🥇
        </span>
      )}
      {rank === 2 && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-lg">
          🥈
        </span>
      )}
      {rank === 3 && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-lg">
          🥉
        </span>
      )}

      <div
        className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-display font-bold shrink-0 mt-2"
        style={{
          background: medal.color,
          color: "oklch(0.98 0 0)",
        }}
      >
        {contributor.name.charAt(0)}
      </div>

      <div className="min-w-0 w-full">
        <p className="font-display font-bold text-foreground text-base leading-tight truncate">
          {contributor.name}
        </p>
        {contributor.isVerified && (
          <div className="flex justify-center mt-1">
            <VerifiedChip />
          </div>
        )}
      </div>

      <div
        className="px-3 py-1 rounded-full text-sm font-semibold"
        style={{
          background: medal.color,
          color: "oklch(0.98 0 0)",
        }}
      >
        {contributor.contributions} contributions
      </div>

      {contributor.badges.length > 0 && (
        <div className="flex flex-wrap justify-center gap-1 mt-1">
          {contributor.badges.slice(0, 2).map((badge) => (
            <Badge
              key={badge}
              variant="secondary"
              className="text-xs py-0 px-2"
            >
              {badge}
            </Badge>
          ))}
        </div>
      )}
    </motion.div>
  );
}

// ─── Regular rank row ─────────────────────────────────────────────────────────

function RankRow({
  contributor,
  rank,
  index,
  isCurrentUser,
}: {
  contributor: Contributor;
  rank: number;
  index: number;
  isCurrentUser: boolean;
}) {
  return (
    <motion.div
      className="flex items-center gap-4 py-3.5 px-4 rounded-lg border border-border transition-smooth"
      style={
        isCurrentUser
          ? {
              background: "oklch(0.65 0.18 65 / 0.10)",
              borderColor: "oklch(0.65 0.18 65 / 0.35)",
            }
          : undefined
      }
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.28, delay: 0.5 + index * 0.06 }}
      data-ocid="rank-row"
    >
      {/* Rank number */}
      <span className="w-7 text-center font-display font-bold text-muted-foreground text-sm shrink-0">
        {rank}
      </span>

      {/* Avatar */}
      <div
        className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
        style={{
          background: "oklch(0.35 0.12 247 / 0.14)",
          color: "oklch(0.35 0.12 247)",
        }}
      >
        {contributor.name.charAt(0)}
      </div>

      {/* Name + verified */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium text-foreground text-sm truncate">
            {contributor.name}
          </span>
          {isCurrentUser && (
            <Badge
              className="text-[10px] px-1.5 py-0 font-semibold"
              style={{
                background: "oklch(0.65 0.18 65)",
                color: "oklch(0.28 0.10 247)",
              }}
            >
              You
            </Badge>
          )}
          {contributor.isVerified && <VerifiedChip />}
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">
          Joined {new Date(Number(contributor.joinedAt)).getFullYear()}
        </p>
      </div>

      {/* Contribution count */}
      <div className="shrink-0 text-right">
        <span
          className="px-2.5 py-1 rounded-full text-xs font-semibold"
          style={{
            background: "oklch(0.65 0.18 65 / 0.14)",
            color: "oklch(0.42 0.14 65)",
          }}
        >
          {contributor.contributions}
        </span>
      </div>
    </motion.div>
  );
}

// ─── Loading skeleton ─────────────────────────────────────────────────────────

function LeaderboardSkeleton() {
  return (
    <div className="space-y-3" data-ocid="leaderboard-skeleton">
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-44 rounded-xl" />
        ))}
      </div>
      {["r1", "r2", "r3", "r4", "r5"].map((k) => (
        <Skeleton key={k} className="h-16 w-full rounded-lg" />
      ))}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function LeaderboardPage() {
  const { data: contributors = [], isLoading } = useLeaderboard();
  const { identity } = useInternetIdentity();
  const myPrincipal = identity?.getPrincipal().toText() ?? "";

  const top3 = contributors.slice(0, 3);
  const rest = contributors.slice(3);

  return (
    <div className="container max-w-screen-lg mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <motion.div
        className="flex items-center gap-3"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: "oklch(0.65 0.18 65 / 0.15)" }}
        >
          <Trophy size={20} style={{ color: "oklch(0.65 0.18 65)" }} />
        </div>
        <div>
          <h1 className="font-display text-3xl font-bold text-foreground leading-tight">
            Top Contributors
          </h1>
          <p className="text-muted-foreground text-sm">
            Honoring those who keep the Inpui language alive.
          </p>
        </div>
      </motion.div>

      {/* Medal icon legend */}
      <motion.div
        className="flex items-center gap-4 text-xs text-muted-foreground"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <span className="flex items-center gap-1.5">
          <Medal size={13} style={{ color: "oklch(0.65 0.18 65)" }} />
          Verified contributors earn a badge at 10+ submissions
        </span>
      </motion.div>

      {isLoading ? (
        <LeaderboardSkeleton />
      ) : contributors.length === 0 ? (
        <motion.div
          className="card-elevated flex flex-col items-center justify-center py-20 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          data-ocid="leaderboard-empty"
        >
          <Trophy size={48} className="text-muted-foreground mb-4 opacity-40" />
          <p className="font-display text-xl font-bold text-foreground mb-2">
            No contributors yet
          </p>
          <p className="text-muted-foreground text-sm">
            Be the first — contribute a word or voice recording!
          </p>
        </motion.div>
      ) : (
        <div className="space-y-8">
          {/* Top 3 podium */}
          {top3.length > 0 && (
            <div
              className="grid gap-5 mt-6"
              style={{
                gridTemplateColumns: `repeat(${Math.min(top3.length, 3)}, 1fr)`,
              }}
              data-ocid="podium"
            >
              {top3.map((contributor, i) => (
                <TopThreeCard
                  key={contributor.id}
                  contributor={contributor}
                  rank={i + 1}
                />
              ))}
            </div>
          )}

          {/* Remaining ranked list */}
          {rest.length > 0 && (
            <div className="space-y-2" data-ocid="rank-list">
              <h2 className="font-display text-base font-bold text-foreground mb-3 flex items-center gap-2">
                <span>All Contributors</span>
                <span className="text-xs font-normal text-muted-foreground">
                  ({contributors.length} total)
                </span>
              </h2>
              {rest.map((contributor, i) => (
                <RankRow
                  key={contributor.id}
                  contributor={contributor}
                  rank={i + 4}
                  index={i}
                  isCurrentUser={
                    !!myPrincipal && contributor.id === myPrincipal
                  }
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
