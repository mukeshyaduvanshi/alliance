import { PageHeader, StatCard } from "@cj/ui";

export default function DeveloperDashboardPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="System health & operations overview"
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Server Status" value="—" />
        <StatCard label="API Error Rate" value="—" />
        <StatCard label="Queued Jobs" value="—" />
        <StatCard label="Active Licenses" value="—" />
      </div>
    </div>
  );
}
