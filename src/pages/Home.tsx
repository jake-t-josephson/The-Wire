import { Link } from "react-router-dom";

const LEAGUES = [
  {
    id: "epl",
    name: "Premier League",
    region: "England",
    path: "/epl",
    live: true,
  },
  { id: "nfl", name: "NFL",  region: "USA",     path: "/nfl",  live: false },
  { id: "nba", name: "NBA",  region: "USA",     path: "/nba",  live: false },
  { id: "cfb", name: "College Football", region: "SEC · Big Ten", path: "/cfb", live: false },
] as const;

export default function Home() {
  return (
    <div className="max-w-6xl mx-auto px-4 md:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-bone">The Wire</h1>
        <p className="mt-1 text-sm text-subtle">Your sports hub — scores, standings, news.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {LEAGUES.map((l) => (
          <div key={l.id} className={`relative rounded-lg border border-border bg-surface p-5 ${l.live ? "hover:border-subtle transition-colors cursor-pointer" : "opacity-50"}`}>
            {l.live ? (
              <Link to={l.path} className="absolute inset-0" aria-label={l.name} />
            ) : null}
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-semibold text-bone">{l.name}</p>
                <p className="text-xs text-muted mt-0.5">{l.region}</p>
              </div>
              {l.live ? (
                <span className="label-caps text-pitch bg-pitch/10 border border-pitch/20 rounded px-2 py-0.5">Live</span>
              ) : (
                <span className="label-caps text-muted bg-surface-2 border border-border rounded px-2 py-0.5">Soon</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
