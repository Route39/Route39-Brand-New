import { useQuery } from "@apollo/client";
import { Plus } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/panel/PageHeader";
import { LoadingBlock } from "@/components/panel/StateBlock";
import { CARS_LIST_QUERIES } from "@/lib/graphql/documents/management";

export default function CarsListPage() {
  const navigate = useNavigate();
  const { data, loading } = useQuery(CARS_LIST_QUERIES);

  if (loading && !data) return <LoadingBlock />;

  const colors = data?.carColors.nodes ?? [];
  const models = data?.carModels.nodes ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Cars"
        description="Vehicle colors and models offered to drivers."
        actions={
          <Button asChild>
            <Link to="/management/cars/new">
              <Plus className="size-4" />
              New
            </Link>
          </Button>
        }
      />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Colors ({colors.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="grid grid-cols-2 gap-1 text-sm">
              {colors.map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    className="w-full rounded-md px-2 py-1 text-left hover:bg-muted/40"
                    onClick={() => navigate(`/management/cars/${c.id}?variant=color`)}
                  >
                    {c.name}
                  </button>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Models ({models.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="grid grid-cols-2 gap-1 text-sm">
              {models.map((m) => (
                <li key={m.id}>
                  <button
                    type="button"
                    className="w-full rounded-md px-2 py-1 text-left hover:bg-muted/40"
                    onClick={() => navigate(`/management/cars/${m.id}?variant=model`)}
                  >
                    {m.name}
                  </button>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
