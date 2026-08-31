export interface Segment<T extends string> {
  label: string;
  value: T;
  disabled?: boolean;
}

export function SegmentedControl<T extends string>({ value, items, onChange, label }: {
  value: T;
  items: Segment<T>[];
  onChange: (value: T) => void;
  label: string;
}) {
  return (
    <div className="ui-segmented" role="group" aria-label={label}>
      {items.map((item) => (
        <button
          type="button"
          key={item.value}
          className="ui-segmented__item"
          aria-pressed={value === item.value}
          disabled={item.disabled}
          onClick={() => onChange(item.value)}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
