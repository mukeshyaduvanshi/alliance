"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { UserRound, X } from "lucide-react";

import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  ErrorState,
  LoadingState,
  PageHeader,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@cj/ui";
import { BusinessModelType } from "@cj/types";
import { formatDateTime } from "@cj/utils";

import {
  useAssignManagers,
  useBrand,
  useBrandBusinessModel,
  useBrandManagers,
  useInternalUsers,
  useRemoveManager,
  useSetBusinessModel,
} from "./queries";

const BUSINESS_MODEL_OPTIONS = Object.values(BusinessModelType);

export function BrandDetail() {
  const params = useParams<{ id: string }>();
  const id = params.id;

  const { data: brand, isLoading, isError, refetch } = useBrand(id);
  const { data: users } = useInternalUsers();
  const { data: businessModel, refetch: refetchBm } = useBrandBusinessModel(id);
  const setBusinessModel = useSetBusinessModel();
  const { data: managers, refetch: refetchManagers } = useBrandManagers(id);
  const assignManagers = useAssignManagers();
  const removeManager = useRemoveManager();

  const [selectedModel, setSelectedModel] = React.useState<string>("");
  const [commission, setCommission] = React.useState<string>("");
  const [markup, setMarkup] = React.useState<string>("");
  const [kamUserId, setKamUserId] = React.useState<string>("");

  React.useEffect(() => {
    if (businessModel) {
      setSelectedModel(businessModel.businessModel);
      setCommission(businessModel.commissionPercent ?? "");
      setMarkup(businessModel.markupPercent ?? "");
    }
  }, [businessModel]);

  async function handleSaveBusinessModel() {
    try {
      await setBusinessModel.mutateAsync({
        brandId: id,
        data: {
          businessModel: selectedModel as BusinessModelType,
          commissionPercent: commission ? Number(commission) : undefined,
          markupPercent: markup ? Number(markup) : undefined,
        },
      });
      toast.success("Business model saved");
      refetchBm();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save business model");
    }
  }

  async function handleAddManager() {
    if (!kamUserId) return;
    const alreadyAssigned = managers?.some((m) => m.userId === kamUserId);
    if (alreadyAssigned) {
      toast.error("This user is already assigned to this brand");
      return;
    }
    try {
      await assignManagers.mutateAsync({ brandId: id, userIds: [kamUserId] });
      toast.success("Manager assigned");
      setKamUserId("");
      refetchManagers();
      refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to assign manager");
    }
  }

  async function handleRemoveManager(userId: string) {
    try {
      await removeManager.mutateAsync({ brandId: id, userId });
      toast.success("Manager removed");
      refetchManagers();
      refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to remove manager");
    }
  }

  if (isError) {
    return (
      <ErrorState title="Failed to load brand" description="Could not fetch brand details." onRetry={() => refetch()} />
    );
  }

  if (isLoading) return <LoadingState rows={4} />;

  if (!brand) return null;

  const bp = brand.businessProfile;

  return (
    <div className="space-y-6">
      <PageHeader
        title={brand.brandName}
        description={brand.email}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Business Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Legal Name</span>
              <span>{bp?.legalName ?? "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Business Type</span>
              <Badge variant="outline">{bp?.businessType ?? "—"}</Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">GST</span>
              <span>{bp?.gstNumber ?? "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">PAN</span>
              <span>{bp?.panNumber ?? "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Address</span>
              <span className="text-right">
                {bp ? `${bp.addressLine1}, ${bp.city}, ${bp.state} ${bp.pincode}` : "—"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Approval</span>
              <Badge variant={brand.approvalStatus === "APPROVED" ? "default" : "outline"}>
                {brand.approvalStatus}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Registered</span>
              <span>{formatDateTime(brand.createdAt)}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Business Model</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Select value={selectedModel || undefined} onValueChange={setSelectedModel}>
              <SelectTrigger>
                <SelectValue placeholder="Select business model" />
              </SelectTrigger>
              <SelectContent>
                {BUSINESS_MODEL_OPTIONS.map((m) => (
                  <SelectItem key={m} value={m}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {(selectedModel === "MEDIATOR_MODEL" || selectedModel === "HYBRID_MODEL") && (
              <div>
                <label className="mb-1.5 block text-sm font-medium">
                  Commission % (0-100)
                </label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex h-9 w-full rounded-md border px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2"
                  value={commission}
                  onChange={(e) => setCommission(e.target.value)}
                />
              </div>
            )}
            {(selectedModel === "VENDOR_MODEL" || selectedModel === "HYBRID_MODEL") && (
              <div>
                <label className="mb-1.5 block text-sm font-medium">
                  Markup % (0-100)
                </label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex h-9 w-full rounded-md border px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2"
                  value={markup}
                  onChange={(e) => setMarkup(e.target.value)}
                />
              </div>
            )}
            <Button onClick={handleSaveBusinessModel} disabled={!selectedModel || setBusinessModel.isPending}>
              {setBusinessModel.isPending ? "Saving..." : "Save Business Model"}
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Assigned Managers</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <Select value={kamUserId || undefined} onValueChange={setKamUserId}>
              <SelectTrigger className="w-72">
                <SelectValue placeholder="Select manager user" />
              </SelectTrigger>
              <SelectContent>
                {users?.data?.map((u) => (
                  <SelectItem key={u.id} value={u.id}>
                    {u.fullName} ({u.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={handleAddManager} disabled={!kamUserId || assignManagers.isPending}>
              {assignManagers.isPending ? "Assigning..." : "Add Manager"}
            </Button>
          </div>

          <div className="space-y-2">
            {managers?.length === 0 && (
              <p className="text-muted-foreground text-sm">
                No managers assigned yet. Add a manager to give them visibility of this brand.
              </p>
            )}
            {managers?.map((m) => (
              <div key={m.userId} className="flex items-center justify-between rounded-md border p-3">
                <div className="flex items-center gap-3">
                  <UserRound className="size-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">{m.fullName}</p>
                    <p className="text-muted-foreground text-xs">
                      {m.email}
                      {m.role ? ` · ${m.role.name}` : ""}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => handleRemoveManager(m.userId)}
                  disabled={removeManager.isPending}
                >
                  <X className="size-4 text-destructive" />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
