import { PageHeader } from "@/components/panel/PageHeader";
import { RegionForm } from "./form";

export default function NewRegionPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="New region" description="Define a new geographic operating zone." />
      <RegionForm mode="create" />
    </div>
  );
}
