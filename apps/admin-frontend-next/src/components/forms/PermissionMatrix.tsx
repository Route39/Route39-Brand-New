import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface PermissionGroup {
  title: string;
  permissions: readonly string[];
}

interface PermissionMatrixProps {
  groups: PermissionGroup[];
  selected: Record<string, string[]>;
  onChange: (group: string, next: string[]) => void;
}

function humanize(perm: string): string {
  return perm
    .replace(/_/g, " ")
    .replace(/\bView\b/i, "view")
    .replace(/\bEdit\b/i, "edit")
    .replace(/\bCreate\b/i, "create");
}

export function PermissionMatrix({ groups, selected, onChange }: PermissionMatrixProps) {
  return (
    <div className="space-y-6">
      {groups.map((group) => {
        const groupSelected = selected[group.title] ?? [];
        const allChecked = group.permissions.every((p) => groupSelected.includes(p));
        const someChecked = group.permissions.some((p) => groupSelected.includes(p));

        return (
          <div key={group.title} className="space-y-2 rounded-md border border-border bg-input/20 p-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">{group.title}</h3>
              <button
                type="button"
                onClick={() =>
                  onChange(
                    group.title,
                    allChecked ? [] : (group.permissions as readonly string[]).slice(),
                  )
                }
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                {allChecked ? "Clear all" : someChecked ? "Select all" : "Select all"}
              </button>
            </div>
            <div className="grid grid-cols-1 gap-1 sm:grid-cols-2 md:grid-cols-3">
              {group.permissions.map((perm) => {
                const isChecked = groupSelected.includes(perm);
                return (
                  <label
                    key={perm}
                    className={cn(
                      "flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1 hover:bg-muted/40",
                      isChecked && "bg-muted/60",
                    )}
                  >
                    <Checkbox
                      checked={isChecked}
                      onCheckedChange={(v) => {
                        const next = v
                          ? Array.from(new Set([...groupSelected, perm]))
                          : groupSelected.filter((p) => p !== perm);
                        onChange(group.title, next);
                      }}
                    />
                    <Label className="cursor-pointer text-xs font-normal capitalize">
                      {humanize(perm)}
                    </Label>
                  </label>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
