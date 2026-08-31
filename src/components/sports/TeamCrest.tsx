import { useState, type CSSProperties } from "react";
import { cn } from "../../lib/cn";

export function TeamCrest({ src, name, abbreviation, size = 26, className }: {
  src?: string | null;
  name: string;
  abbreviation?: string;
  size?: number;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  const style = { "--crest-size": `${size}px` } as CSSProperties;
  if (!src || failed) {
    return (
      <span className={cn("team-crest", "team-crest--fallback", className)} style={style} aria-label={name}>
        {(abbreviation || name).slice(0, 3).toUpperCase()}
      </span>
    );
  }
  return <img className={cn("team-crest", className)} style={style} src={src} alt={`${name} crest`} onError={() => setFailed(true)} />;
}
