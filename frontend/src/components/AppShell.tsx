import { useEffect, useState, type ReactNode } from "react";

import type { AppTab } from "../app/App";

type AppShellProps = {
  activeTab: AppTab;
  onTabChange: (tab: AppTab) => void;
  weekNavigator?: ReactNode;
  children: ReactNode;
};

const tabs: Array<{ id: AppTab; label: string; description: string; href: string }> = [
  { id: "plan", label: "Plan", description: "Weekly dinner flow", href: "/plan" },
  { id: "meals", label: "Meals", description: "Browse and filter", href: "/meals" },
  { id: "grocery", label: "Grocery", description: "Shopping preview", href: "/grocery" },
  { id: "magnets", label: "Magnets", description: "SVG exports", href: "/magnets" },
  { id: "settings", label: "Settings", description: "Reference data", href: "/settings" },
];

export function AppShell({ activeTab, onTabChange, weekNavigator, children }: AppShellProps) {
  const [isDesktopNavCompact, setIsDesktopNavCompact] = useState(false);

  useEffect(() => {
    function handleScroll() {
      setIsDesktopNavCompact(window.scrollY > 24);
    }

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="app-shell">
      <header className={isDesktopNavCompact ? "app-header app-header-compact" : "app-header"}>
        <div className="app-brand">
          <div>
            <p className="eyebrow">Family Meal Planner</p>
            <h1>Plan meals without the weekly scramble.</h1>
            <p className="app-header-copy">Self-hosted weekly planning, grocery output, and practical meal maintenance.</p>
          </div>
          <div className="header-badge">Local-first and family-friendly</div>
        </div>
      </header>

      <div className={isDesktopNavCompact ? "desktop-nav-shell desktop-nav-shell-compact" : "desktop-nav-shell"}>
        <nav className={isDesktopNavCompact ? "desktop-nav desktop-nav-compact" : "desktop-nav"} aria-label="Primary">
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

      {weekNavigator ? <div className="week-navigator-shell">{weekNavigator}</div> : null}

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
