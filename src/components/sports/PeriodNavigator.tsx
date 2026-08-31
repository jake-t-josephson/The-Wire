import { IconButton } from "../ui/IconButton";

export function PeriodNavigator({ label, detail, previousLabel, nextLabel, onPrevious, onNext, previousDisabled, nextDisabled }: {
  label: string;
  detail?: string;
  previousLabel: string;
  nextLabel: string;
  onPrevious: () => void;
  onNext: () => void;
  previousDisabled?: boolean;
  nextDisabled?: boolean;
}) {
  return (
    <div className="period-nav">
      <IconButton aria-label={previousLabel} onClick={onPrevious} disabled={previousDisabled}>‹</IconButton>
      <div className="period-nav__copy">
        <div className="period-nav__label">{label}</div>
        {detail && <div className="period-nav__detail">{detail}</div>}
      </div>
      <IconButton aria-label={nextLabel} onClick={onNext} disabled={nextDisabled}>›</IconButton>
    </div>
  );
}
