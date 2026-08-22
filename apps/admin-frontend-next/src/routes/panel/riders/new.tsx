import { PageHeader } from "@/components/panel/PageHeader";
import { RiderForm } from "./form";

export default function NewRiderPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="New rider" description="Register a new rider account." />
      <RiderForm mode="create" />
    </div>
  );
}
