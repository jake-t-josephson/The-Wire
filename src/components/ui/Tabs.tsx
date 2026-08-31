import { useId, useRef, type KeyboardEvent } from "react";

export interface TabItem<T extends string> {
  label: string;
  value: T;
  disabled?: boolean;
}

export function Tabs<T extends string>({ value, items, onChange, label, panelId }: {
  value: T;
  items: TabItem<T>[];
  onChange?: (value: T) => void;
  label: string;
  panelId: string;
}) {
  const baseId = useId();
  const buttons = useRef<Array<HTMLButtonElement | null>>([]);

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    const enabled = items.map((item, itemIndex) => ({ item, itemIndex })).filter(({ item }) => !item.disabled);
    const current = enabled.findIndex(({ itemIndex }) => itemIndex === index);
    const next = event.key === "Home" ? enabled[0]
      : event.key === "End" ? enabled[enabled.length - 1]
      : enabled[(current + (event.key === "ArrowRight" ? 1 : -1) + enabled.length) % enabled.length];
    if (!next) return;
    buttons.current[next.itemIndex]?.focus();
    onChange?.(next.item.value);
  };

  return (
    <div className="ui-tabs" role="tablist" aria-label={label}>
      {items.map((item, index) => (
        <button
          type="button"
          role="tab"
          id={`${baseId}-${item.value}`}
          aria-controls={panelId}
          key={item.value}
          className="ui-tabs__item"
          aria-selected={value === item.value}
          disabled={item.disabled}
          tabIndex={value === item.value ? 0 : -1}
          ref={(node) => { buttons.current[index] = node; }}
          onKeyDown={(event) => onKeyDown(event, index)}
          onClick={() => onChange?.(item.value)}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
