import { useEffect, useState } from "react";

import { AppShell } from "../components/AppShell";
import { MealsScreen } from "../features/meals/MealsScreen";
import { MagnetsScreen } from "../features/magnets/MagnetsScreen";
import { PlanScreen } from "../features/plan/PlanScreen";
import { GroceryScreen } from "../features/grocery/GroceryScreen";
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

  return (
    <AppShell activeTab={activeTab} onTabChange={handleTabChange}>
      {activeTab === "plan" ? <PlanScreen /> : null}
      {activeTab === "meals" ? <MealsScreen /> : null}
      {activeTab === "grocery" ? <GroceryScreen /> : null}
      {activeTab === "magnets" ? <MagnetsScreen /> : null}
      {activeTab === "settings" ? <SettingsScreen /> : null}
    </AppShell>
  );
}
