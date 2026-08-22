import { PageHeader } from "@/components/panel/PageHeader";
import { ReviewParameterForm } from "./form";

export default function NewReviewParameterPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="New review parameter" description="Create a new feedback chip." />
      <ReviewParameterForm mode="create" />
    </div>
  );
}
