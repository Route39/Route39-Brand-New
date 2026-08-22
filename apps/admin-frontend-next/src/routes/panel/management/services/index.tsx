import { useQuery } from "@apollo/client";
import { Plus, Settings2 } from "lucide-react";
import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { DataTable, type DataTableColumn } from "@/components/tables/DataTable";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ManageCategoriesDialog } from "@/components/forms/ManageCategoriesDialog";
import { PageHeader } from "@/components/panel/PageHeader";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SERVICES_LIST_QUERY } from "@/lib/graphql/documents/management";
import { SERVICE_CATEGORIES_QUERY } from "@/lib/graphql/documents/management-detail-2";
import { buildFilterInput, buildSortInput, usePageState } from "@/lib/panel/page-state";
import { formatCurrency } from "@/lib/format";

const ALL_TAB = "__all";
const UNCATEGORIZED_TAB = "__none";

type Row = {
  id: string;
  name: string;
  description?: string | null;
  baseFare: number;
  personCapacity?: number | null;
  displayPriority: number;
  orderTypes: string[];
  categoryId?: string | null;
};

export default function ServicesListPage() {
  const navigate = useNavigate();
  const { sort, filters, page, pageSize } = usePageState();
  const [activeTab, setActiveTab] = useState<string>(ALL_TAB);

  const { data, loading, error } = useQuery(SERVICES_LIST_QUERY, {
    variables: {
      sorting: buildSortInput(sort) as never,
      filter: buildFilterInput(filters) as never,
    },
  });
  const { data: catData } = useQuery(SERVICE_CATEGORIES_QUERY);
  const categories = catData?.serviceCategories ?? [];

  const allRows = (data?.services ?? []) as Row[];

  const filteredRows = useMemo(() => {
    if (activeTab === ALL_TAB) return allRows;
    if (activeTab === UNCATEGORIZED_TAB) return allRows.filter((r) => !r.categoryId);
    return allRows.filter((r) => r.categoryId === activeTab);
  }, [allRows, activeTab]);

  const rows = useMemo(
    () => filteredRows.slice((page - 1) * pageSize, page * pageSize),
    [filteredRows, page, pageSize],
  );

  const columns: DataTableColumn<Row>[] = [
    { key: "id", header: "ID", cell: (r) => <span className="font-mono text-xs text-muted-foreground">{r.id}</span> },
    { key: "name", header: "Name", cell: (r) => <span className="font-medium">{r.name}</span> },
    { key: "personCapacity", header: "Capacity", align: "right" },
    { key: "baseFare", header: "Base fare", align: "right", cell: (r) => formatCurrency(r.baseFare) },
    {
      key: "orderTypes",
      header: "Order types",
      cell: (r) => (
        <div className="flex flex-wrap gap-1">
          {r.orderTypes.map((t) => (
            <Badge key={t} variant="outline">
              {t}
            </Badge>
          ))}
        </div>
      ),
    },
    { key: "displayPriority", header: "Priority", align: "right" },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Services"
        description="Available ride and delivery service types."
        actions={
          <Button asChild>
            <Link to="/management/services/new">
              <Plus className="size-4" />
              New service
            </Link>
          </Button>
        }
      />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="h-auto flex-wrap">
            <TabsTrigger value={ALL_TAB}>All</TabsTrigger>
            {categories.map((c) => (
              <TabsTrigger key={c.id} value={c.id}>
                {c.name}
              </TabsTrigger>
            ))}
            <TabsTrigger value={UNCATEGORIZED_TAB}>Uncategorized</TabsTrigger>
          </TabsList>
        </Tabs>
        <ManageCategoriesDialog
          trigger={
            <Button type="button" variant="outline" size="sm">
              <Settings2 className="size-3.5" />
              Manage categories
            </Button>
          }
        />
      </div>
      <DataTable
        columns={columns}
        rows={rows}
        totalCount={filteredRows.length}
        loading={loading}
        error={error?.message ?? null}
        rowKey={(r) => r.id}
        onRowClick={(r) => navigate(`/management/services/${r.id}`)}
      />
    </div>
  );
}
