import { PageHeader } from "@/components/panel/PageHeader";
import { DriverForm } from "../../drivers/form";

export default function NewFleetPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="New Vehicle"
        description="Register a new vehicle."
      />
      <DriverForm mode="create" redirectTo="/management/fleets" />
    </div>
  );
}
