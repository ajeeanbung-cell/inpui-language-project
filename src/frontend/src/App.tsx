import { Layout } from "@/components/Layout";
import { Toaster } from "@/components/ui/sonner";
import { useAutoSetFirstAdmin } from "@/hooks/useQueries";
import AdminPage from "@/pages/AdminPage";
import CorpusPage from "@/pages/CorpusPage";
import DashboardPage from "@/pages/DashboardPage";
import FieldworkPage from "@/pages/FieldworkPage";
import FlashcardsPage from "@/pages/FlashcardsPage";
import LeaderboardPage from "@/pages/LeaderboardPage";
import PredictorPage from "@/pages/PredictorPage";
import QueuePage from "@/pages/QueuePage";
import UploadPage from "@/pages/UploadPage";
import VoicePage from "@/pages/VoicePage";
import {
  Outlet,
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";
import { useEffect } from "react";

// ─── Auto-admin bootstrap ──────────────────────────────────────────────────────

function AutoAdminBootstrap() {
  const autoSetFirstAdmin = useAutoSetFirstAdmin();
  const { mutate } = autoSetFirstAdmin;

  useEffect(() => {
    // Fire once on app load — sets caller as admin if no admin exists yet
    mutate();
  }, [mutate]);

  return null;
}

// ─── Root layout route ────────────────────────────────────────────────────────

function RootComponent() {
  return (
    <>
      <AutoAdminBootstrap />
      <Layout>
        <Outlet />
      </Layout>
      <Toaster position="top-right" richColors />
    </>
  );
}

// ─── Route tree ───────────────────────────────────────────────────────────────

const rootRoute = createRootRoute({ component: RootComponent });

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: CorpusPage,
});

const voiceRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/voice",
  component: VoicePage,
});

const queueRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/queue",
  component: QueuePage,
});

const uploadRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/upload",
  component: UploadPage,
});

const predictorRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/predictor",
  component: PredictorPage,
});

const dashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/dashboard",
  component: DashboardPage,
});

const leaderboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/leaderboard",
  component: LeaderboardPage,
});

const flashcardsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/flashcards",
  component: FlashcardsPage,
});

const fieldworkRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/fieldwork",
  component: FieldworkPage,
});

const adminRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin",
  component: AdminPage,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  voiceRoute,
  queueRoute,
  uploadRoute,
  predictorRoute,
  dashboardRoute,
  leaderboardRoute,
  flashcardsRoute,
  fieldworkRoute,
  adminRoute,
]);

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  return <RouterProvider router={router} />;
}
