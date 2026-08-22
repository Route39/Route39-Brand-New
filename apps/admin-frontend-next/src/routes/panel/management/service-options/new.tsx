import { PageHeader } from "@/components/panel/PageHeader";
import { ServiceOptionForm } from "./form";

export default function NewServiceOptionPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="New service option" />
      <ServiceOptionForm mode="create" />
    </div>
  );
}
