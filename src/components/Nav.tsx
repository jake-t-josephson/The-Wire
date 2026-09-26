import { NavLink, useLocation } from "react-router-dom";
import { useTheme } from "../lib/theme";
import { Button } from "./ui/Button";

const PRIMARY_LINKS = [
  { label: "Today",     to: "/" },
  { label: "Football",  to: "/epl" },
  { label: "NFL",       to: "/nfl" },
  { label: "CFB",       to: "/cfb" },
  { label: "Podcasts",  to: "/podcasts" },
] as const;

const COMING_SOON = ["NBA"] as const;

export default function Nav() {
  const location = useLocation();
  const { theme, toggle } = useTheme();
  const onEpl = location.pathname.startsWith("/epl");

  return (
    <header className="site-nav">
      <div className="site-nav__inner">
        <NavLink
          to="/"
          className="site-nav__wordmark"
          aria-label="The Wire home"
        >
          The Wire
        </NavLink>

        <nav className="site-nav__leagues" aria-label="Sports">
          {PRIMARY_LINKS.map(({ label, to }) => {
            const active = to === "/" ? location.pathname === "/"
              : to === "/epl" ? onEpl
              : location.pathname.startsWith(to);
            return (
              <NavLink
                key={label}
                to={to}
                end={to === "/"}
                className={`site-nav__link${active ? " is-active" : ""}`}
                aria-current={active ? "page" : undefined}
              >
                {label}
              </NavLink>
            );
          })}
          {COMING_SOON.map((label) => (
            <span key={label} className="site-nav__link is-disabled" aria-disabled="true">
              {label}
            </span>
          ))}
        </nav>

        <div className="site-nav__utilities">
          <span className="site-nav__utility">Wireroom</span>
          <span className="site-nav__utility">Column</span>
          <Button
            variant="bare"
            onClick={toggle}
            className="site-nav__theme-toggle"
            aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
            aria-pressed={theme === "light"}
          >
            <span className="site-nav__theme-icon" aria-hidden="true" />
            <span>{theme === "dark" ? "Light" : "Dark"}</span>
          </Button>
        </div>

        <div className="site-nav__dot" aria-hidden="true" />
      </div>
    </header>
  );
}
