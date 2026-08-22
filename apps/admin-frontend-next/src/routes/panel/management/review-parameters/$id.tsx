import { useQuery } from "@apollo/client";
import { useParams } from "react-router-dom";

import { ErrorBlock, LoadingBlock } from "@/components/panel/StateBlock";
import { PageHeader } from "@/components/panel/PageHeader";
import { REVIEW_PARAMETER_QUERY } from "@/lib/graphql/documents/management-detail";
import { ReviewParameterForm } from "./form";

export default function EditReviewParameterPage() {
  const { id } = useParams();
  const { data, loading, error } = useQuery(REVIEW_PARAMETER_QUERY, {
    variables: { id: id! },
    skip: !id,
  });

  if (loading && !data) return <LoadingBlock />;
  if (error) return <ErrorBlock message={error.message} />;
  if (!data?.feedbackParameter) return <ErrorBlock message="Parameter not found." />;

  const p = data.feedbackParameter;
  return (
    <div className="space-y-6">
      <PageHeader title={p.title} description={`Review parameter #${p.id}`} />
      <ReviewParameterForm
        mode="edit"
        id={p.id}
        initialValues={{ title: p.title, isGood: p.isGood }}
      />
    </div>
  );
}
