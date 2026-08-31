import { faviconUrl, resolveChannel } from "../channels";
import type { BroadcastModel } from "../../models/sports";

export function toBroadcast(name: string): BroadcastModel {
  const channel = resolveChannel(name);
  return channel ? {
    name,
    label: channel.label,
    logo: faviconUrl(channel.domain),
    url: channel.url,
  } : { name, label: name };
}
