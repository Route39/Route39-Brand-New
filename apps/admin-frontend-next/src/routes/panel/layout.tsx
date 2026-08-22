import { Outlet } from "react-router-dom";

import { PanelFooter } from "@/components/panel/PanelFooter";
import { PanelGuard } from "@/components/panel/PanelGuard";
import { PanelHeader } from "@/components/panel/PanelHeader";
import { PanelSidebar } from "@/components/panel/PanelSidebar";

export default function PanelLayout() {
  return (
    <PanelGuard>
      <div className="flex min-h-screen bg-background text-foreground">
        <PanelSidebar />
        <div className="flex min-h-screen flex-1 flex-col">
          <PanelHeader />
          <main className="flex-1 overflow-y-auto p-4 sm:p-8">
            <Outlet />
          </main>
          <PanelFooter />
        </div>
      </div>
    </PanelGuard>
  );
}
