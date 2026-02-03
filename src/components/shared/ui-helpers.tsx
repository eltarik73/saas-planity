"use client";

import { cn } from "@/lib/utils";
import { formatPrice, formatDuration } from "@/lib/date-utils";
import { Badge } from "@/components/ui/forms";
import type { BookingStatus } from "@prisma/client";

// ─── Loading Spinner ────────────────────────
export function Spinner({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center justify-center py-12", className)}>
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
    </div>
  );
}

export function PageLoader() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="text-center">
        <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="mt-4 text-sm text-muted-foreground">Chargement…</p>
      </div>
    </div>
  );
}

// ─── Empty State ────────────────────────────
interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {icon && <div className="mb-4 text-muted-foreground">{icon}</div>}
      <h3 className="text-lg font-semibold">{title}</h3>
      {description && <p className="mt-1 max-w-md text-sm text-muted-foreground">{description}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

// ─── Error Message ──────────────────────────
export function ErrorMessage({ message, retry }: { message: string; retry?: () => void }) {
  return (
    <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-center">
      <p className="text-sm text-destructive">{message}</p>
      {retry && (
        <button onClick={retry} className="mt-2 text-sm font-medium text-primary hover:underline">
          Réessayer
        </button>
      )}
    </div>
  );
}

// ─── Price Tag ──────────────────────────────
export function PriceTag({ cents, className }: { cents: number; className?: string }) {
  return <span className={cn("font-semibold tabular-nums text-primary", className)}>{formatPrice(cents)}</span>;
}

// ─── Duration Tag ───────────────────────────
export function DurationTag({ minutes, className }: { minutes: number; className?: string }) {
  return <span className={cn("text-muted-foreground", className)}>{formatDuration(minutes)}</span>;
}

// ─── Status Badge ───────────────────────────
const STATUS_CONFIG: Record<BookingStatus, { label: string; variant: "default" | "secondary" | "destructive" | "success" | "warning" | "outline" }> = {
  PENDING: { label: "En attente", variant: "warning" },
  CONFIRMED: { label: "Confirmée", variant: "default" },
  IN_PROGRESS: { label: "En cours", variant: "secondary" },
  COMPLETED: { label: "Terminée", variant: "success" },
  CANCELLED: { label: "Annulée", variant: "destructive" },
  NO_SHOW: { label: "Absent", variant: "outline" },
};

export function StatusBadge({ status }: { status: BookingStatus }) {
  const config = STATUS_CONFIG[status];
  return <Badge variant={config.variant}>{config.label}</Badge>;
}

// ─── Section Container ──────────────────────
export function Section({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <section className={cn("mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8", className)}>{children}</section>;
}

// ─── Section Header ─────────────────────────
export function SectionHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-8 flex items-start justify-between">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
        {description && <p className="mt-1 text-muted-foreground">{description}</p>}
      </div>
      {action}
    </div>
  );
}
