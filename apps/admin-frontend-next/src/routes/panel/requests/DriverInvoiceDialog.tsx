import { useQuery } from "@apollo/client";
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
import { DRIVER_TRIP_DETAILS_QUERY } from "@/lib/graphql/documents/daily-collection";
import { formatCurrency, formatDate, formatName, formatPhone } from "@/lib/format";

interface DriverInfo {
  id: string;
  firstName?: string | null;
  lastName?: string | null;
  mobileNumber?: string | null;
  carPlate?: string | null;
}

interface DriverInvoiceDialogProps {
  driverId: string;
  driver: DriverInfo | null;
  /** yyyy-mm-dd, may be empty (no lower bound) */
  dateFrom: string;
  /** yyyy-mm-dd, may be empty (no upper bound) */
  dateTo: string;
  onClose: () => void;
}

function dayStartISO(dateStr: string): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day, 0, 0, 0, 0).toISOString();
}

function dayEndISO(dateStr: string): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day, 23, 59, 59, 999).toISOString();
}

function formatTime(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}

function tripAmount(o: {
  costAfterCoupon: number;
  gstAmount: number;
  platformFeeAmount: number;
  paymentGatewayFeeAmount: number;
}): number {
  return o.costAfterCoupon + o.gstAmount + o.platformFeeAmount + o.paymentGatewayFeeAmount;
}

export function DriverInvoiceDialog({
  driverId,
  driver,
  dateFrom,
  dateTo,
  onClose,
}: DriverInvoiceDialogProps) {
  const filter: Record<string, Record<string, unknown>> = { driverId: { eq: driverId } };
  if (dateFrom && dateTo) {
    filter.createdOn = { between: { lower: dayStartISO(dateFrom), upper: dayEndISO(dateTo) } };
  } else if (dateFrom) {
    filter.createdOn = { gte: dayStartISO(dateFrom) };
  } else if (dateTo) {
    filter.createdOn = { lte: dayEndISO(dateTo) };
  }

  const { data, loading } = useQuery(DRIVER_TRIP_DETAILS_QUERY, {
    variables: {
      paging: { limit: 500, offset: 0 },
      filter: filter as never,
      sorting: [{ field: "createdOn", direction: "ASC" }] as never,
    },
  });

  const trips = data?.orders.nodes ?? [];
  const total = trips.reduce((sum, o) => sum + tripAmount(o), 0);
  const currency = trips[0]?.currency ?? "INR";
  const invoiceNo = `Auto-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${driverId
    .slice(0, 8)
    .toUpperCase()}`;

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="flex max-h-[85vh] w-full max-w-6xl flex-col gap-0 p-0 print:max-h-none print:max-w-none print:overflow-visible print:border-0 print:shadow-none">
        <style>{`
          @media print {
            @page { size: A4 portrait; margin: 12mm; }
            body * { visibility: hidden; }
            #driver-invoice-print, #driver-invoice-print * { visibility: visible; }
            #driver-invoice-print {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
              padding: 0;
            }
            #driver-invoice-print table {
              width: 100%;
              table-layout: fixed;
              font-size: 11px;
            }
            #driver-invoice-print td,
            #driver-invoice-print th {
              word-break: break-word;
              white-space: normal !important;
            }
          }
        `}</style>
        <div id="driver-invoice-print" className="flex min-h-0 flex-1 flex-col print:block">
          <DialogHeader className="shrink-0 border-b border-border px-6 py-4">
            <DialogTitle>Auto Driver Daily Collection Bill</DialogTitle>
            <DialogDescription>Route39 fleet management services</DialogDescription>
          </DialogHeader>

          <div className="grid shrink-0 grid-cols-2 gap-4 border-b border-border px-6 py-4 text-sm">
            <div className="space-y-1">
              <div>
                <span className="text-muted-foreground">Driver Name: </span>
                <span className="font-medium">{formatName(driver)}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Driver Phone: </span>
                <span className="font-medium">{formatPhone(driver?.mobileNumber)}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Vehicle Number: </span>
                <span className="font-medium">{driver?.carPlate ?? "—"}</span>
              </div>
            </div>
            <div className="space-y-1 text-right">
              <div>
                <span className="text-muted-foreground">Invoice No: </span>
                <span className="font-medium">{invoiceNo}</span>
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
                    <TableHead className="whitespace-nowrap">Trip Date &amp; Time</TableHead>
                    <TableHead>Pickup &amp; Drop Location</TableHead>
                    <TableHead className="whitespace-nowrap text-right">Collected Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {trips.map((trip, i) => (
                    <TableRow key={trip.id}>
                      <TableCell>{i + 1}</TableCell>
                      <TableCell className="whitespace-nowrap">
                        {formatDate(trip.createdOn)}{" "}
                        <span className="text-muted-foreground">
                          {formatTime(trip.startTimestamp ?? trip.createdOn)}
                        </span>
                      </TableCell>
                      <TableCell className="max-w-xs">
                        {trip.addresses.length > 0 ? (
                          <div className="space-y-0.5 text-xs leading-tight">
                            <div className="break-words">{trip.addresses[0]}</div>
                            <div className="break-words text-muted-foreground">
                              ↓ {trip.addresses[trip.addresses.length - 1]}
                            </div>
                          </div>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-right">
                        {formatCurrency(tripAmount(trip), trip.currency)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {!loading && trips.length === 0 ? (
                <TableEmpty>No trips found for this driver in the selected period.</TableEmpty>
              ) : null}
            </div>
          </div>

          <div className="flex shrink-0 justify-end border-t border-border px-6 py-3 text-sm">
            <div className="text-right">
              <div className="text-muted-foreground">Total Collected</div>
              <div className="text-lg font-semibold">{formatCurrency(total, currency)}</div>
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