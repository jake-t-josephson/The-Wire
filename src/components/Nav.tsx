import { NavLink } from "react-router-dom";

const LEAGUES = [
  { id: "epl", label: "Premier League", path: "/epl" },
] as const;

function WireIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
    </svg>
  );
}

export default function Nav() {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-surface/95 backdrop-blur px-4 md:px-8 py-3 flex items-center justify-between gap-6">
      <div className="flex items-center gap-6">
        <NavLink to="/" className="flex items-center gap-2 text-bone font-semibold text-sm">
          <WireIcon />
          <span>The Wire</span>
        </NavLink>

        <nav className="flex items-center gap-1">
          {LEAGUES.map(({ id, label, path }) => (
            <NavLink
              key={id}
              to={path}
              className={({ isActive }) =>
                `px-3 py-1.5 rounded text-sm transition-colors ${
                  isActive
                    ? "bg-surface-2 text-bone font-medium"
                    : "text-subtle hover:text-bone hover:bg-surface-2/60"
                }`
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>
      </div>

      <span className="label-caps text-muted hidden sm:block">the wire</span>
    </header>
  );
}
