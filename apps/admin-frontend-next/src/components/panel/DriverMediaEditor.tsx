import { useApolloClient, useQuery } from "@apollo/client";
import { ImageUp } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { DRIVER_DOCUMENTS_QUERY } from "@/lib/graphql/documents/driver-detail";
import { adminUploadMedia, mediaUrl } from "@/lib/admin-upload";

function ImageSlot({
  title,
  src,
  onPick,
}: {
  title: string;
  src?: string | null;
  onPick: (f: File) => Promise<void>;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card">
      <div className="aspect-square w-full overflow-hidden bg-muted">
        {src ? (
          <img src={mediaUrl(src)} alt={title} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
            No image
          </div>
        )}
      </div>
      <div className="flex items-center justify-between gap-2 p-3">
        <span className="text-sm font-medium">{title}</span>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={busy}
          onClick={() => ref.current?.click()}
        >
          {busy ? <Spinner size="sm" /> : <ImageUp className="size-3.5" />}
          Replace
        </Button>
        <input
          ref={ref}
          type="file"
          accept="image/*"
          hidden
          onChange={async (e) => {
            const f = e.target.files?.[0];
            e.target.value = "";
            if (!f) return;
            setBusy(true);
            try {
              await onPick(f);
              toast.success(`${title} updated`);
            } catch (err) {
              toast.error(err instanceof Error ? err.message : "Upload failed");
            } finally {
              setBusy(false);
            }
          }}
        />
      </div>
    </div>
  );
}

export function DriverMediaEditor({
  driverId,
  profileAddress,
}: {
  driverId: string;
  profileAddress?: string | null;
}) {
  const client = useApolloClient();
  const { data } = useQuery(DRIVER_DOCUMENTS_QUERY, { variables: { driverId } });
  const raw = (data?.driverToDriverDocuments.edges ?? []).map((e) => e.node);

  const totals = new Map<string, number>();
  raw.forEach((d) =>
    totals.set(d.driverDocument.title, (totals.get(d.driverDocument.title) ?? 0) + 1),
  );
  const seen = new Map<string, number>();
  const labels = ["Front", "Back", "Left Side", "Right Side"];
  const docs = raw.map((d) => {
    const t = d.driverDocument.title;
    if ((totals.get(t) ?? 1) < 2) return { ...d, label: t };
    const i = seen.get(t) ?? 0;
    seen.set(t, i + 1);
    return { ...d, label: `${t} - ${labels[i] ?? `#${i + 1}`}` };
  });

  const refresh = () => client.refetchQueries({ include: "active" });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Photos & documents</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <ImageSlot
            title="Profile photo"
            src={profileAddress}
            onPick={async (f) => {
              await adminUploadMedia(f, { driverId });
              await refresh();
            }}
          />
          {docs.map((d) => (
            <ImageSlot
              key={d.id}
              title={d.label}
              src={d.media.address}
              onPick={async (f) => {
                await adminUploadMedia(f, { driverDocumentRowId: d.id });
                await refresh();
              }}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
