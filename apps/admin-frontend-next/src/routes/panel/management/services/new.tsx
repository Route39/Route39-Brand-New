import { PageHeader } from "@/components/panel/PageHeader";
import { ServiceForm } from "./form";

export default function NewServicePage() {
  return (
    <div className="space-y-6">
      <PageHeader title="New service" description="A ride or delivery service riders can request." />
      <ServiceForm mode="create" />
    </div>
  );
}
