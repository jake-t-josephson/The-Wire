export interface TabItem<T extends string> {
  label: string;
  value: T;
  disabled?: boolean;
}

export function Tabs<T extends string>({ value, items, onChange, label }: {
  value: T;
  items: TabItem<T>[];
  onChange?: (value: T) => void;
  label: string;
}) {
  return (
    <div className="ui-tabs" role="tablist" aria-label={label}>
      {items.map((item) => (
        <button
          type="button"
          role="tab"
          key={item.value}
          className="ui-tabs__item"
          aria-selected={value === item.value}
          disabled={item.disabled}
          onClick={() => onChange?.(item.value)}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
