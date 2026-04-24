export const mondayInputAnchorDate = "2024-01-01";

export function getDefaultPlanningWeekStartDate() {
  const current = new Date();
  const day = current.getDay();
  const daysSinceMonday = day === 0 ? 6 : day - 1;
  current.setDate(current.getDate() - daysSinceMonday);
  return current.toISOString().slice(0, 10);
}

export function normalizeWeekStartDate(dateValue: string) {
  const [year, month, day] = dateValue.split("-").map(Number);

  if (!year || !month || !day) {
    return getDefaultPlanningWeekStartDate();
  }

  const current = new Date(Date.UTC(year, month - 1, day));
  const weekday = current.getUTCDay();
  const daysSinceMonday = weekday === 0 ? 6 : weekday - 1;
  current.setUTCDate(current.getUTCDate() - daysSinceMonday);

  return current.toISOString().slice(0, 10);
}

export function shiftWeekStartDate(weekStartDate: string, weekDelta: number) {
  const [year, month, day] = weekStartDate.split("-").map(Number);

  if (!year || !month || !day) {
    return getDefaultPlanningWeekStartDate();
  }

  const current = new Date(Date.UTC(year, month - 1, day));
  current.setUTCDate(current.getUTCDate() + weekDelta * 7);
  return current.toISOString().slice(0, 10);
}
