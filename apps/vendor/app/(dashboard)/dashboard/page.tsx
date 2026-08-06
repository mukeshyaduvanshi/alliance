import { PageHeader, StatCard } from "@cj/ui";

export default function VendorDashboardPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard" description="Vendor operations overview" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Assigned Orders" value="—" />
        <StatCard label="In Production" value="—" />
        <StatCard label="Payments Pending" value="—" />
        <StatCard label="My Rating" value="—" />
      </div>
    </div>
  );
}
