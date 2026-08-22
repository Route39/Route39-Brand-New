import { useMutation, useQuery } from "@apollo/client";
import { ArrowLeft, CheckCircle2, Pencil, RotateCcw, XCircle } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ErrorBlock, LoadingBlock } from "@/components/panel/StateBlock";
import { KeyValueList } from "@/components/panel/KeyValue";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { DRIVER_DETAIL_QUERY, DRIVER_DOCUMENTS_QUERY } from "@/lib/graphql/documents/driver-detail";
import {
  DRIVER_SERVICE_ACTIVATION_QUERY,
  SET_ACTIVATED_SERVICES_MUTATION,
} from "@/lib/graphql/documents/extras";
import { UPDATE_DRIVER_MUTATION } from "@/lib/graphql/documents/management-detail-2";
import { driverStatusVariant } from "@/lib/panel/status-styles";
import { formatDate, formatName } from "@/lib/format";
import { useConfirm } from "@/providers/ConfirmProvider";

const REVIEWABLE = new Set(["PendingApproval", "SoftReject", "HardReject"]);

export default function DriverReviewPage() {
  const confirm = useConfirm();
  const { id } = useParams();
  const navigate = useNavigate();

  const { data, loading, error } = useQuery(DRIVER_DETAIL_QUERY, {
    variables: { id: id! },
    skip: !id,
  });
  const { data: docsData, loading: docsLoading } = useQuery(DRIVER_DOCUMENTS_QUERY, {
    variables: { driverId: id! },
    skip: !id,
  });
  const { data: svcData, loading: svcLoading } = useQuery(DRIVER_SERVICE_ACTIVATION_QUERY, {
    variables: { driverId: id! },
    skip: !id,
  });

  const [selectedSvc, setSelectedSvc] = useState<Set<string>>(new Set());
  const [softOpen, setSoftOpen] = useState(false);
  const [hardOpen, setHardOpen] = useState(false);
  const [softNote, setSoftNote] = useState("");
  const [previewDoc, setPreviewDoc] = useState<{
    title: string;
    address: string;
    expiresAt?: string | null;
  } | null>(null);

  useEffect(() => {
    if (svcData?.driver.enabledServices) {
      setSelectedSvc(
        new Set(
          svcData.driver.enabledServices
            .filter((e) => e.driverEnabled)
            .map((e) => e.serviceId),
        ),
      );
    }
  }, [svcData]);

  useEffect(() => {
    if (data?.driver.softRejectionNote) {
      setSoftNote(data.driver.softRejectionNote);
    }
  }, [data]);

  const [setServices] = useMutation(SET_ACTIVATED_SERVICES_MUTATION, {
    refetchQueries: [{ query: DRIVER_SERVICE_ACTIVATION_QUERY, variables: { driverId: id! } }],
  });
  const [updateDriver, { loading: saving }] = useMutation(UPDATE_DRIVER_MUTATION, {
    refetchQueries: [{ query: DRIVER_DETAIL_QUERY, variables: { id: id! } }],
    awaitRefetchQueries: true,
  });

  if (loading && !data) return <LoadingBlock />;
  if (error) return <ErrorBlock message={error.message} />;
  if (!data?.driver) return <ErrorBlock message="Driver not found." />;

  const driver = data.driver;
  if (!REVIEWABLE.has(driver.status)) {
    return <Navigate to={`/drivers/${driver.id}/details`} replace />;
  }

  const allServices = svcData?.services ?? [];
  const docs = (docsData?.driverToDriverDocuments.edges ?? []).map((e) => e.node);
  const canApprove = selectedSvc.size > 0;

  function toggleSvc(serviceId: string) {
    setSelectedSvc((prev) => {
      const next = new Set(prev);
      if (next.has(serviceId)) next.delete(serviceId);
      else next.add(serviceId);
      return next;
    });
  }

  async function persistSelectedServices() {
    await setServices({
      variables: { input: { driverId: driver.id, serviceIds: [...selectedSvc] } },
    });
  }

  async function handleApprove() {
    if (!canApprove) {
      toast.error("Pick at least one service for this driver before approving.");
      return;
    }
    if (!(await confirm({ title: "Approve this driver with the selected services?", actionLabel: "Approve", destructive: false }))) return;
    try {
      await persistSelectedServices();
      await updateDriver({
        variables: {
          id: driver.id,
          input: { status: "Offline" as never, softRejectionNote: null },
        },
      });
      toast.success("Driver approved.");
      navigate(`/drivers/${driver.id}/details`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Approval failed");
    }
  }

  async function handleSoftReject() {
    const note = softNote.trim();
    if (!note) {
      toast.error("Add a note so the applicant knows what to fix.");
      return;
    }
    try {
      await updateDriver({
        variables: {
          id: driver.id,
          input: {
            status: "SoftReject" as never,
            softRejectionNote: note,
          },
        },
      });
      toast.success("Driver soft-rejected with feedback.");
      setSoftOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Action failed");
    }
  }

  async function handleHardReject() {
    try {
      await updateDriver({
        variables: { id: driver.id, input: { status: "HardReject" as never } },
      });
      toast.success("Driver rejected.");
      setHardOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Action failed");
    }
  }

  async function handleReopen() {
    if (!(await confirm({ title: "Reopen this application for review?", actionLabel: "Reopen", destructive: false }))) return;
    try {
      await updateDriver({
        variables: {
          id: driver.id,
          input: {
            status: "PendingApproval" as never,
            softRejectionNote: null,
          },
        },
      });
      toast.success("Application reopened.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Action failed");
    }
  }

  const statusHeadline =
    driver.status === "PendingApproval"
      ? "Awaiting review"
      : driver.status === "SoftReject"
        ? "Soft-rejected — awaiting resubmission"
        : "Hard-rejected — application denied";

  return (
    <div className="space-y-6 pb-32">
      <header className="space-y-3 border-b border-border/60 pb-4">
        <Link
          to="/drivers?filter=status%7Cin%7CPendingApproval"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" />
          Back to pending queue
        </Link>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight">{formatName(driver)}</h1>
            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <span>{driver.mobileNumber}</span>
              {driver.email ? <span>· {driver.email}</span> : null}
              <Badge variant={driverStatusVariant(driver.status)}>{driver.status}</Badge>
            </div>
            <p className="text-sm font-medium">{statusHeadline}</p>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link to={`/drivers/${driver.id}/edit`}>
              <Pencil className="size-3.5" />
              Edit driver
            </Link>
          </Button>
        </div>
      </header>

      {driver.status !== "PendingApproval" && driver.softRejectionNote ? (
        <Alert variant={driver.status === "HardReject" ? "destructive" : "default"}>
          <AlertDescription>
            <div className="text-xs uppercase tracking-wide text-muted-foreground">
              Previous decision note
            </div>
            <p className="mt-1 italic">{driver.softRejectionNote}</p>
          </AlertDescription>
        </Alert>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Identity & contact</CardTitle>
        </CardHeader>
        <CardContent>
          <KeyValueList
            items={[
              { label: "First name", value: driver.firstName },
              { label: "Last name", value: driver.lastName },
              { label: "Mobile number", value: driver.mobileNumber },
              { label: "Email", value: driver.email },
              { label: "Country", value: driver.countryIso },
              { label: "Gender", value: driver.gender },
              { label: "Address", value: driver.address },
              { label: "Certificate number", value: driver.certificateNumber },
            ]}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Vehicle</CardTitle>
        </CardHeader>
        <CardContent>
          <KeyValueList
            items={[
              { label: "Car plate", value: driver.carPlate },
              { label: "Production year", value: driver.carProductionYear },
              { label: "Can deliver", value: driver.canDeliver ? "Yes" : "No" },
              { label: "Max package size", value: driver.maxDeliveryPackageSize },
            ]}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Banking</CardTitle>
        </CardHeader>
        <CardContent>
          <KeyValueList
            items={[
              { label: "Bank name", value: driver.bankName },
              { label: "Account number", value: driver.accountNumber },
              { label: "Routing number", value: driver.bankRoutingNumber },
              { label: "SWIFT", value: driver.bankSwift },
            ]}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Documents</CardTitle>
        </CardHeader>
        <CardContent>
          {docsLoading && !docsData ? (
            <LoadingBlock />
          ) : docs.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No documents uploaded — applicant cannot be approved until they submit required documents.
            </p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {docs.map((doc) => {
                const expired =
                  doc.expiresAt && new Date(doc.expiresAt).getTime() < Date.now();
                return (
                  <button
                    key={doc.id}
                    type="button"
                    onClick={() =>
                      setPreviewDoc({
                        title: doc.driverDocument.title,
                        address: doc.media.address,
                        expiresAt: doc.expiresAt,
                      })
                    }
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
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Services to activate on approval</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Pick the services this driver is qualified to run. Approval requires at least one.
          </p>
          {svcLoading && !svcData ? (
            <LoadingBlock />
          ) : allServices.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No services configured. Add services under Management → Services first.
            </p>
          ) : (
            <ul className="grid gap-1 sm:grid-cols-2">
              {allServices.map((s) => {
                const on = selectedSvc.has(s.id);
                return (
                  <li key={s.id}>
                    <label className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 hover:bg-muted/40">
                      <Checkbox checked={on} onCheckedChange={() => toggleSvc(s.id)} />
                      <Label className="cursor-pointer text-sm font-normal">{s.name}</Label>
                    </label>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>

      <DecisionBar
        status={driver.status}
        canApprove={canApprove}
        saving={saving}
        onApprove={handleApprove}
        onSoftReject={() => setSoftOpen(true)}
        onHardReject={() => setHardOpen(true)}
        onReopen={handleReopen}
      />

      <Dialog open={softOpen} onOpenChange={setSoftOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Soft reject driver</DialogTitle>
            <DialogDescription>
              The applicant will be told to correct the items below and can resubmit. Be specific.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            rows={5}
            value={softNote}
            onChange={(e) => setSoftNote(e.target.value)}
            placeholder="e.g. Driver's license photo is blurry — please re-upload a clearer scan."
          />
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setSoftOpen(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={handleSoftReject} disabled={saving || !softNote.trim()}>
              {saving ? <Spinner size="sm" className="text-primary-foreground" /> : "Send & soft reject"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={hardOpen} onOpenChange={setHardOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hard reject driver?</DialogTitle>
            <DialogDescription>
              This permanently denies the application. The driver will not be able to reapply with
              this account. Use soft reject if they should be able to fix issues and try again.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setHardOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleHardReject}
              disabled={saving}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {saving ? <Spinner size="sm" className="text-primary-foreground" /> : "Hard reject"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(previewDoc)} onOpenChange={(o) => !o && setPreviewDoc(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{previewDoc?.title}</DialogTitle>
            {previewDoc?.expiresAt ? (
              <DialogDescription>Expires {formatDate(previewDoc.expiresAt)}</DialogDescription>
            ) : null}
          </DialogHeader>
          {previewDoc ? (
            <img src={previewDoc.address} alt={previewDoc.title} className="w-full rounded-md" />
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface DecisionBarProps {
  status: string;
  canApprove: boolean;
  saving: boolean;
  onApprove: () => void;
  onSoftReject: () => void;
  onHardReject: () => void;
  onReopen: () => void;
}

function DecisionBar({
  status,
  canApprove,
  saving,
  onApprove,
  onSoftReject,
  onHardReject,
  onReopen,
}: DecisionBarProps) {
  const hint = useMemo(() => {
    if (status === "HardReject") return "Reopen the application to take a different action.";
    if (!canApprove) return "Select at least one service to enable approval.";
    return null;
  }, [status, canApprove]);

  return (
    <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 px-4 py-3 backdrop-blur sm:left-60">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3">
        <div className="text-xs text-muted-foreground">{hint}</div>
        <div className="flex flex-wrap gap-2">
          {status === "HardReject" ? (
            <Button type="button" variant="outline" onClick={onReopen} disabled={saving}>
              <RotateCcw className="size-4" />
              Reopen application
            </Button>
          ) : (
            <>
              <Button
                type="button"
                variant="ghost"
                className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                onClick={onHardReject}
                disabled={saving}
              >
                <XCircle className="size-4" />
                Hard reject
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={onSoftReject}
                disabled={saving}
              >
                Soft reject
              </Button>
              <Button type="button" onClick={onApprove} disabled={saving || !canApprove}>
                {saving ? (
                  <Spinner size="sm" className="text-primary-foreground" />
                ) : (
                  <>
                    <CheckCircle2 className="size-4" />
                    Approve
                  </>
                )}
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
