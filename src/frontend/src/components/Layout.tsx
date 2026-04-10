import { DonationModal } from "@/components/DonationModal";
import OnboardingTour, {
  shouldAutoShowTour,
} from "@/components/OnboardingTour";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { useIsMutating } from "@tanstack/react-query";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  BarChart3,
  BookOpen,
  Heart,
  HelpCircle,
  LayoutDashboard,
  Loader2,
  type LucideProps,
  Mic,
  Moon,
  Search,
  Shield,
  Sparkles,
  Sun,
  Trophy,
  Upload,
  Zap,
} from "lucide-react";
import {
  type ForwardRefExoticComponent,
  type RefAttributes,
  useEffect,
  useState,
} from "react";

const NAV_ITEMS: Array<{
  id: string;
  label: string;
  path: string;
  icon: ForwardRefExoticComponent<
    Omit<LucideProps, "ref"> & RefAttributes<SVGSVGElement>
  >;
  mobileOnly?: boolean;
}> = [
  { id: "corpus", label: "Corpus", path: "/", icon: BookOpen },
  { id: "voice", label: "Voice", path: "/voice", icon: Mic },
  { id: "queue", label: "Queue", path: "/queue", icon: Zap },
  { id: "upload", label: "Upload", path: "/upload", icon: Upload },
  { id: "predictor", label: "Predictor", path: "/predictor", icon: Sparkles },
  { id: "dashboard", label: "Stats", path: "/dashboard", icon: BarChart3 },
  { id: "leaderboard", label: "Leaders", path: "/leaderboard", icon: Trophy },
  {
    id: "flashcards",
    label: "Flashcards",
    path: "/flashcards",
    icon: LayoutDashboard,
  },
  {
    id: "fieldwork",
    label: "Fieldwork",
    path: "/fieldwork",
    icon: Mic,
    mobileOnly: true,
  },
  { id: "admin", label: "Admin", path: "/admin", icon: Shield },
] as const;

