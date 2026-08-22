import { PageHeader } from "@/components/panel/PageHeader";
import { DriverForm } from "./form";

export default function NewDriverPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="New driver" description="Onboard a new driver." />
      <DriverForm mode="create" />
    </div>
  );
}
