import { useState, type CSSProperties } from "react";
import type { SourceMeta } from "../../lib/sourceMeta";
import { Button } from "../ui/Button";

export interface NewsArticleModel {
  headline: string;
  description?: string;
  published: string;
  url: string;
  source: string;
}

function timeAgo(date: string) {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

function sourceStyle(color: string) {
  return { "--source-color": color } as CSSProperties;
}

export function NewsFeed({ articles, sources, pageSize = 10 }: {
  articles: NewsArticleModel[];
  sources: Record<string, SourceMeta>;
  pageSize?: number;
}) {
  const sourceNames = Object.keys(sources);
  const [active, setActive] = useState<Set<string>>(new Set(sourceNames));
  const [visible, setVisible] = useState(pageSize);

  const toggle = (source: string) => {
    setActive((previous) => {
      const next = new Set(previous);
      if (next.has(source)) {
        if (next.size > 1) next.delete(source);
      } else {
        next.add(source);
      }
      return next;
    });
    setVisible(pageSize);
  };

  const filtered = articles.filter((article) => active.has(article.source));

  return (
    <div>
      <div className="source-filter" aria-label="News sources">
        {sourceNames.map((source) => {
          const meta = sources[source];
          const selected = active.has(source);
          return (
            <Button
              variant="bare"
              key={source}
              aria-pressed={selected}
              onClick={() => toggle(source)}
              className="source-filter__item"
              data-selected={selected || undefined}
              style={sourceStyle(meta.color)}
            >
              <img src={meta.logo} alt="" className="source-mark" />
              <span>{meta.label}</span>
            </Button>
          );
        })}
      </div>

      {filtered.slice(0, visible).map((article) => {
        const meta = sources[article.source];
        return (
          <a key={`${article.source}-${article.url}`} href={article.url} target="_blank" rel="noopener noreferrer" className="news-row">
            <div className="news-row__meta">
              {meta && <img src={meta.logo} alt="" className="source-mark" />}
              <span className="news-row__source" style={sourceStyle(meta?.color ?? "var(--color-muted)")}>{article.source}</span>
              <time dateTime={article.published}>{timeAgo(article.published)}</time>
            </div>
            <p className="news-row__headline">{article.headline}</p>
            {article.description && <p className="news-row__description">{article.description}</p>}
          </a>
        );
      })}

      {visible < filtered.length && (
        <Button variant="bare" onClick={() => setVisible((count) => count + pageSize)} className="news-row__more">
          Load more
        </Button>
      )}
    </div>
  );
}