const MOBILE_TABS: Array<{
  id: string;
  label: string;
  path: string;
  icon: ForwardRefExoticComponent<
    Omit<LucideProps, "ref"> & RefAttributes<SVGSVGElement>
  >;
}> = [
  { id: "corpus", label: "Corpus", path: "/", icon: BookOpen },
  { id: "voice", label: "Voice", path: "/voice", icon: Mic },
  { id: "queue", label: "Queue", path: "/queue", icon: Zap },
  { id: "fieldwork", label: "Fieldwork", path: "/fieldwork", icon: Upload },
] as const;

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [donateOpen, setDonateOpen] = useState(false);
  const [tourOpen, setTourOpen] = useState(false);
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== "undefined") {
      return (
        localStorage.getItem("theme") === "dark" ||
        document.documentElement.classList.contains("dark")
      );
    }
    return false;
  });
  const isMobile = useIsMobile();
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;
  const isMutating = useIsMutating();

  // Auto-show tour for first-time visitors
  useEffect(() => {
    if (shouldAutoShowTour()) {
      setTourOpen(true);
    }
  }, []);

  // Apply dark mode class
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [isDark]);

  // Initialize dark from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("theme");
    if (saved === "dark") {
      document.documentElement.classList.add("dark");
      setIsDark(true);
    } else if (saved === "light") {
      document.documentElement.classList.remove("dark");
      setIsDark(false);
    }
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header
        style={{ backgroundColor: "oklch(0.28 0.10 247)" }}
        className="sticky top-0 z-50 border-b shadow-elevated"
        data-ocid="app-header"
      >
        <div className="container max-w-screen-xl mx-auto px-4">
          <div className="flex items-center gap-4 h-16">
            {/* Brand */}
            <Link to="/" className="flex items-center gap-3 shrink-0 group">
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center shadow-sm font-display font-bold text-sm"
                style={{
                  backgroundColor: "oklch(0.65 0.18 65)",
                  color: "oklch(0.28 0.10 247)",
                }}
              >
                IP
              </div>
              <div className="leading-tight">
                <div
                  className="font-display font-bold text-base tracking-tight"
                  style={{ color: "oklch(0.98 0 0)" }}
                >
                  Inpui Language Project
                </div>
                <div
                  className="text-xs tracking-wider uppercase hidden sm:block"
                  style={{ color: "oklch(0.65 0.18 65)" }}
                >
                  Preserving Our Heritage
                </div>
              </div>
            </Link>

            {/* Desktop Nav */}
            {!isMobile && (
              <nav
                className="flex-1 flex items-center gap-0.5 overflow-x-auto ml-4"
                aria-label="Main navigation"
              >
                {NAV_ITEMS.filter((item) => !item.mobileOnly).map((item) => {
                  const Icon = item.icon;
                  const isActive = currentPath === item.path;
                  return (
                    <Link
                      key={item.id}
                      to={item.path}
                      data-ocid={`nav-${item.id}`}
                      className={cn(
                        "flex items-center gap-1.5 px-3 py-1.5 rounded text-sm transition-smooth whitespace-nowrap",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                        isActive
                          ? "font-semibold"
                          : "font-normal opacity-75 hover:opacity-100",
                      )}
                      style={{
                        color: isActive
                          ? "oklch(0.65 0.18 65)"
                          : "oklch(0.9 0 0)",
                        borderBottom: isActive
                          ? "2px solid oklch(0.65 0.18 65)"
                          : "2px solid transparent",
                      }}
                    >
                      <Icon
                        size={15}
                        style={{ color: "oklch(0.65 0.18 65)" }}
                        aria-hidden="true"
                      />
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
            )}

            {isMobile && <div className="flex-1" />}

            {/* Header actions */}
            <div className="flex items-center gap-1 shrink-0">
              {/* Syncing indicator */}
              {isMutating > 0 && (
                <span
                  className="flex items-center gap-1 text-xs px-2 py-1 rounded-full transition-smooth"
                  style={{ color: "oklch(0.65 0.18 65)" }}
                  aria-label="Saving…"
                  data-ocid="sync-indicator"
                >
                  <Loader2 size={13} className="animate-spin" />
                  <span className="hidden sm:inline">Saving</span>
                </span>
              )}

              {/* Dark mode toggle */}
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 rounded-full"
                style={{ color: "oklch(0.65 0.18 65)" }}
                onClick={() => setIsDark((d) => !d)}
                aria-label={
                  isDark ? "Switch to light mode" : "Switch to dark mode"
                }
                data-ocid="theme-toggle"
              >
                {isDark ? <Sun size={16} /> : <Moon size={16} />}
              </Button>

              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 rounded-full"
                style={{ color: "oklch(0.65 0.18 65)" }}
                onClick={() => setTourOpen(true)}
                aria-label="Open help tour"
                data-ocid="help-btn"
              >
                <HelpCircle size={18} />
              </Button>
              <Button
                size="sm"
                className="hidden sm:flex items-center gap-1.5 rounded-full text-sm font-normal px-4"
                style={{
                  backgroundColor: "oklch(0.65 0.18 65)",
                  color: "oklch(0.28 0.10 247)",
                }}
                onClick={() => setDonateOpen(true)}
                aria-label="Open donation modal"
                data-ocid="donate-btn"
              >
                <Heart size={14} />
                Donate
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="sm:hidden h-8 w-8 rounded-full"
                style={{ color: "oklch(0.65 0.18 65)" }}
                onClick={() => setDonateOpen(true)}
                aria-label="Donate"
                data-ocid="donate-btn-mobile"
              >
                <Heart size={16} />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 bg-background" id="main-content">
        {children}
      </main>

      {/* Footer */}
      <footer
        className="bg-card border-t border-border/60 py-5 mt-auto"
        style={{ paddingBottom: isMobile ? "5rem" : undefined }}
      >
        <div className="container max-w-screen-xl mx-auto px-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-sm text-muted-foreground">
            <span>
              © {new Date().getFullYear()} Inpui Heritage Foundation. All rights
              reserved.
            </span>
            <a
              href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(typeof window !== "undefined" ? window.location.hostname : "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground transition-colors"
            >
              Built with love using caffeine.ai
            </a>
          </div>
        </div>
      </footer>

      {/* Mobile bottom nav */}
      {isMobile && (
        <nav
          className="fixed bottom-0 left-0 right-0 z-50 border-t shadow-elevated"
          style={{ backgroundColor: "oklch(0.28 0.10 247)" }}
          aria-label="Mobile navigation"
          data-ocid="mobile-nav"
        >
          <div className="flex items-center justify-around h-16 px-2">
            {MOBILE_TABS.map((item) => {
              const Icon = item.icon;
              const isActive = currentPath === item.path;
              return (
                <Link
                  key={item.id}
                  to={item.path}
                  data-ocid={`mobile-nav-${item.id}`}
                  className="flex flex-col items-center gap-1 px-2 py-1 rounded transition-smooth min-w-0"
                  style={{
                    color: isActive ? "oklch(0.65 0.18 65)" : "oklch(0.8 0 0)",
                  }}
                >
                  <Icon size={20} aria-hidden="true" />
                  <span className="text-[10px] font-normal leading-none">
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </div>
        </nav>
      )}

      {/* Mobile floating quick-action bar */}
      {isMobile && (
        <div
          className="fixed bottom-20 right-4 z-40 flex flex-col gap-2"
          data-ocid="mobile-quick-actions"
        >
          <Link to="/voice">
            <button
              type="button"
              className="w-12 h-12 rounded-full flex items-center justify-center shadow-elevated transition-smooth active:scale-95"
              style={{
                backgroundColor: "oklch(0.75 0.22 135)",
                color: "oklch(0.12 0 0)",
              }}
              aria-label="Record voice"
              data-ocid="fab-record"
            >
              <Mic size={20} />
            </button>
          </Link>
          <Link to="/">
            <button
              type="button"
              className="w-12 h-12 rounded-full flex items-center justify-center shadow-elevated transition-smooth active:scale-95"
              style={{
                backgroundColor: "oklch(0.65 0.18 65)",
                color: "oklch(0.28 0.10 247)",
              }}
              aria-label="Search corpus"
              data-ocid="fab-search"
            >
              <Search size={18} />
            </button>
          </Link>
        </div>
      )}

      {/* Donation Modal */}
      <DonationModal open={donateOpen} onClose={() => setDonateOpen(false)} />

      {/* Onboarding Tour */}
      <OnboardingTour isOpen={tourOpen} onClose={() => setTourOpen(false)} />
    </div>
  );
}
