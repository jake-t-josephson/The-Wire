import { Link } from "react-router-dom";
import type { CSSProperties, ReactNode } from "react";
import type { StandingColumnModel, StandingGroupModel, StandingRowModel } from "../../models/sports";
import { TeamCrest } from "./TeamCrest";

function RowFrame({ row, className, style, children }: {
  row: StandingRowModel;
  className: string;
  style: CSSProperties;
  children: ReactNode;
}) {
  return row.href ? (
    <Link to={row.href} className={className} style={style} data-zone={row.zone}>{children}</Link>
  ) : (
    <div className={className} style={style} data-zone={row.zone}>{children}</div>
  );
}

export function StandingsTable({ columns, groups, ranked = false, teamLabel = "Team" }: {
  columns: StandingColumnModel[];
  groups: StandingGroupModel[];
  ranked?: boolean;
  teamLabel?: string;
}) {
  const template = `${ranked ? "2.125rem " : ""}minmax(0, 1fr) ${columns.map((column) => column.width).join(" ")}`;
  const style = { "--standings-columns": template } as CSSProperties;

  return (
    <div className="standings-table">
      {groups.map((group) => (
        <section className="standings-group" key={group.id} aria-label={group.label}>
          {group.label && <h3 className="standings-group__label">{group.label}</h3>}
          <div className="standings-table__row standings-table__header" style={style}>
            {ranked && <span>#</span>}
            <span>{teamLabel}</span>
            {columns.map((column) => <span key={column.key} data-align={column.align}>{column.label}</span>)}
          </div>
          {group.rows.map((row) => (
            <RowFrame row={row} className="standings-table__row standings-table__body" style={style} key={row.id}>
              {ranked && (
                <span className="standings-table__rank">
                  {row.rank}
                  {!!row.movement && (
                    <small data-tone={row.movement > 0 ? "positive" : "negative"}>
                      {row.movement > 0 ? "▲" : "▼"}{Math.abs(row.movement)}
                    </small>
                  )}
                </span>
              )}
              <span className="standings-table__team">
                <TeamCrest src={row.team.crest} name={row.team.name} abbreviation={row.team.abbreviation} size={17} />
                <span>{row.team.shortName}</span>
              </span>
              {columns.map((column) => {
                const cell = row.cells[column.key];
                return (
                  <span className={column.emphasis ? "standings-table__cell--emphasis" : undefined} data-align={column.align} data-tone={cell?.tone} key={column.key}>
                    {cell?.value ?? "–"}
                    {cell?.detail && <small data-tone={cell.detailTone}>{cell.detail}</small>}
                  </span>
                );
              })}
            </RowFrame>
          ))}
        </section>
      ))}
    </div>
  );
}

export function StandingsLegend({ items }: { items: Array<{ tone: NonNullable<StandingRowModel["zone"]>; label: string }> }) {
  return (
    <div className="standings-legend">
      {items.map((item) => (
        <span className="standings-legend__item" key={item.label}>
          <i data-zone={item.tone} />{item.label}
        </span>
      ))}
    </div>
  );
}
