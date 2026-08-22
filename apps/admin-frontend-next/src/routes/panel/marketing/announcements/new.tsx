import { PageHeader } from "@/components/panel/PageHeader";
import { AnnouncementForm } from "./form";

export default function NewAnnouncementPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="New announcement" />
      <AnnouncementForm mode="create" />
    </div>
  );
}
