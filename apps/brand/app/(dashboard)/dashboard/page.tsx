import { PageHeader, StatCard } from "@cj/ui";

export default function BrandDashboardPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard" description="Brand operations overview" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Active Orders" value="—" />
        <StatCard label="PO Budget Consumed" value="—" />
        <StatCard label="Pending Artwork Approvals" value="—" />
        <StatCard label="Recent Invoices" value="—" />
      </div>
    </div>
  );
}
