import { useMutation } from "@apollo/client";
import { useState, type ReactNode } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field } from "@/components/forms/Field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import {
  CREATE_DRIVER_TRANSACTION_MUTATION,
  CREATE_RIDER_TRANSACTION_MUTATION,
} from "@/lib/graphql/documents/admin-actions";

interface Props {
  variant: "driver" | "rider";
  /** ID of the driver or rider whose wallet we're adjusting. */
  userId: string;
  defaultCurrency?: string;
  trigger: ReactNode;
  onSaved?: () => void;
}

const ACTION_OPTIONS = [
  { value: "Recharge", label: "Recharge (credit)" },
  { value: "Deduct", label: "Deduct (debit)" },
];

export function AdjustWalletDialog({ variant, userId, defaultCurrency = "USD", trigger, onSaved }: Props) {
  const [open, setOpen] = useState(false);
  const [action, setAction] = useState<"Recharge" | "Deduct">("Recharge");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState(defaultCurrency);
  const [refNumber, setRefNumber] = useState("");
  const [description, setDescription] = useState("");

  const [createDriverTx, { loading: dLoading }] = useMutation(CREATE_DRIVER_TRANSACTION_MUTATION);
  const [createRiderTx, { loading: rLoading }] = useMutation(CREATE_RIDER_TRANSACTION_MUTATION);
  const loading = dLoading || rLoading;

  function reset() {
    setAction("Recharge");
    setAmount("");
    setRefNumber("");
    setDescription("");
  }

  async function handleSubmit() {
    if (!amount.trim()) {
      toast.error("Enter an amount");
      return;
    }
    const numeric = Number(amount);
    if (Number.isNaN(numeric) || numeric <= 0) {
      toast.error("Amount must be > 0");
      return;
    }
    try {
      const sharedInput = {
        action: action as never,
        amount: numeric,
        currency,
        refrenceNumber: refNumber || null,
        description: description || null,
      };
      if (variant === "driver") {
        await createDriverTx({
          variables: {
            input: {
              ...sharedInput,
              driverId: userId,
              ...(action === "Deduct"
                ? { deductType: "Correction" }
                : { rechargeType: "Correction" }),
            } as never,
          },
        });
      } else {
        await createRiderTx({
          variables: {
            input: {
              ...sharedInput,
              riderId: userId,
              ...(action === "Deduct"
                ? { deductType: "Correction" }
                : { rechargeType: "Correction" }),
            } as never,
          },
        });
      }
      toast.success("Wallet adjusted");
      setOpen(false);
      reset();
      onSaved?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Adjust {variant} wallet</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <Field label="Action" htmlFor="action" required>
            <Select value={action} onValueChange={(v) => setAction(v as "Recharge" | "Deduct")}>
              <SelectTrigger id="action">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ACTION_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Amount" htmlFor="amount" required>
              <Input
                id="amount"
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                autoFocus
              />
            </Field>
            <Field label="Currency" htmlFor="currency" required>
              <Input id="currency" value={currency} onChange={(e) => setCurrency(e.target.value)} />
            </Field>
          </div>
          <Field label="Reference number" htmlFor="ref">
            <Input id="ref" value={refNumber} onChange={(e) => setRefNumber(e.target.value)} />
          </Field>
          <Field label="Description" htmlFor="desc">
            <Textarea
              id="desc"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </Field>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSubmit} disabled={loading}>
            {loading ? <Spinner size="sm" className="text-primary-foreground" /> : "Adjust wallet"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
