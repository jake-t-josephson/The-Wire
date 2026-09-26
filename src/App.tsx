import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Nav from "./components/Nav";
import Home from "./pages/Home";
import { PlayerProvider } from "./lib/playerContext";
import { usePlayer } from "./lib/usePlayer";
import { PlayerBar } from "./components/player/PlayerBar";
import { Skeleton } from "./components/ui/Skeleton";

const EPLDashboard = lazy(() => import("./pages/epl/EPLDashboard"));
const MatchDetail = lazy(() => import("./pages/epl/MatchDetail"));
const TeamDetail = lazy(() => import("./pages/epl/TeamDetail"));
const Podcasts = lazy(() => import("./pages/Podcasts"));
const NFLDashboard = lazy(() => import("./pages/nfl/NFLDashboard"));
const CFBDashboard = lazy(() => import("./pages/cfb/CFBDashboard"));
const StyleGuide = lazy(() => import("./pages/StyleGuide"));

function AppShell() {
  const { episode } = usePlayer();
  return (
    <div className={`min-h-screen bg-ink text-bone${episode ? " player-bar-visible" : ""}`}>
      <Nav />
      <Suspense fallback={<div className="page-container page-section space-y-3"><Skeleton height={48} /><Skeleton height={240} /></div>}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/epl" element={<EPLDashboard />} />
          <Route path="/epl/match/:eventId" element={<MatchDetail />} />
          <Route path="/epl/team/:teamId" element={<TeamDetail />} />
          <Route path="/podcasts" element={<Podcasts />} />
          <Route path="/nfl" element={<NFLDashboard />} />
          <Route path="/cfb" element={<CFBDashboard />} />
          <Route path="/ui" element={<StyleGuide />} />
        </Routes>
      </Suspense>
      <PlayerBar />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <PlayerProvider>
        <AppShell />
      </PlayerProvider>
    </BrowserRouter>
  );
}
