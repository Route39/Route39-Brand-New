import { PageHeader } from "@/components/panel/PageHeader";
import { FleetForm } from "./form";

export default function NewFleetPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="New fleet" description="Onboard a new fleet partner." />
      <FleetForm mode="create" />
    </div>
  );
}
