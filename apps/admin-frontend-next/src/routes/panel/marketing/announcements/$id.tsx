import { useQuery } from "@apollo/client";
import { useParams } from "react-router-dom";

import { ErrorBlock, LoadingBlock } from "@/components/panel/StateBlock";
import { PageHeader } from "@/components/panel/PageHeader";
import { ANNOUNCEMENT_QUERY } from "@/lib/graphql/documents/marketing-detail";
import { AnnouncementForm } from "./form";

export default function EditAnnouncementPage() {
  const { id } = useParams();
  const { data, loading, error } = useQuery(ANNOUNCEMENT_QUERY, {
    variables: { id: id! },
    skip: !id,
  });
  if (loading && !data) return <LoadingBlock />;
  if (error) return <ErrorBlock message={error.message} />;
  if (!data?.announcement) return <ErrorBlock message="Announcement not found." />;
  const a = data.announcement;
  return (
    <div className="space-y-6">
      <PageHeader title={a.title} />
      <AnnouncementForm
        mode="edit"
        id={a.id}
        initialValues={{
          title: a.title,
          description: a.description ?? "",
          url: a.url ?? "",
          userType: a.userType as string[],
          appType: a.appType ?? "Taxi",
          startAt: a.startAt ? new Date(a.startAt).toISOString().slice(0, 16) : "",
          expireAt: a.expireAt ? new Date(a.expireAt).toISOString().slice(0, 16) : "",
        }}
      />
    </div>
  );
}
