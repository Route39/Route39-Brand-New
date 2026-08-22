import { useQuery } from "@apollo/client";
import { useParams, useSearchParams } from "react-router-dom";

import { ErrorBlock, LoadingBlock } from "@/components/panel/StateBlock";
import { PageHeader } from "@/components/panel/PageHeader";
import {
  CAR_COLOR_QUERY,
  CAR_MODEL_QUERY,
} from "@/lib/graphql/documents/management-detail-2";
import { CarForm } from "./form";

export default function EditCarPage() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const variant = (params.get("variant") === "model" ? "model" : "color") as "color" | "model";
  const query = variant === "color" ? CAR_COLOR_QUERY : CAR_MODEL_QUERY;

  const { data, loading, error } = useQuery(query, {
    variables: { id: id! },
    skip: !id,
  });

  if (loading && !data) return <LoadingBlock />;
  if (error) return <ErrorBlock message={error.message} />;

  const data2 = data as
    | { carColor?: { id: string; name: string }; carModel?: { id: string; name: string } }
    | undefined;
  const node = variant === "color" ? data2?.carColor : data2?.carModel;
  if (!node) return <ErrorBlock message={`Car ${variant} not found.`} />;

  return (
    <div className="space-y-6">
      <PageHeader title={node.name} description={`Car ${variant} #${node.id}`} />
      <CarForm mode="edit" variant={variant} id={node.id} initialValues={{ name: node.name }} />
    </div>
  );
}
