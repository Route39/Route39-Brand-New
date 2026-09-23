import { NavLink, useLocation } from "react-router-dom";
import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";
import { LicenseChip } from "@/components/panel/LicenseChip";
import { NAV, isGroup, type NavEntry, type NavLeaf } from "@/lib/panel/nav";
import { useAuth } from "@/providers/AuthProvider";

function operatorPermissions(perms: string[] | null | undefined): Set<string> {
  return new Set(perms ?? []);
}

const SHARED_TOS: Set<string> = (() => {
  const seen = new Set<string>();
  const shared = new Set<string>();
  const walk = (entries: NavEntry[]) => {
    for (const entry of entries) {
      if (isGroup(entry)) walk(entry.items);
      else if (seen.has(entry.to)) shared.add(entry.to);
      else seen.add(entry.to);
    }
  };
  walk(NAV);
  return shared;
})();

function leafVisible(leaf: NavLeaf, owned: Set<string>, hasRole: boolean): boolean {
  if (!leaf.perm || leaf.perm.length === 0) return true;
  if (!hasRole) return true;
  return leaf.perm.some((p) => owned.has(p));
}

function leafIsActive(leaf: NavLeaf, pathname: string, search: string): boolean {
  const pathMatches = pathname === leaf.to || pathname.startsWith(leaf.to + "/");
  if (!pathMatches) return false;
  if (!SHARED_TOS.has(leaf.to) || !leaf.search) return true;
  const leafParams = new URLSearchParams(leaf.search.replace(/^\?/, ""));
  const currentParams = new URLSearchParams(search.replace(/^\?/, ""));
  for (const [key, value] of leafParams) {
    if (currentParams.get(key) !== value) return false;
  }
  return true;
}

function NavLeafLink({ leaf, onClick }: { leaf: NavLeaf; onClick?: () => void }) {
  const { t } = useTranslation();
  const { pathname, search } = useLocation();
  const Icon = leaf.icon;
  const path = leaf.to + (leaf.search ?? "");
  const isActive = leafIsActive(leaf, pathname, search);
  return (
    <NavLink
      to={path}
      end={false}
      onClick={onClick}
      className={cn(
        "relative flex items-center gap-2.5 rounded-md px-3 py-1.5 text-sm text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
        isActive &&
          "bg-sidebar-accent text-sidebar-accent-foreground before:absolute before:top-1.5 before:bottom-1.5 before:-left-1 before:w-[2px] before:rounded-full before:bg-[#c62828]",
      )}
    >
      {Icon ? <Icon className="size-4 shrink-0" /> : null}
      <span className="truncate">{t(leaf.label)}</span>
    </NavLink>
  );
}

function NavGroupBlock({
  entry,
  owned,
  hasRole,
  onNavigate,
}: {
  entry: Extract<NavEntry, { items: NavLeaf[] }>;
  owned: Set<string>;
  hasRole: boolean;
  onNavigate?: () => void;
}) {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const Icon = entry.icon;
  const items = entry.items.filter((leaf) => leafVisible(leaf, owned, hasRole));
  const containsActive = items.some((leaf) => pathname.startsWith(leaf.to));
  const [open, setOpen] = useState(containsActive);
  if (items.length === 0) return null;

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-2 rounded-md px-3 py-1.5 text-xs font-medium tracking-[0.08em] uppercase text-sidebar-foreground/60 hover:text-sidebar-foreground"
      >
        <span className="flex items-center gap-2">
          {Icon ? <Icon className="size-4" /> : null}
          {t(entry.label)}
        </span>
        <ChevronDown
          className={cn("size-3.5 transition-transform", !open && "-rotate-90")}
        />
      </button>
      {open ? (
        <div className="mt-1 ml-1 flex flex-col gap-0.5 border-l border-sidebar-border pl-2">
          {items.map((leaf) => (
            <NavLeafLink key={leaf.to + (leaf.search ?? "")} leaf={leaf} onClick={onNavigate} />
          ))}
        </div>
      ) : null}
    </div>
  );
}

/**
 * Inner sidebar content reused by the desktop `<aside>` and the mobile drawer.
 */
export function PanelSidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const { user } = useAuth();
  const hasRole = Boolean(user?.role);
  const owned = operatorPermissions(user?.role?.permissions as string[] | undefined);

  const visible = NAV.filter((entry) => {
    if (isGroup(entry)) {
      return entry.items.some((leaf) => leafVisible(leaf, owned, hasRole));
    }
    return leafVisible(entry, owned, hasRole);
  });

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-col gap-1.5 border-b border-sidebar-border/60 px-4 py-2.5">
        <div className="flex items-center gap-2.5">
          <img
            src={`${import.meta.env.BASE_URL}route39_logo.png`}
            alt="Route39"
            className="h-8 w-auto dark:hidden"
          />
          <img
            src={`${import.meta.env.BASE_URL}route39_logo_dark.png`}
            alt="Route39"
            className="hidden h-8 w-auto dark:block"
          />
        </div>
        <div className="text-[0.6rem] leading-tight text-muted-foreground">
          <div className="uppercase tracking-wide">Powered by</div>
          <div className="font-semibold uppercase tracking-wide text-foreground">
            Attendy Technologies Private Limited
          </div>
        </div>
      </div>
      <nav className="flex-1 overflow-y-auto px-3 py-3">
        <div className="flex flex-col gap-1">
          {visible.map((entry) =>
            isGroup(entry) ? (
              <NavGroupBlock
                key={entry.label}
                entry={entry}
                owned={owned}
                hasRole={hasRole}
                onNavigate={onNavigate}
              />
            ) : (
              <NavLeafLink
                key={entry.to + (entry.search ?? "")}
                leaf={entry}
                onClick={onNavigate}
              />
            ),
          )}
        </div>
      </nav>
      <div className="border-t border-sidebar-border px-3 py-3">
        <LicenseChip />
      </div>
    </div>
  );
}

export function PanelSidebar() {
  return (
    <aside className="hidden w-60 shrink-0 border-r border-sidebar-border bg-sidebar text-sidebar-foreground md:flex md:flex-col">
      <PanelSidebarContent />
    </aside>
  );
}
