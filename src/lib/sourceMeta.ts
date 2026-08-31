import { faviconUrl } from "./channels";

export interface SourceMeta {
  color: string;
  logo: string;
  label: string;
}

export const EPL_SOURCE_META: Record<string, SourceMeta> = {
  ESPN:           { color: "#dd0300", logo: faviconUrl("espn.com"),        label: "ESPN" },
  "The Guardian": { color: "#082864", logo: faviconUrl("theguardian.com"), label: "The Guardian" },
  "BBC Sport":    { color: "#fdd12c", logo: faviconUrl("bbc.co.uk"),       label: "BBC Sport" },
  "Sky Sports":   { color: "#030fa2", logo: faviconUrl("skysports.com"),   label: "Sky Sports" },
  "The Ringer":   { color: "#05b113", logo: faviconUrl("theringer.com"),   label: "The Ringer" },
};

export const NFL_SOURCE_META: Record<string, SourceMeta> = {
  ESPN:            { color: "#dd0300",           logo: faviconUrl("espn.com"),      label: "ESPN" },
  ProFootballTalk: { color: "var(--color-bone)", logo: "/brand/pft-logo.webp",      label: "ProFootballTalk" },
  "The Ringer":    { color: "#05b113",           logo: faviconUrl("theringer.com"), label: "The Ringer" },
};
