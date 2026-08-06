import { PageHeader, StatCard } from "@cj/ui";

export default function AdminDashboardPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Platform overview for Super Admin"
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Users" value="—" />
        <StatCard label="Total Brands" value="—" />
        <StatCard label="Total Vendors" value="—" />
        <StatCard label="Pending Approvals" value="—" />
      </div>
    </div>
  );
}
