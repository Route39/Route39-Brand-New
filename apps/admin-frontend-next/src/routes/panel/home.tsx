import { IncomeChart } from "@/components/charts/IncomeChart";
import { RegistrationsChart } from "@/components/charts/RegistrationsChart";
import { RequestsChart } from "@/components/charts/RequestsChart";
import { DriverClusterMap } from "@/components/maps/DriverClusterMap";
import { CityCollectionTable } from "@/components/panel/CityCollectionTable";
import { CommandCenterHeader } from "@/components/panel/CommandCenterHeader";

export default function HomePage() {
  return (
    <div className="space-y-6">
      <CommandCenterHeader />

      <CityCollectionTable />

      <div>
        <h2 className="mb-2 text-sm font-semibold tracking-tight">Live drivers</h2>
        <DriverClusterMap />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <IncomeChart />
        <RequestsChart />
        <RegistrationsChart variant="driver" />
      </div>
    </div>
  );
}
