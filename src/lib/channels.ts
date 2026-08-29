export interface ChannelInfo {
  label: string;   // clean display name
  url: string;     // link out
  domain: string;  // for favicon lookup
}

// ESPN broadcast name → channel info
// Covers all US EPL broadcasters + common additions for other sports
export const CHANNELS: Record<string, ChannelInfo> = {
  "Peacock":  { label: "Peacock",    url: "https://www.peacocktv.com/watch/sports/highlights", domain: "peacocktv.com" },
  "USA Net":  { label: "USA Network",url: "https://www.usanetwork.com/live",    domain: "usanetwork.com"   },
  "NBC":      { label: "NBC",        url: "https://www.nbc.com",               domain: "nbc.com"          },
  "NBCSN":    { label: "NBC Sports", url: "https://www.nbcsports.com",         domain: "nbcsports.com"    },
  "Tele":     { label: "Telemundo",  url: "https://www.telemundo.com",         domain: "telemundo.com"    },
  "Universo": { label: "Universo",   url: "https://www.nbcuniverso.com",       domain: "nbcuniverso.com"  },
  "ESPN":     { label: "ESPN",       url: "https://www.espn.com",              domain: "espn.com"         },
  "ESPN+":    { label: "ESPN+",      url: "https://plus.espn.com",             domain: "espnplus.com"     },
  "ESPN2":    { label: "ESPN2",      url: "https://www.espn.com",              domain: "espn.com"         },
  "ABC":      { label: "ABC",        url: "https://abc.com",                   domain: "abc.com"          },
  "TNF":      { label: "Prime Video",url: "https://www.amazon.com/primevideo", domain: "primevideo.com"   },
  "Amazon":   { label: "Prime Video",url: "https://www.amazon.com/primevideo", domain: "primevideo.com"   },
  "NFL Net":  { label: "NFL Network",url: "https://www.nfl.com/network",       domain: "nfl.com"          },
  "CBS":      { label: "CBS",        url: "https://www.cbs.com",               domain: "cbs.com"          },
  "Paramount":{ label: "Paramount+", url: "https://www.paramountplus.com",     domain: "paramountplus.com"},
  "Fox":      { label: "Fox",        url: "https://www.fox.com",               domain: "fox.com"          },
  "FS1":      { label: "Fox Sports 1",url: "https://www.foxsports.com",        domain: "foxsports.com"    },
  "TNT":      { label: "TNT",        url: "https://www.tntdrama.com",          domain: "tntdrama.com"     },
  "TBS":      { label: "TBS",        url: "https://www.tbs.com",               domain: "tbs.com"          },
  "Max":      { label: "Max",        url: "https://www.max.com",               domain: "max.com"          },
  "NBA TV":   { label: "NBA TV",     url: "https://www.nba.com/watch",         domain: "nba.com"          },
};

export function faviconUrl(domain: string): string {
  return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
}

export function resolveChannel(name: string): ChannelInfo | null {
  return CHANNELS[name] ?? null;
}
