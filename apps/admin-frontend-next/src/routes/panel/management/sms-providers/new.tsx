import { PageHeader } from "@/components/panel/PageHeader";
import { SmsProviderForm } from "./form";

export default function NewSmsProviderPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="New SMS provider" />
      <SmsProviderForm mode="create" />
    </div>
  );
}
