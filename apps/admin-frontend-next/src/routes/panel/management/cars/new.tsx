import { useState } from "react";

import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/panel/PageHeader";
import { CarForm } from "./form";

export default function NewCarPage() {
  const [variant, setVariant] = useState<"color" | "model">("color");

  return (
    <div className="space-y-6">
      <PageHeader title={`New car ${variant}`} description="Add a vehicle attribute drivers can choose from." />
      <div className="inline-flex rounded-md border border-border bg-muted/40 p-0.5 text-xs">
        <Button
          type="button"
          size="sm"
          variant={variant === "color" ? "secondary" : "ghost"}
          onClick={() => setVariant("color")}
        >
          Color
        </Button>
        <Button
          type="button"
          size="sm"
          variant={variant === "model" ? "secondary" : "ghost"}
          onClick={() => setVariant("model")}
        >
          Model
        </Button>
      </div>
      <CarForm key={variant} mode="create" variant={variant} />
    </div>
  );
}
