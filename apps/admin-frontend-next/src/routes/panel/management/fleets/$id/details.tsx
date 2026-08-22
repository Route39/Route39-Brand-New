import { useOutletContext } from "react-router-dom";

import { FleetForm } from "../form";
import type { FleetContext } from "./layout";

export default function FleetDetailsTab() {
  const { fleet } = useOutletContext<FleetContext>();
  return (
    <FleetForm
      mode="edit"
      id={fleet.id}
      initialValues={{
        name: fleet.name,
        phoneNumber: fleet.phoneNumber,
        mobileNumber: fleet.mobileNumber,
        userName: fleet.userName ?? "",
        accountNumber: "",
        commissionSharePercent: String(fleet.commissionSharePercent),
        commissionShareFlat: String(fleet.commissionShareFlat),
        feeMultiplier: fleet.feeMultiplier != null ? String(fleet.feeMultiplier) : "",
        address: fleet.address ?? "",
        isBlocked: fleet.isBlocked,
        exclusivityAreas: (fleet.exclusivityAreas ?? []).map((poly) =>
          poly.map((p) => ({ lat: p.lat, lng: p.lng })),
        ),
      }}
    />
  );
}
