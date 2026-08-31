import { BrowserRouter, Routes, Route } from "react-router-dom";
import Nav from "./components/Nav";
import Home from "./pages/Home";
import EPLDashboard from "./pages/epl/EPLDashboard";
import MatchDetail from "./pages/epl/MatchDetail";
import TeamDetail from "./pages/epl/TeamDetail";
import Podcasts from "./pages/Podcasts";
import NFLDashboard from "./pages/nfl/NFLDashboard";
import StyleGuide from "./pages/StyleGuide";
import { PlayerProvider, usePlayer } from "./lib/playerContext";
import { PlayerBar } from "./components/player/PlayerBar";

function AppShell() {
  const { episode } = usePlayer();
  return (
    <div className={`min-h-screen bg-ink text-bone${episode ? " player-bar-visible" : ""}`}
         style={{ paddingBottom: episode ? "84px" : undefined }}>
      <Nav />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/epl" element={<EPLDashboard />} />
        <Route path="/epl/match/:eventId" element={<MatchDetail />} />
        <Route path="/epl/team/:teamId" element={<TeamDetail />} />
        <Route path="/podcasts" element={<Podcasts />} />
        <Route path="/nfl" element={<NFLDashboard />} />
        <Route path="/ui" element={<StyleGuide />} />
      </Routes>
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
