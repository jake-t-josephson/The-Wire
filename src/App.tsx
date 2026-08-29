import { BrowserRouter, Routes, Route } from "react-router-dom";
import Nav from "./components/Nav";
import Home from "./pages/Home";
import EPLDashboard from "./pages/epl/EPLDashboard";

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-ink text-bone">
        <Nav />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/epl" element={<EPLDashboard />} />
          <Route path="/epl/*" element={<EPLDashboard />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
