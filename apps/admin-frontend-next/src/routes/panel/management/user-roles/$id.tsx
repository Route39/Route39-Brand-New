import { useQuery } from "@apollo/client";
import { useParams } from "react-router-dom";

import { ErrorBlock, LoadingBlock } from "@/components/panel/StateBlock";
import { PageHeader } from "@/components/panel/PageHeader";
import { OPERATOR_ROLE_QUERY } from "@/lib/graphql/documents/management-detail";
import { OperatorRoleForm } from "./form";

export default function EditUserRolePage() {
  const { id } = useParams();
  const { data, loading, error } = useQuery(OPERATOR_ROLE_QUERY, {
    variables: { id: id! },
    skip: !id,
  });

  if (loading && !data) return <LoadingBlock />;
  if (error) return <ErrorBlock message={error.message} />;
  if (!data?.operatorRole) return <ErrorBlock message="Role not found." />;

  const r = data.operatorRole;
  return (
    <div className="space-y-6">
      <PageHeader title={r.title} description={`Role #${r.id}`} />
      <OperatorRoleForm
        mode="edit"
        id={r.id}
        initialValues={{
          title: r.title,
          permissions: r.permissions as string[],
          taxiPermissions: r.taxiPermissions as string[],
          shopPermissions: r.shopPermissions as string[],
          parkingPermissions: r.parkingPermissions as string[],
          allowedApps: r.allowedApps as string[],
        }}
      />
    </div>
  );
}
