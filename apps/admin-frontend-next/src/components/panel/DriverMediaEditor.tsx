import { gql, useApolloClient, useQuery } from "@apollo/client";
import { ImageUp, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { DRIVER_DOCUMENTS_QUERY } from "@/lib/graphql/documents/driver-detail";
import { adminUploadMedia, mediaUrl } from "@/lib/admin-upload";

const DOC_TYPES_QUERY = gql`
  query AdminDriverDocTypes {
    driverDocuments(filter: {}, sorting: []) {
      id
      title
      isEnabled
      numberOfImages
    }
  }
`;

type DocType = { id: string; title: string; isEnabled: boolean; numberOfImages: number };
type DocRow = { id: string; driverDocument: { id: string; title: string }; media: { address: string } };

const SIDE_LABELS = ["Front", "Back", "Left Side", "Right Side"];

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
  const missing = !src;
  return (
    <div
      className={`overflow-hidden rounded-lg border bg-card ${
        missing ? "border-dashed border-destructive/50" : "border-border"
      }`}
    >
      <div className="aspect-square w-full overflow-hidden bg-muted">
        {src ? (
          <img src={mediaUrl(src)} alt={title} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
            Not uploaded
          </div>
        )}
      </div>
      <div className="flex items-center justify-between gap-2 p-3">
        <span className="text-sm font-medium">{title}</span>
        <Button
          type="button"
          size="sm"
          variant={missing ? "default" : "outline"}
          disabled={busy}
          onClick={() => ref.current?.click()}
        >
          {busy ? <Spinner size="sm" /> : missing ? <Upload className="size-3.5" /> : <ImageUp className="size-3.5" />}
          {missing ? "Upload" : "Replace"}
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
              toast.success(`${title} ${missing ? "uploaded" : "updated"}`);
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
  const { data: typesData } = useQuery<{ driverDocuments: DocType[] }>(DOC_TYPES_QUERY);
  const { data } = useQuery(DRIVER_DOCUMENTS_QUERY, { variables: { driverId } });

  const rows = ((data?.driverToDriverDocuments.edges ?? []).map((e) => e.node) as DocRow[])
    .slice()
    .sort((a, b) => Number(a.id) - Number(b.id));

  const byType = new Map<string, DocRow[]>();
  rows.forEach((r) => {
    const k = r.driverDocument.id;
    byType.set(k, [...(byType.get(k) ?? []), r]);
  });

  const types: DocType[] = [...(typesData?.driverDocuments ?? [])]
    .filter((t) => t.isEnabled || byType.has(t.id))
    .sort((a, b) => Number(a.id) - Number(b.id));
  // documents whose type is missing from the list (safety)
  byType.forEach((list, id) => {
    if (!types.some((t) => t.id === id)) {
      types.push({ id, title: list[0].driverDocument.title, isEnabled: true, numberOfImages: list.length });
    }
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
          {types.flatMap((t) => {
            const existing = byType.get(t.id) ?? [];
            const count = Math.max(t.numberOfImages || 1, existing.length);
            return Array.from({ length: count }, (_, i) => {
              const row = existing[i];
              const label = count > 1 ? `${t.title} - ${SIDE_LABELS[i] ?? `#${i + 1}`}` : t.title;
              return (
                <ImageSlot
                  key={`${t.id}-${i}`}
                  title={label}
                  src={row?.media.address}
                  onPick={async (f) => {
                    if (row) {
                      await adminUploadMedia(f, { driverDocumentRowId: row.id });
                    } else {
                      await adminUploadMedia(f, { driverId, driverDocumentTypeId: t.id });
                    }
                    await refresh();
                  }}
                />
              );
            });
          })}
        </div>
      </CardContent>
    </Card>
  );
}
