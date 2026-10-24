import { useMutation, useQuery } from "@apollo/client";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable, type DataTableColumn } from "@/components/tables/DataTable";
import { PageHeader } from "@/components/panel/PageHeader";
import { SURGE_ZONES_LIST_QUERY, UPDATE_SURGE_ZONE_MUTATION } from "@/lib/graphql/documents/surge";

type Row = { id: string; name: string; status: string; type?: string; surgePercent?: number | null; surgeFlat?: number | null; startTime?: string | null; endTime?: string | null; startDate?: string | null; endDate?: string | null; autoLive?: boolean; autoReason?: string | null; autoCreated?: boolean };

export default function SurgeZonesListPage() {
  const navigate = useNavigate();
  const { data, loading, error } = useQuery(SURGE_ZONES_LIST_QUERY);
  const rows = (data?.surgeZones?.nodes ?? []) as Row[];
  const [updateOne] = useMutation(UPDATE_SURGE_ZONE_MUTATION, { refetchQueries: [{ query: SURGE_ZONES_LIST_QUERY }] });
  const ICON: Record<string, string> = { Peak: "🔥", Rain: "🌧️", Festival: "🎉", Night: "🌙", Event: "📍" };
  const toggle = async (r: Row) => {
    const next = r.status === "Active" ? "Off" : "Active";
    try {
      await updateOne({ variables: { id: r.id, input: { status: next } } });
      toast.success(`${r.name}: surge ${next === "Active" ? "ON" : "OFF"}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Update failed");
    }
  };
  const columns: DataTableColumn<Row>[] = [
    { key: "id", header: "ID", cell: (r) => <span className="font-mono text-xs text-muted-foreground">{r.id}</span> },
    { key: "name", header: "Name", cell: (r) => (<span className="flex items-center gap-2 font-medium">{r.name}{r.autoCreated && <Badge variant="muted">🤖 Auto Grid</Badge>}</span>) },
    { key: "status", header: "Status", cell: (r) => r.status === "Auto" ? (<Badge variant={r.autoLive ? "destructive" : "muted"}>{r.autoLive ? "🟢 Auto · LIVE" + (r.autoReason ? " (" + r.autoReason + ")" : "") : "⚪ Auto · Waiting"}</Badge>) : <Badge variant={r.status === "Active" ? "destructive" : "muted"}>{r.status}</Badge> },
    { key: "type", header: "Type", cell: (r) => `${ICON[r.type ?? "Peak"] ?? ""} ${r.type ?? "Peak"}` },
    { key: "surge", header: "Surge", cell: (r) => (r.surgeFlat ? `+₹${r.surgeFlat}` : r.surgePercent != null ? `+${r.surgePercent}%` : "Default %") },
    { key: "time", header: "Time", cell: (r) => (r.startTime && r.endTime ? `${r.startTime} – ${r.endTime}` : "All day") },
    { key: "toggle", header: "Quick", align: "right", cell: (r) => r.status === "Auto" ? (<span className="text-xs text-muted-foreground">Automatic</span>) : (
      <Button size="sm" variant={r.status === "Active" ? "outline" : "default"}
        onClick={(e) => { e.stopPropagation(); toggle(r); }}>
        {r.status === "Active" ? "Turn OFF" : "Turn ON"}
      </Button>
    ) },
  ];
  return (
    <div className="space-y-6">
      <PageHeader
        title="Surge zones"
        description="Peak areas with extra fare. Customer and driver see the same amount."
        actions={<Button asChild><Link to="/management/surge-zones/new"><Plus className="size-4" />New surge zone</Link></Button>}
      />
      <DataTable columns={columns} rows={rows} totalCount={data?.surgeZones?.totalCount} loading={loading} error={error?.message ?? null}
        rowKey={(r) => r.id} onRowClick={(r) => navigate(`/management/surge-zones/${r.id}`)} />
    </div>
  );
}
