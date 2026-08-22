import { useMutation } from "@apollo/client";
import { zodResolver } from "@hookform/resolvers/zod";
import { Trash2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { z } from "zod";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/forms/Field";
import { FormActions, FormSection, FormShell } from "@/components/forms/FormShell";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { CARS_LIST_QUERIES } from "@/lib/graphql/documents/management";
import { useConfirm } from "@/providers/ConfirmProvider";
import {
  CREATE_CAR_COLOR_MUTATION,
  CREATE_CAR_MODEL_MUTATION,
  DELETE_CAR_COLOR_MUTATION,
  DELETE_CAR_MODEL_MUTATION,
  UPDATE_CAR_COLOR_MUTATION,
  UPDATE_CAR_MODEL_MUTATION,
} from "@/lib/graphql/documents/management-detail-2";

const schema = z.object({ name: z.string().min(1, "Name is required") });
type Values = z.infer<typeof schema>;

interface Props {
  mode: "create" | "edit";
  variant: "color" | "model";
  id?: string;
  initialValues?: Values;
}

export function CarForm({ mode, variant, id, initialValues }: Props) {
  const confirm = useConfirm();
  const navigate = useNavigate();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const refetchQueries = [{ query: CARS_LIST_QUERIES }];

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: initialValues ?? { name: "" },
  });

  const [createColor] = useMutation(CREATE_CAR_COLOR_MUTATION, { refetchQueries });
  const [updateColor] = useMutation(UPDATE_CAR_COLOR_MUTATION, { refetchQueries });
  const [deleteColor, { loading: deletingColor }] = useMutation(DELETE_CAR_COLOR_MUTATION, {
    refetchQueries,
  });
  const [createModel] = useMutation(CREATE_CAR_MODEL_MUTATION, { refetchQueries });
  const [updateModel] = useMutation(UPDATE_CAR_MODEL_MUTATION, { refetchQueries });
  const [deleteModel, { loading: deletingModel }] = useMutation(DELETE_CAR_MODEL_MUTATION, {
    refetchQueries,
  });

  const isColor = variant === "color";
  const create = isColor ? createColor : createModel;
  const update = isColor ? updateColor : updateModel;
  const del = isColor ? deleteColor : deleteModel;
  const deleting = isColor ? deletingColor : deletingModel;

  const onSubmit = handleSubmit(async (values) => {
    setSubmitError(null);
    try {
      if (mode === "create") {
        await create({ variables: { input: values } });
        toast.success(`${isColor ? "Color" : "Model"} created`);
      } else if (id) {
        await update({ variables: { id, input: values } });
        toast.success(`${isColor ? "Color" : "Model"} updated`);
      }
      navigate("/management/cars");
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Save failed");
    }
  });

  async function handleDelete() {
    if (
      !id ||
      !(await confirm({
        title: `Delete this ${variant}?`,
        actionLabel: "Delete",
        destructive: true,
      }))
    )
      return;
    try {
      await del({ variables: { id } });
      toast.success(`${isColor ? "Color" : "Model"} deleted`);
      navigate("/management/cars");
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
      <FormSection title={isColor ? "Color" : "Model"}>
        <Field label="Name" htmlFor="name" error={errors.name?.message} required>
          <Input id="name" {...register("name")} />
        </Field>
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
