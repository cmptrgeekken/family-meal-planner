import { weekdayNames, type WeekdayName } from "./models.js";

const dayToIndexMap = new Map<WeekdayName, number>(weekdayNames.map((day, index) => [day, index]));

export function weekdayToIndex(day: WeekdayName) {
  return dayToIndexMap.get(day) ?? 0;
}

export function indexToWeekday(dayIndex: number): WeekdayName {
  return weekdayNames[dayIndex] ?? weekdayNames[0];
}
