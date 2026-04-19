import { useState } from "react";

import { AppShell } from "../components/AppShell";
import { MealsScreen } from "../features/meals/MealsScreen";
import { PlanScreen } from "../features/plan/PlanScreen";
import { GroceryScreen } from "../features/grocery/GroceryScreen";
import { SettingsScreen } from "../features/settings/SettingsScreen";

type AppTab = "plan" | "meals" | "grocery" | "settings";

export function App() {
  const [activeTab, setActiveTab] = useState<AppTab>("plan");

  return (
    <AppShell activeTab={activeTab} onTabChange={setActiveTab}>
      {activeTab === "plan" ? <PlanScreen /> : null}
      {activeTab === "meals" ? <MealsScreen /> : null}
      {activeTab === "grocery" ? <GroceryScreen /> : null}
      {activeTab === "settings" ? <SettingsScreen /> : null}
    </AppShell>
  );
}
