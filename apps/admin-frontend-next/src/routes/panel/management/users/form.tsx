import { useMutation, useQuery } from "@apollo/client";
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
import { FormActions, FormGrid, FormSection, FormShell } from "@/components/forms/FormShell";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { SwitchField } from "@/components/forms/SwitchField";
import { OPERATOR_ROLES_LIST_QUERY, OPERATORS_LIST_QUERY } from "@/lib/graphql/documents/management";
import { useConfirm } from "@/providers/ConfirmProvider";
import {
  CREATE_OPERATOR_MUTATION,
  DELETE_OPERATOR_MUTATION,
  UPDATE_OPERATOR_MUTATION,
} from "@/lib/graphql/documents/management-detail";

const baseShape = {
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  userName: z.string().min(1, "Username is required"),
  mobileNumber: z.string().min(1, "Phone is required"),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  roleId: z.string().min(1, "Role is required"),
  isBlocked: z.boolean(),
};

const createSchema = z.object({
  ...baseShape,
  password: z.string().min(6, "Password must be 6+ characters"),
});

const editSchema = z.object({
  ...baseShape,
  password: z.string().optional(),
});

type CreateValues = z.infer<typeof createSchema>;
type EditValues = z.infer<typeof editSchema>;

interface Props {
  mode: "create" | "edit";
  id?: string;
  initialValues?: EditValues;
}

export function OperatorForm({ mode, id, initialValues }: Props) {
  const confirm = useConfirm();
  const navigate = useNavigate();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const { data: rolesData } = useQuery(OPERATOR_ROLES_LIST_QUERY, {
    variables: { sorting: [], filter: {} } as never,
  });
  const roles = rolesData?.operatorRoles ?? [];

  const refetchQueries = [
    {
      query: OPERATORS_LIST_QUERY,
      variables: { paging: { limit: 10, offset: 0 }, sorting: [], filter: {} } as never,
    },
  ];

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<CreateValues | EditValues>({
    resolver: zodResolver(mode === "create" ? createSchema : editSchema) as never,
    defaultValues: initialValues ?? {
      firstName: "",
      lastName: "",
      userName: "",
      mobileNumber: "",
      email: "",
      roleId: "",
      isBlocked: false,
      password: "",
    },
  });

  const [createOne] = useMutation(CREATE_OPERATOR_MUTATION, { refetchQueries });
  const [updateOne] = useMutation(UPDATE_OPERATOR_MUTATION, { refetchQueries });
  const [deleteOne, { loading: deleting }] = useMutation(DELETE_OPERATOR_MUTATION, {
    refetchQueries,
  });

  const onSubmit = handleSubmit(async (values) => {
    setSubmitError(null);
    try {
      if (mode === "create") {
        const v = values as CreateValues;
        await createOne({
          variables: {
            input: {
              firstName: v.firstName || null,
              lastName: v.lastName || null,
              userName: v.userName,
              password: v.password,
              mobileNumber: v.mobileNumber,
              email: v.email || null,
              roleId: v.roleId,
            },
          },
        });
        toast.success("User created");
      } else if (id) {
        const v = values as EditValues;
        const input: Record<string, unknown> = {
          firstName: v.firstName || null,
          lastName: v.lastName || null,
          userName: v.userName,
          mobileNumber: v.mobileNumber,
          email: v.email || null,
          roleId: v.roleId,
          isBlocked: v.isBlocked,
        };
        if (v.password) input.password = v.password;
        await updateOne({ variables: { id, input } });
        toast.success("User updated");
      }
      navigate("/management/users");
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Save failed");
    }
  });

  async function handleDelete() {
    if (!id || !(await confirm({ title: "Delete this user?", actionLabel: "Delete", destructive: true }))) return;
    try {
      await deleteOne({ variables: { id } });
      toast.success("User deleted");
      navigate("/management/users");
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

      <FormSection title="Profile">
        <FormGrid>
          <Field label="First name" htmlFor="firstName">
            <Input id="firstName" {...register("firstName")} />
          </Field>
          <Field label="Last name" htmlFor="lastName">
            <Input id="lastName" {...register("lastName")} />
          </Field>
        </FormGrid>
        <FormGrid>
          <Field label="Username" htmlFor="userName" error={errors.userName?.message} required>
            <Input id="userName" {...register("userName")} />
          </Field>
          <Field label="Mobile number" htmlFor="mobileNumber" error={errors.mobileNumber?.message} required>
            <Input id="mobileNumber" {...register("mobileNumber")} />
          </Field>
        </FormGrid>
        <Field label="Email" htmlFor="email" error={errors.email?.message}>
          <Input id="email" type="email" {...register("email")} />
        </Field>
      </FormSection>

      <FormSection title="Access" description="Role and account state.">
        <Field label="Role" htmlFor="roleId" error={errors.roleId?.message} required>
          <Controller
            control={control}
            name="roleId"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id="roleId">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </Field>
        <Field
          label={mode === "create" ? "Password" : "New password (leave blank to keep current)"}
          htmlFor="password"
          error={(errors as { password?: { message?: string } }).password?.message}
          required={mode === "create"}
        >
          <Input id="password" type="password" {...register("password")} autoComplete="new-password" />
        </Field>
        {mode === "edit" ? (
          <Controller
            control={control}
            name="isBlocked"
            render={({ field }) => (
              <SwitchField
                label="Blocked"
                description="Prevents this user from signing in."
                checked={field.value}
                onChange={field.onChange}
              />
            )}
          />
        ) : null}
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
