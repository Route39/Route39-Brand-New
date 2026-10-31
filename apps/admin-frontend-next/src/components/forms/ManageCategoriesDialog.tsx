import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";

interface Props {
  trigger?: React.ReactNode;
}

export function ManageCategoriesDialog({ trigger }: Props) {
  return (
    <Link to="/management/services/categories">
      {trigger ?? (
        <Button type="button" variant="outline" size="sm">
          Manage categories
        </Button>
      )}
    </Link>
  );
}
