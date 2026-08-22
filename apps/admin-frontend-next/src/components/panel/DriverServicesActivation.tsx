import { useMutation, useQuery } from "@apollo/client";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { LoadingBlock } from "@/components/panel/StateBlock";
import { Spinner } from "@/components/ui/spinner";
import {
  DRIVER_SERVICE_ACTIVATION_QUERY,
  SET_ACTIVATED_SERVICES_MUTATION,
} from "@/lib/graphql/documents/extras";

export function DriverServicesActivation({ driverId }: { driverId: string }) {
  const { data, loading } = useQuery(DRIVER_SERVICE_ACTIVATION_QUERY, {
    variables: { driverId },
  });
  const [setServices, { loading: saving }] = useMutation(SET_ACTIVATED_SERVICES_MUTATION, {
    refetchQueries: [
      { query: DRIVER_SERVICE_ACTIVATION_QUERY, variables: { driverId } },
    ],
  });

  const allServices = data?.services ?? [];
  const enabled = data?.driver.enabledServices ?? [];

  const [selected, setSelected] = useState<Set<string>>(new Set());

  // Sync local state when query data lands.
  useEffect(() => {
    setSelected(
      new Set(
        enabled.filter((e) => e.driverEnabled).map((e) => e.serviceId),
      ),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  if (loading && !data) return <LoadingBlock />;

  const initial = new Set(
    enabled.filter((e) => e.driverEnabled).map((e) => e.serviceId),
  );
  const isDirty =
    selected.size !== initial.size ||
    [...selected].some((id) => !initial.has(id));

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleSave() {
    try {
      await setServices({
        variables: {
          input: { driverId, serviceIds: [...selected] },
        },
      });
      toast.success("Services updated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Activated services</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {allServices.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No services configured. Add services under Management → Services.
          </p>
        ) : (
          <ul className="space-y-1">
            {allServices.map((s) => {
              const isOn = selected.has(s.id);
              return (
                <li key={s.id}>
                  <label className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 hover:bg-muted/40">
                    <Checkbox checked={isOn} onCheckedChange={() => toggle(s.id)} />
                    <Label className="cursor-pointer text-sm font-normal">{s.name}</Label>
                  </label>
                </li>
              );
            })}
          </ul>
        )}
        <div className="flex justify-end">
          <Button
            type="button"
            size="sm"
            onClick={handleSave}
            disabled={!isDirty || saving}
          >
            {saving ? <Spinner size="sm" className="text-primary-foreground" /> : "Save"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
