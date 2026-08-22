import { useQuery } from "@apollo/client";
import { useTranslation } from "react-i18next";

import { IncomeChart } from "@/components/charts/IncomeChart";
import { RegistrationsChart } from "@/components/charts/RegistrationsChart";
import { RequestsChart } from "@/components/charts/RequestsChart";
import { DriverClusterMap } from "@/components/maps/DriverClusterMap";
import { KpiCard } from "@/components/panel/KpiCard";
import { PageHeader } from "@/components/panel/PageHeader";
import { PLATFORM_KPI_QUERY } from "@/lib/graphql/documents/overview";

export default function HomePage() {
  const { t } = useTranslation();
  const { data, loading } = useQuery(PLATFORM_KPI_QUERY, {
    variables: { input: { currency: "USD", period: "Last30Days" as never } },
  });

  const kpi = data?.platformKPI;

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("menu.home.overview", { defaultValue: "Overview" })}
        description={t("home.description", {
          defaultValue: "Headline metrics for the last 30 days.",
        })}
      />

      <div className="grid gap-4 md:grid-cols-3">
        <KpiCard
          label={kpi?.totalOrders.name ?? "Total orders"}
          total={kpi?.totalOrders.total}
          change={kpi?.totalOrders.change}
          unit={kpi?.totalOrders.unit ?? null}
          loading={loading}
        />
        <KpiCard
          label={kpi?.totalRevenue.name ?? "Total revenue"}
          total={kpi?.totalRevenue.total}
          change={kpi?.totalRevenue.change}
          unit={kpi?.totalRevenue.unit ?? "$"}
          loading={loading}
        />
        <KpiCard
          label={kpi?.activeCustomers.name ?? "Active customers"}
          total={kpi?.activeCustomers.total}
          change={kpi?.activeCustomers.change}
          unit={kpi?.activeCustomers.unit ?? null}
          loading={loading}
        />
      </div>

      <div>
        <h2 className="mb-2 text-sm font-semibold tracking-tight">Live drivers</h2>
        <DriverClusterMap />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <IncomeChart />
        <RequestsChart />
        <RegistrationsChart variant="driver" />
        <RegistrationsChart variant="rider" />
      </div>
    </div>
  );
}
