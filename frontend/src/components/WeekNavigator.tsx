import { formatWeekRangeLabel } from "../features/shared/week";

type WeekNavigatorProps = {
  weekStartDate: string;
  defaultWeekStartDate: string;
  onWeekChange: (weekStartDate: string) => void;
  onShiftWeek: (weekDelta: number) => void;
};

export function WeekNavigator({
  weekStartDate,
  defaultWeekStartDate,
  onWeekChange,
  onShiftWeek,
}: WeekNavigatorProps) {
  return (
    <section className="week-navigator" aria-label="Week navigation">
      <div className="week-navigator-copy">
        <span className="week-navigator-label">Week of</span>
        <strong>{formatWeekRangeLabel(weekStartDate)}</strong>
      </div>
      <div className="week-navigator-controls">
        <button type="button" className="secondary-button week-nav-button" onClick={() => onShiftWeek(-1)}>
          Previous
        </button>
        <label className="week-navigator-input">
          <span className="sr-only">Week start date</span>
          <input type="date" value={weekStartDate} onChange={(event) => onWeekChange(event.target.value)} />
        </label>
        <button
          type="button"
          className="secondary-button week-nav-button"
          onClick={() => onWeekChange(defaultWeekStartDate)}
          disabled={weekStartDate === defaultWeekStartDate}
        >
          Current
        </button>
        <button type="button" className="secondary-button week-nav-button" onClick={() => onShiftWeek(1)}>
          Next
        </button>
      </div>
    </section>
  );
}
