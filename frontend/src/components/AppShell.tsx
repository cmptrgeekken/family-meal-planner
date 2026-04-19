import type { ReactNode } from "react";

type AppTab = "plan" | "meals" | "grocery" | "settings";

type AppShellProps = {
  activeTab: AppTab;
  onTabChange: (tab: AppTab) => void;
  children: ReactNode;
};

const tabs: Array<{ id: AppTab; label: string; description: string }> = [
  { id: "plan", label: "Plan", description: "Weekly dinner flow" },
  { id: "meals", label: "Meals", description: "Browse and filter" },
  { id: "grocery", label: "Grocery", description: "Shopping preview" },
  { id: "settings", label: "Settings", description: "Reference data" },
];

export function AppShell({ activeTab, onTabChange, children }: AppShellProps) {
  return (
    <div className="app-shell">
      <header className="app-header">
        <div>
          <p className="eyebrow">Family Meal Planner</p>
          <h1>Plan faster. Shop smarter. Keep dinner calm.</h1>
        </div>
        <div className="header-badge">Dinner-first, mobile-first</div>
      </header>

      <main className="app-main">{children}</main>

      <nav className="bottom-nav" aria-label="Primary">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={tab.id === activeTab ? "nav-pill nav-pill-active" : "nav-pill"}
            onClick={() => onTabChange(tab.id)}
            aria-current={tab.id === activeTab ? "page" : undefined}
          >
            <span>{tab.label}</span>
            <small>{tab.description}</small>
          </button>
        ))}
      </nav>
    </div>
  );
}
