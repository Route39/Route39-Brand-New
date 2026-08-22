import { PageHeader } from "@/components/panel/PageHeader";
import { RewardForm } from "./form";

export default function NewRewardPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="New reward" />
      <RewardForm mode="create" />
    </div>
  );
}
