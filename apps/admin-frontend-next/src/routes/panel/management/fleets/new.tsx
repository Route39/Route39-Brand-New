import { PageHeader } from "@/components/panel/PageHeader";
import { FleetForm } from "./form";

export default function NewFleetPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="New Vehicle" description="Register a new vehicle." />
      <FleetForm mode="create" />
    </div>
  );
}
