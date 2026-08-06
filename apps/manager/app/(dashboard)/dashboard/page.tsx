import { PageHeader, StatCard } from "@cj/ui";

export default function ManagerDashboardPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="KAM / Internal operations overview"
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Assigned Brands" value="—" />
        <StatCard label="Active Orders" value="—" />
        <StatCard label="Pending Approvals" value="—" />
        <StatCard label="Open Alerts" value="—" />
      </div>
    </div>
  );
}
