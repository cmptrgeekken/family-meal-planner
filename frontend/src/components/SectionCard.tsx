import type { ReactNode } from "react";

type SectionCardProps = {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  className?: string;
  children: ReactNode;
};

export function SectionCard({ title, subtitle, actions, className, children }: SectionCardProps) {
  return (
    <section className={className ? `section-card ${className}` : "section-card"}>
      <header className="section-card-header">
        <div>
          <h2>{title}</h2>
          {subtitle ? <p>{subtitle}</p> : null}
        </div>
        {actions ? <div>{actions}</div> : null}
      </header>
      <div className="section-card-body">{children}</div>
    </section>
  );
}
