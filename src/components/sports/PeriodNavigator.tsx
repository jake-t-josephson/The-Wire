import { useEffect, useRef, useState } from "react";
import { IconButton } from "../ui/IconButton";

export function PeriodNavigator({ label, detail, previousLabel, nextLabel, onPrevious, onNext, previousDisabled, nextDisabled, options, selectedIndex, onSelect }: {
  label: string;
  detail?: string;
  previousLabel: string;
  nextLabel: string;
  onPrevious: () => void;
  onNext: () => void;
  previousDisabled?: boolean;
  nextDisabled?: boolean;
  options?: Array<{ label: string; value: number }>;
  selectedIndex?: number;
  onSelect?: (index: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const [cursor, setCursor] = useState(0);
  const btnRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  // Focus the list and scroll the active item into view whenever the cursor moves or the panel opens
  useEffect(() => {
    if (!open || !listRef.current) return;
    listRef.current.focus();
    const item = listRef.current.children[cursor] as HTMLElement | undefined;
    item?.scrollIntoView({ block: "nearest" });
  }, [open, cursor]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  function openDropdown() {
    setCursor(selectedIndex ?? 0);
    setOpen(true);
  }

  function closeDropdown(returnFocus = true) {
    setOpen(false);
    if (returnFocus) btnRef.current?.focus();
  }

  function handleWrapBlur(e: React.FocusEvent<HTMLDivElement>) {
    if (!wrapRef.current?.contains(e.relatedTarget as Node)) setOpen(false);
  }

  function handleListKeyDown(e: React.KeyboardEvent<HTMLUListElement>) {
    if (!options) return;
    if (e.key === "Escape")                                    { e.preventDefault(); closeDropdown(); return; }
    if (e.key === "ArrowDown")                                 { e.preventDefault(); setCursor((c) => Math.min(c + 1, options.length - 1)); return; }
    if (e.key === "ArrowUp")                                   { e.preventDefault(); setCursor((c) => Math.max(c - 1, 0)); return; }
    if (e.key === "Enter" || e.key === " ")                    { e.preventDefault(); onSelect!(options[cursor].value); closeDropdown(); return; }
  }

  return (
    <div className="period-nav">
      <IconButton variant="ghost" className="period-nav__arrow" aria-label={previousLabel} onClick={onPrevious} disabled={previousDisabled}>‹</IconButton>
      <div className="period-nav__copy">
        {options !== undefined && onSelect !== undefined && selectedIndex !== undefined ? (
          <div className="period-nav__select-wrap" ref={wrapRef} onBlur={handleWrapBlur}>
            <button
              ref={btnRef}
              className="period-nav__select-btn"
              onClick={openDropdown}
              aria-haspopup="listbox"
              aria-expanded={open}
            >
              {label}
            </button>
            {open && (
              <ul
                ref={listRef}
                tabIndex={-1}
                className="period-nav__dropdown"
                role="listbox"
                aria-label="Select matchweek"
                aria-activedescendant={`pn-opt-${options[cursor]?.value}`}
                onKeyDown={handleListKeyDown}
              >
                {options.map((opt, i) => (
                  <li
                    key={opt.value}
                    id={`pn-opt-${opt.value}`}
                    role="option"
                    aria-selected={opt.value === selectedIndex}
                    data-cursor={i === cursor || undefined}
                    className="period-nav__dropdown-item"
                    onMouseEnter={() => setCursor(i)}
                    onClick={() => { onSelect(opt.value); closeDropdown(); }}
                  >
                    {opt.label}
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : (
          <div className="period-nav__label">{label}</div>
        )}
        {detail && <div className="period-nav__detail">{detail}</div>}
      </div>
      <IconButton variant="ghost" className="period-nav__arrow" aria-label={nextLabel} onClick={onNext} disabled={nextDisabled}>›</IconButton>
    </div>
  );
}
