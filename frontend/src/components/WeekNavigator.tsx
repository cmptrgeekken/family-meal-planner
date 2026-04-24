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
      <div className="week-navigator-controls">
        <button
          type="button"
          className="secondary-button week-nav-button week-nav-button-icon"
          aria-label="Previous week"
          title="Previous week"
          onClick={() => onShiftWeek(-1)}
        >
          &lt;
        </button>
        <label className="week-navigator-input">
          <span className="week-navigator-label">Week of</span>
          <input type="date" value={weekStartDate} aria-label="Week start date" onChange={(event) => onWeekChange(event.target.value)} />
        </label>
        <span className="week-navigator-range">{formatWeekRangeLabel(weekStartDate)}</span>
        <button
          type="button"
          className="secondary-button week-nav-button"
          onClick={() => onWeekChange(defaultWeekStartDate)}
          disabled={weekStartDate === defaultWeekStartDate}
        >
          Current
        </button>
        <button
          type="button"
          className="secondary-button week-nav-button week-nav-button-icon"
          aria-label="Next week"
          title="Next week"
          onClick={() => onShiftWeek(1)}
        >
          &gt;
        </button>
      </div>
    </section>
  );
}
