import { useQuery } from "@apollo/client";
import { useState } from "react";
import { useOutletContext } from "react-router-dom";

import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EmptyBlock, LoadingBlock } from "@/components/panel/StateBlock";
import { DRIVER_DOCUMENTS_QUERY } from "@/lib/graphql/documents/driver-detail";
import { formatDate } from "@/lib/format";
import type { DriverContext } from "./layout";

interface DocItem {
  id: string;
  expiresAt?: string | null;
  driverDocument: { id: string; title: string };
  media: { id: string; address: string };
}

export default function DriverDocumentsTab() {
  const { driver } = useOutletContext<DriverContext>();
  const [open, setOpen] = useState<DocItem | null>(null);
  const { data, loading } = useQuery(DRIVER_DOCUMENTS_QUERY, {
    variables: { driverId: driver.id },
  });

  if (loading && !data) return <LoadingBlock />;

  const docs = (data?.driverToDriverDocuments.edges ?? []).map((e) => e.node) as DocItem[];

  if (docs.length === 0) {
    return <EmptyBlock title="No documents" description="This driver has not uploaded any documents." />;
  }

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {docs.map((doc) => {
          const expired =
            doc.expiresAt && new Date(doc.expiresAt).getTime() < Date.now();
          return (
            <button
              key={doc.id}
              type="button"
              onClick={() => setOpen(doc)}
              className="overflow-hidden rounded-lg border border-border bg-card text-left ring-1 ring-foreground/5 transition-colors hover:bg-muted/40"
            >
              <div className="aspect-square w-full overflow-hidden bg-muted">
                <img
                  src={doc.media.address}
                  alt={doc.driverDocument.title}
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              </div>
              <div className="space-y-1 p-3">
                <div className="text-sm font-medium">{doc.driverDocument.title}</div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  {doc.expiresAt ? (
                    <span>Expires {formatDate(doc.expiresAt)}</span>
                  ) : (
                    <span>No expiry</span>
                  )}
                  {expired ? <Badge variant="destructive">Expired</Badge> : null}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <Dialog open={Boolean(open)} onOpenChange={(o) => !o && setOpen(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{open?.driverDocument.title}</DialogTitle>
            {open?.expiresAt ? (
              <DialogDescription>
                Expires {formatDate(open.expiresAt)}
              </DialogDescription>
            ) : null}
          </DialogHeader>
          {open ? (
            <img
              src={open.media.address}
              alt={open.driverDocument.title}
              className="w-full rounded-md"
            />
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}
