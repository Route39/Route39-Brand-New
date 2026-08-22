import { PageHeader } from "@/components/panel/PageHeader";
import { OperatorForm } from "./form";

export default function NewOperatorPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="New user" description="Invite a new admin operator." />
      <OperatorForm mode="create" />
    </div>
  );
}
