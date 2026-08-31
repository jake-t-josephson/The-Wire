import type { HTMLAttributes } from "react";
import { cn } from "../../lib/cn";

export function SportDashboardLayout({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("sport-dashboard-layout", className)} {...props} />;
}

export function SportDashboardMain({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("sport-dashboard-layout__main", className)} {...props} />;
}

export function SportDashboardRail({ className, ...props }: HTMLAttributes<HTMLElement>) {
  return <aside className={cn("sport-dashboard-layout__rail", className)} {...props} />;
}
