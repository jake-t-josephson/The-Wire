import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "../../lib/cn";

export function PageContainer({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <main className={cn("page-container", className)} {...props} />;
}

export function PageHeader({ leading, eyebrow, title, actions, className }: {
  leading?: ReactNode;
  eyebrow?: ReactNode;
  title: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <header className={cn("page-header", className)}>
      {leading && <div className="flex-none">{leading}</div>}
      <div>{eyebrow}<h1 className="page-title">{title}</h1></div>
      {actions && <div className="page-header__actions">{actions}</div>}
    </header>
  );
}
