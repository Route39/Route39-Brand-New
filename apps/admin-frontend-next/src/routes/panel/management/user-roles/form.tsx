import { useMutation } from "@apollo/client";
import { zodResolver } from "@hookform/resolvers/zod";
import { Trash2 } from "lucide-react";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { z } from "zod";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/forms/Field";
import { FormActions, FormSection, FormShell } from "@/components/forms/FormShell";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { PermissionMatrix } from "@/components/forms/PermissionMatrix";
import {
  APP_TYPES,
  OPERATOR_PERMISSIONS,
  PARKING_PERMISSIONS,
  SHOP_PERMISSIONS,
  TAXI_PERMISSIONS,
} from "@/lib/panel/enum-options";
import { OPERATOR_ROLES_LIST_QUERY } from "@/lib/graphql/documents/management";
import { useConfirm } from "@/providers/ConfirmProvider";
import {
  CREATE_OPERATOR_ROLE_MUTATION,
  DELETE_OPERATOR_ROLE_MUTATION,
  UPDATE_OPERATOR_ROLE_MUTATION,
} from "@/lib/graphql/documents/management-detail";

const schema = z.object({
  title: z.string().min(1, "Title is required"),
  permissions: z.array(z.string()),
  taxiPermissions: z.array(z.string()),
  shopPermissions: z.array(z.string()),
  parkingPermissions: z.array(z.string()),
  allowedApps: z.array(z.string()),
});

type Values = z.infer<typeof schema>;

interface Props {
  mode: "create" | "edit";
  id?: string;
  initialValues?: Values;
}

export function OperatorRoleForm({ mode, id, initialValues }: Props) {
  const confirm = useConfirm();
  const navigate = useNavigate();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const refetchQueries = [
    { query: OPERATOR_ROLES_LIST_QUERY, variables: { sorting: [], filter: {} } as never },
  ];

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: initialValues ?? {
      title: "",
      permissions: [],
      taxiPermissions: [],
      shopPermissions: [],
      parkingPermissions: [],
      allowedApps: ["Taxi"],
    },
  });

  const [createOne] = useMutation(CREATE_OPERATOR_ROLE_MUTATION, { refetchQueries });
  const [updateOne] = useMutation(UPDATE_OPERATOR_ROLE_MUTATION, { refetchQueries });
  const [deleteOne, { loading: deleting }] = useMutation(DELETE_OPERATOR_ROLE_MUTATION, {
    refetchQueries,
  });

  const onSubmit = handleSubmit(async (values) => {
    setSubmitError(null);
    const input = {
      title: values.title,
      permissions: values.permissions as never,
      taxiPermissions: values.taxiPermissions as never,
      shopPermissions: values.shopPermissions as never,
      parkingPermissions: values.parkingPermissions as never,
      allowedApps: values.allowedApps as never,
    };
    try {
      if (mode === "create") {
        await createOne({ variables: { input } });
        toast.success("Role created");
      } else if (id) {
        await updateOne({ variables: { id, input } });
        toast.success("Role updated");
      }
      navigate("/management/user-roles");
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Save failed");
    }
  });

  async function handleDelete() {
    if (!id || !(await confirm({ title: "Delete this role?", actionLabel: "Delete", destructive: true }))) return;
    try {
      await deleteOne({ variables: { id } });
      toast.success("Role deleted");
      navigate("/management/user-roles");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed");
    }
  }

  return (
    <FormShell onSubmit={onSubmit}>
      {submitError ? (
        <Alert variant="destructive">
          <AlertDescription>{submitError}</AlertDescription>
        </Alert>
      ) : null}

      <FormSection title="Role" description="Display name shown when assigning users.">
        <Field label="Title" htmlFor="title" error={errors.title?.message} required>
          <Input id="title" {...register("title")} placeholder="e.g. Support agent" />
        </Field>
      </FormSection>

      <FormSection title="Allowed apps" description="Which products this role can sign into.">
        <Controller
          control={control}
          name="allowedApps"
          render={({ field }) => (
            <div className="flex flex-wrap gap-3">
              {APP_TYPES.map((app) => {
                const checked = field.value.includes(app.value);
                return (
                  <label
                    key={app.value}
                    className="flex cursor-pointer items-center gap-2 rounded-md border border-border bg-input/30 px-3 py-1.5"
                  >
                    <Checkbox
                      checked={checked}
                      onCheckedChange={(v) => {
                        const next = v
                          ? [...field.value, app.value]
                          : field.value.filter((x: string) => x !== app.value);
                        field.onChange(next);
                      }}
                    />
                    <Label className="cursor-pointer text-sm font-normal">{app.label}</Label>
                  </label>
                );
              })}
            </div>
          )}
        />
      </FormSection>

      <FormSection
        title="Permissions"
        description="Granular access by area. Only the apps selected above are enforced."
      >
        <Controller
          control={control}
          name="permissions"
          render={({ field: admin }) => (
            <Controller
              control={control}
              name="taxiPermissions"
              render={({ field: taxi }) => (
                <Controller
                  control={control}
                  name="shopPermissions"
                  render={({ field: shop }) => (
                    <Controller
                      control={control}
                      name="parkingPermissions"
                      render={({ field: parking }) => (
                        <PermissionMatrix
                          groups={[
                            { title: "Admin", permissions: OPERATOR_PERMISSIONS },
                            { title: "Taxi", permissions: TAXI_PERMISSIONS },
                            { title: "Shop", permissions: SHOP_PERMISSIONS },
                            { title: "Parking", permissions: PARKING_PERMISSIONS },
                          ]}
                          selected={{
                            Admin: admin.value,
                            Taxi: taxi.value,
                            Shop: shop.value,
                            Parking: parking.value,
                          }}
                          onChange={(group, next) => {
                            if (group === "Admin") admin.onChange(next);
                            if (group === "Taxi") taxi.onChange(next);
                            if (group === "Shop") shop.onChange(next);
                            if (group === "Parking") parking.onChange(next);
                          }}
                        />
                      )}
                    />
                  )}
                />
              )}
            />
          )}
        />
      </FormSection>

      <FormActions>
        {mode === "edit" ? (
          <Button
            type="button"
            variant="ghost"
            className="mr-auto text-destructive hover:bg-destructive/10 hover:text-destructive"
            onClick={handleDelete}
            disabled={deleting}
          >
            <Trash2 className="size-4" />
            Delete
          </Button>
        ) : null}
        <Button type="button" variant="outline" onClick={() => navigate(-1)}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? <Spinner size="sm" className="text-primary-foreground" /> : "Save"}
        </Button>
      </FormActions>
    </FormShell>
  );
}
