import { PageHeader } from "@/components/panel/PageHeader";
import { OperatorRoleForm } from "./form";

export default function NewUserRolePage() {
  return (
    <div className="space-y-6">
      <PageHeader title="New user role" description="Define a new permission profile." />
      <OperatorRoleForm mode="create" />
    </div>
  );
}
