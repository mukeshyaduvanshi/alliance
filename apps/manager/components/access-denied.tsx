import { ShieldAlert } from "lucide-react";

import { Card, CardContent, PageHeader } from "@cj/ui";

export function AccessDenied() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Access Denied"
        description="You don't have permission to view this section"
      />
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
          <div className="bg-muted text-muted-foreground flex size-12 items-center justify-center rounded-full">
            <ShieldAlert className="size-6" />
          </div>
          <p className="text-muted-foreground text-sm">
            Ask an admin to grant the required permission.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
