import type { ReactNode } from "react";

import type { AppTab } from "../app/App";

type AppShellProps = {
  activeTab: AppTab;
  onTabChange: (tab: AppTab) => void;
  children: ReactNode;
};

const tabs: Array<{ id: AppTab; label: string; description: string; href: string }> = [
  { id: "plan", label: "Plan", description: "Weekly dinner flow", href: "/plan" },
  { id: "meals", label: "Meals", description: "Browse and filter", href: "/meals" },
  { id: "grocery", label: "Grocery", description: "Shopping preview", href: "/grocery" },
  { id: "magnets", label: "Magnets", description: "SVG exports", href: "/magnets" },
  { id: "settings", label: "Settings", description: "Reference data", href: "/settings" },
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
          <a
            key={tab.id}
            href={tab.href}
            className={tab.id === activeTab ? "nav-pill nav-pill-active" : "nav-pill"}
            onClick={(event) => {
              event.preventDefault();
              onTabChange(tab.id);
            }}
            aria-current={tab.id === activeTab ? "page" : undefined}
          >
            <span>{tab.label}</span>
            <small>{tab.description}</small>
          </a>
        ))}
      </nav>
    </div>
  );
}
