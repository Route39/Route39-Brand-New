import { PageHeader } from "@/components/panel/PageHeader";
import { ZonePriceForm } from "./form";

export default function NewZonePricePage() {
  return (
    <div className="space-y-6">
      <PageHeader title="New zone price" description="Flat fare between two geo-fences." />
      <ZonePriceForm mode="create" />
    </div>
  );
}
