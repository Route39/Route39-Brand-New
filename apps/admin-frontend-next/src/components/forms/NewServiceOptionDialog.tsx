import { useMutation } from "@apollo/client";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "lucide-react";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field } from "@/components/forms/Field";
import { FormGrid } from "@/components/forms/FormShell";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { CREATE_SERVICE_OPTION_MUTATION } from "@/lib/graphql/documents/management-detail";
import { SERVICE_OPTIONS_LIST_QUERY } from "@/lib/graphql/documents/management";
import { SERVICE_OPTION_ICONS, SERVICE_OPTION_TYPES } from "@/lib/panel/enum-options";

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  type: z.enum(["Free", "Paid", "TwoWay"]),
  icon: z.string().min(1, "Icon is required"),
  additionalFee: z.string().optional(),
});

type Values = z.infer<typeof schema>;

export function NewServiceOptionDialog() {
  const [open, setOpen] = useState(false);

  const [createOne, { loading }] = useMutation(CREATE_SERVICE_OPTION_MUTATION, {
    refetchQueries: [
      { query: SERVICE_OPTIONS_LIST_QUERY, variables: { sorting: [], filter: {} } as never },
    ],
  });

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", type: "Free", icon: "Pet", additionalFee: "" },
  });

  const onSubmit = handleSubmit(async (values) => {
    const fee = values.additionalFee?.trim();
    try {
      await createOne({
        variables: {
          input: {
            name: values.name,
            type: values.type,
            icon: values.icon as never,
            additionalFee: fee ? Number(fee) : null,
          },
        },
      });
      toast.success("Option created");
      reset();
      setOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Create failed");
    }
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" size="sm">
          <Plus className="size-3.5" />
          New option
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New service option</DialogTitle>
          <DialogDescription>
            Add a new add-on. It becomes available to pick for any service.
          </DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={onSubmit}>
          <Field label="Name" htmlFor="so-name" error={errors.name?.message} required>
            <Input id="so-name" {...register("name")} placeholder="e.g. Pet friendly" />
          </Field>
          <FormGrid>
            <Field label="Type" htmlFor="so-type" error={errors.type?.message} required>
              <Controller
                control={control}
                name="type"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="so-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SERVICE_OPTION_TYPES.map((o) => (
                        <SelectItem key={o.value} value={o.value}>
                          {o.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>
            <Field label="Icon" htmlFor="so-icon" error={errors.icon?.message} required>
              <Controller
                control={control}
                name="icon"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="so-icon">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SERVICE_OPTION_ICONS.map((o) => (
                        <SelectItem key={o.value} value={o.value}>
                          {o.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>
          </FormGrid>
          <Field label="Additional fee" htmlFor="so-fee">
            <Input
              id="so-fee"
              type="number"
              step="0.01"
              placeholder="Optional"
              {...register("additionalFee")}
            />
          </Field>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? <Spinner size="sm" className="text-primary-foreground" /> : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
