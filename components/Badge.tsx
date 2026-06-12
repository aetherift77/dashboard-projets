import type { ReactNode } from "react";

// Badge réutilisable (pilule arrondie). La couleur est fournie via className.
export default function Badge({
  children, className = "", title,
}: {
  children: ReactNode;
  className?: string;
  title?: string;
}) {
  return (
    <span
      title={title}
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-wide ${className}`}
    >
      {children}
    </span>
  );
}
