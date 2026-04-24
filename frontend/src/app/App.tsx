import { useEffect, useState } from "react";

import { AppShell } from "../components/AppShell";
import { WeekNavigator } from "../components/WeekNavigator";
import { MealsScreen } from "../features/meals/MealsScreen";
import { MagnetsScreen } from "../features/magnets/MagnetsScreen";
import { PlanScreen } from "../features/plan/PlanScreen";
import { GroceryScreen } from "../features/grocery/GroceryScreen";
import { getDefaultPlanningWeekStartDate, normalizeWeekStartDate, shiftWeekStartDate } from "../features/shared/week";
import { SettingsScreen } from "../features/settings/SettingsScreen";

export type AppTab = "plan" | "meals" | "grocery" | "magnets" | "settings";

const pathToTab: Record<string, AppTab> = {
  "/": "plan",
  "/plan": "plan",
  "/meals": "meals",
  "/grocery": "grocery",
  "/magnets": "magnets",
  "/settings": "settings",
};

function getTabFromLocation() {
  return pathToTab[window.location.pathname] ?? "plan";
}

function getPathForTab(tab: AppTab) {
  return tab === "plan" ? "/plan" : `/${tab}`;
}

export function App() {
  const [activeTab, setActiveTab] = useState<AppTab>(getTabFromLocation);
  const [selectedWeekStartDate, setSelectedWeekStartDate] = useState(getDefaultPlanningWeekStartDate);
  const defaultWeekStartDate = getDefaultPlanningWeekStartDate();

  useEffect(() => {
    function handlePopState() {
      setActiveTab(getTabFromLocation());
    }

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  function handleTabChange(tab: AppTab) {
    const nextPath = getPathForTab(tab);

    if (window.location.pathname !== nextPath) {
      window.history.pushState(null, "", nextPath);
    }

    setActiveTab(tab);
  }

  function handleWeekChange(weekStartDate: string) {
    setSelectedWeekStartDate(normalizeWeekStartDate(weekStartDate));
  }

  function handleShiftWeek(weekDelta: number) {
    setSelectedWeekStartDate((current) => shiftWeekStartDate(current, weekDelta));
  }

  const showWeekNavigator = activeTab === "plan" || activeTab === "grocery";

  return (
    <AppShell
      activeTab={activeTab}
      onTabChange={handleTabChange}
      weekNavigator={
        showWeekNavigator ? (
          <WeekNavigator
            weekStartDate={selectedWeekStartDate}
            defaultWeekStartDate={defaultWeekStartDate}
            onWeekChange={handleWeekChange}
            onShiftWeek={handleShiftWeek}
          />
        ) : null
      }
    >
      {activeTab === "plan" ? <PlanScreen weekStartDate={selectedWeekStartDate} /> : null}
      {activeTab === "meals" ? <MealsScreen /> : null}
      {activeTab === "grocery" ? <GroceryScreen weekStartDate={selectedWeekStartDate} /> : null}
      {activeTab === "magnets" ? <MagnetsScreen /> : null}
      {activeTab === "settings" ? <SettingsScreen /> : null}
    </AppShell>
  );
}
