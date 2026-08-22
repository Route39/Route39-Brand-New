import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { useState, type ReactNode } from "react";

import { cn } from "@/lib/utils";

interface DetailHeaderProps {
  backTo: string;
  backLabel?: string;
  title: ReactNode;
  subtitle?: ReactNode;
  badges?: ReactNode;
  avatar?: ReactNode;
  actions?: ReactNode;
  className?: string;
}

export function DetailHeader({
  backTo,
  backLabel = "Back",
  title,
  subtitle,
  badges,
  avatar,
  actions,
  className,
}: DetailHeaderProps) {
  return (
    <div className={cn("space-y-3", className)}>
      <Link
        to={backTo}
        className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" />
        {backLabel}
      </Link>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          {avatar}
          <div className="space-y-1.5">
            <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
            {subtitle ? (
              <div className="text-sm text-muted-foreground">{subtitle}</div>
            ) : null}
            {badges ? <div className="flex flex-wrap items-center gap-1.5">{badges}</div> : null}
          </div>
        </div>
        {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
      </div>
    </div>
  );
}

interface AvatarProps {
  src?: string | null;
  alt?: string;
  fallback?: string;
  className?: string;
}

export function Avatar({ src, alt, fallback, className }: AvatarProps) {
  const initials = (fallback ?? alt ?? "?").trim().slice(0, 2).toUpperCase();
  const [errored, setErrored] = useState(false);
  const showImage = Boolean(src) && !errored;
  return (
    <div
      className={cn(
        "grid size-14 shrink-0 place-items-center overflow-hidden rounded-full bg-muted text-sm font-medium uppercase text-muted-foreground ring-1 ring-foreground/10",
        className,
      )}
    >
      {showImage ? (
        <img
          src={src!}
          alt={alt}
          className="h-full w-full object-cover"
          onError={() => setErrored(true)}
        />
      ) : (
        <span>{initials}</span>
      )}
    </div>
  );
}
