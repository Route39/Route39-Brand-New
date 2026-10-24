import { PageHeader } from "@/components/panel/PageHeader";
import { SurgeZoneForm } from "./form";

export default function NewSurgeZonePage() {
  return (
    <div className="space-y-6">
      <PageHeader title="New surge zone" description="Draw a peak area and set the extra fare." />
      <SurgeZoneForm mode="create" />
    </div>
  );
}
