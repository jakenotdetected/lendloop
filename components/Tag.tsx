import type { ReactNode } from "react";

export function Tag({ children, className = "", busy = false }: { children: ReactNode; className?: string; busy?: boolean }) {
  return (
    <article className={`tag ${busy ? "is-busy" : ""} ${className}`}>
      <div className="tag-body">
        <span className="tag-hole" aria-hidden />
        {children}
      </div>
    </article>
  );
}

export function Stamp({ tone, children }: { tone: string; children: ReactNode }) {
  return <span className={`stamp stamp-${tone}`}>{children}</span>;
}
