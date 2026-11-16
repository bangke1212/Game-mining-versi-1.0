"use client";
import type { Activity } from "lucide-react";

export const fmtRlt = (n: number) => `${Math.floor(n).toLocaleString("en-US")} RLT`;
export const fmtGh = (n: number) => `${n.toLocaleString("en-US", { maximumFractionDigits: 1 })} GH/s`;
export const fmtCoin = (n: number, decimals: number) =>
  n.toLocaleString("en-US", { minimumFractionDigits: Math.min(decimals, 4), maximumFractionDigits: Math.min(decimals, 6) });

export function Badge({ children, tone = "mint" }: { children: React.ReactNode; tone?: string }) {
  return (
    <span className={`badge ${tone}`}>
      <i />
      {children}
    </span>
  );
}

export function SectionTitle({ eyebrow, title, action }: { eyebrow: string; title: string; action?: React.ReactNode }) {
  return (
    <div className="section-title">
      <div>
        <span className="eyebrow">{eyebrow}</span>
        <h2>{title}</h2>
      </div>
      {action}
    </div>
  );
}

export function MetricCard({ label, value, sub, icon: Icon, tone = "mint" }: { label: string; value: string; sub: string; icon: typeof Activity; tone?: string }) {
  return (
    <article className={`metric-card ${tone}`}>
      <div className="metric-icon">
        <Icon size={16} />
      </div>
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{sub}</small>
    </article>
  );
}

export function Note({ children }: { children: React.ReactNode }) {
  return <div className="rc-note">{children}</div>;
}
