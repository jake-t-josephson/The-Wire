import type { BroadcastModel } from "../../models/sports";
import { Badge } from "../ui/Badge";

export function BroadcastBadge({ broadcast }: { broadcast: BroadcastModel }) {
  const content = broadcast.logo ? (
    <img className="broadcast-badge__logo" src={broadcast.logo} alt="" />
  ) : (
    <Badge>{broadcast.label}</Badge>
  );

  if (!broadcast.url) return <span title={broadcast.label}>{content}</span>;

  return (
    <a
      className="broadcast-badge"
      href={broadcast.url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Watch on ${broadcast.label}`}
      title={broadcast.label}
    >
      {content}
    </a>
  );
}
