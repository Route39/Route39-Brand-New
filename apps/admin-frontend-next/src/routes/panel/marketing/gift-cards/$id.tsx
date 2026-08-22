import { useQuery } from "@apollo/client";
import { useParams } from "react-router-dom";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ErrorBlock, LoadingBlock } from "@/components/panel/StateBlock";
import { PageHeader } from "@/components/panel/PageHeader";
import { KeyValueList } from "@/components/panel/KeyValue";
import { GIFT_BATCH_QUERY } from "@/lib/graphql/documents/marketing-detail";
import { formatCurrency, formatDateTime } from "@/lib/format";

export default function GiftBatchDetailPage() {
  const { id } = useParams();
  const { data, loading, error } = useQuery(GIFT_BATCH_QUERY, {
    variables: { id: id! },
    skip: !id,
  });

  if (loading && !data) return <LoadingBlock />;
  if (error) return <ErrorBlock message={error.message} />;
  if (!data?.giftBatch) return <ErrorBlock message="Gift batch not found." />;

  const b = data.giftBatch;
  return (
    <div className="space-y-6">
      <PageHeader title={b.name} description={`Gift batch #${b.id}`} />
      <Card>
        <CardHeader>
          <CardTitle>Batch</CardTitle>
        </CardHeader>
        <CardContent>
          <KeyValueList
            items={[
              { label: "Amount per code", value: formatCurrency(b.amount, b.currency) },
              { label: "Currency", value: b.currency },
              { label: "Codes issued", value: b.giftCodes.totalCount },
              { label: "Available from", value: formatDateTime(b.availableFrom) },
              { label: "Expires", value: formatDateTime(b.expireAt) },
            ]}
          />
        </CardContent>
      </Card>
    </div>
  );
}
