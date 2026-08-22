import { useQuery } from "@apollo/client";
import { useParams } from "react-router-dom";

import { ErrorBlock, LoadingBlock } from "@/components/panel/StateBlock";
import { PageHeader } from "@/components/panel/PageHeader";
import { OPERATOR_QUERY } from "@/lib/graphql/documents/management-detail";
import { formatName } from "@/lib/format";
import { OperatorForm } from "./form";

export default function EditOperatorPage() {
  const { id } = useParams();
  const { data, loading, error } = useQuery(OPERATOR_QUERY, {
    variables: { id: id! },
    skip: !id,
  });

  if (loading && !data) return <LoadingBlock />;
  if (error) return <ErrorBlock message={error.message} />;
  if (!data?.operator) return <ErrorBlock message="User not found." />;

  const o = data.operator;
  return (
    <div className="space-y-6">
      <PageHeader title={formatName(o)} description={`@${o.userName} · #${o.id}`} />
      <OperatorForm
        mode="edit"
        id={o.id}
        initialValues={{
          firstName: o.firstName ?? "",
          lastName: o.lastName ?? "",
          userName: o.userName,
          mobileNumber: o.mobileNumber ?? "",
          email: o.email ?? "",
          roleId: o.roleId ?? "",
          isBlocked: o.isBlocked,
          password: "",
        }}
      />
    </div>
  );
}
