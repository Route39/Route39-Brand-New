import { Printer } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableEmpty,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency, formatDate } from "@/lib/format";

export interface DailyBillRow {
  driverId: string;
  name: string;
  phone: string;
  trips: number;
  collected: number;
}

interface DailyCollectionBillDialogProps {
  rows: DailyBillRow[];
  total: number;
  /** yyyy-mm-dd, may be empty */
  dateFrom: string;
  /** yyyy-mm-dd, may be empty */
  dateTo: string;
  cityLabel: string | null;
  onClose: () => void;
}

export function DailyCollectionBillDialog({
  rows,
  total,
  dateFrom,
  dateTo,
  cityLabel,
  onClose,
}: DailyCollectionBillDialogProps) {
  const totalTrips = rows.reduce((sum, r) => sum + r.trips, 0);
  const billNo = `DC-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}`;

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        id="daily-bill-dialog"
        className="flex max-h-[85vh] w-full max-w-4xl flex-col gap-0 p-0"
      >
        <style>{`
          @media print {
            @page { size: A4 portrait; margin: 12mm; }
            html, body {
              height: auto !important;
              overflow: visible !important;
              margin: 0 !important;
              padding: 0 !important;
              background: #fff !important;
            }
            body > *:not(#daily-bill-dialog):not(:has(#daily-bill-dialog)) { display: none !important; }
            #daily-bill-dialog {
              position: static !important;
              transform: none !important;
              translate: none !important;
              scale: none !important;
              animation: none !important;
              display: block !important;
              width: 100% !important;
              max-width: none !important;
              max-height: none !important;
              overflow: visible !important;
              border: 0 !important;
              box-shadow: none !important;
              background: #fff !important;
            }
            #daily-bill-dialog > button { display: none !important; }
            #daily-bill-print, #daily-bill-print * {
              color: #000 !important;
              background: transparent !important;
              border-color: #999 !important;
              overflow: visible !important;
              max-height: none !important;
            }
            #daily-bill-print { display: block !important; }
            #daily-bill-print table {
              width: 100%;
              table-layout: fixed;
              font-size: 11px;
            }
            #daily-bill-print th:nth-child(1) { width: 8%; }
            #daily-bill-print th:nth-child(2) { width: 34%; }
            #daily-bill-print th:nth-child(3) { width: 24%; }
            #daily-bill-print th:nth-child(4) { width: 12%; }
            #daily-bill-print th:nth-child(5) { width: 22%; }
            #daily-bill-print thead { display: table-header-group; }
            #daily-bill-print tr { break-inside: avoid; page-break-inside: avoid; }
            #daily-bill-print td,
            #daily-bill-print th {
              word-break: break-word;
              white-space: normal !important;
            }
          }
        `}</style>
        <div id="daily-bill-print" className="flex min-h-0 flex-1 flex-col print:block">
          <DialogHeader className="shrink-0 border-b border-border px-6 py-4">
            <DialogTitle>Route39 Daily Collection Bill</DialogTitle>
            <DialogDescription>Driver-wise collection summary</DialogDescription>
          </DialogHeader>

          <div className="grid shrink-0 grid-cols-2 gap-4 border-b border-border px-6 py-4 text-sm">
            <div className="space-y-1">
              <div>
                <span className="text-muted-foreground">City: </span>
                <span className="font-medium">{cityLabel ?? "All cities"}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Drivers: </span>
                <span className="font-medium">{rows.length}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Total Trips: </span>
                <span className="font-medium">{totalTrips}</span>
              </div>
            </div>
            <div className="space-y-1 text-right">
              <div>
                <span className="text-muted-foreground">Bill No: </span>
                <span className="font-medium">{billNo}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Print Date: </span>
                <span className="font-medium">{formatDate(new Date())}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Period: </span>
                <span className="font-medium">
                  {dateFrom ? formatDate(dateFrom) : "Start"} – {dateTo ? formatDate(dateTo) : "Today"}
                </span>
              </div>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4 print:overflow-visible">
            <div className="rounded-lg border border-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="whitespace-nowrap">S.No</TableHead>
                    <TableHead>Driver</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead className="text-right">Trips</TableHead>
                    <TableHead className="whitespace-nowrap text-right">Collected Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((r, i) => (
                    <TableRow key={r.driverId}>
                      <TableCell>{i + 1}</TableCell>
                      <TableCell className="font-medium">{r.name}</TableCell>
                      <TableCell>{r.phone}</TableCell>
                      <TableCell className="text-right">{r.trips}</TableCell>
                      <TableCell className="whitespace-nowrap text-right">
                        {formatCurrency(r.collected, "INR")}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {rows.length === 0 ? (
                <TableEmpty>No collections found for the selected filters.</TableEmpty>
              ) : null}
            </div>
          </div>

          <div className="flex shrink-0 justify-end border-t border-border px-6 py-3 text-sm">
            <div className="text-right">
              <div className="text-muted-foreground">Grand Total</div>
              <div className="text-lg font-semibold">{formatCurrency(total, "INR")}</div>
            </div>
          </div>
        </div>

        <DialogFooter className="shrink-0 border-t border-border px-6 py-4 print:hidden">
          <Button type="button" variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button type="button" onClick={() => window.print()} className="gap-2">
            <Printer className="size-4" />
            Download PDF
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
