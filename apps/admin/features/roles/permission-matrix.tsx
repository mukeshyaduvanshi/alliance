"use client";

import * as React from "react";
import { CheckCircle2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

import {
  Badge,
  Button,
  Checkbox,
  ErrorState,
  LoadingState,
  PageHeader,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@cj/ui";
import type { RoleDto } from "@cj/types";

import {
  useAssignPermissions,
  usePermissions,
  type PermissionMap,
  useRoles,
} from "./queries";

export function PermissionMatrix() {
  const { data: roles, isLoading: rolesLoading } = useRoles();
  const { data: permissions, isLoading: permsLoading } = usePermissions();
  const assignPermissions = useAssignPermissions();

  const [selectedRoleId, setSelectedRoleId] = React.useState<string>("");

  const role = roles?.data?.find((r) => r.id === selectedRoleId);

  const [selected, setSelected] = React.useState<Set<string>>(new Set());

  React.useEffect(() => {
    if (role?.rolePermissions?.length) {
      setSelected(
        new Set(role.rolePermissions.map((rp) => rp.permissionId))
      );
    } else {
      setSelected(new Set());
    }
  }, [role]);

  const modules = permissions ? Object.keys(permissions) : [];
  const actions = React.useMemo(() => {
    if (!permissions) return [];
    const set = new Set<string>();
    for (const list of Object.values(permissions)) {
      for (const p of list) set.add(p.action);
    }
    return Array.from(set);
  }, [permissions]);

  const isSystemRole = role?.isSystemRole ?? false;
  const dirty = role
    ? !(
        selected.size === (role.rolePermissions?.length ?? 0) &&
        (role.rolePermissions ?? []).every((rp) => selected.has(rp.permissionId))
      )
    : false;

  function togglePermission(permissionId: string) {
    if (isSystemRole) return;
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(permissionId)) next.delete(permissionId);
      else next.add(permissionId);
      return next;
    });
  }

  async function handleSave() {
    if (!role || isSystemRole) return;
    try {
      await assignPermissions.mutateAsync({
        id: role.id,
        data: { permissionIds: Array.from(selected) },
      });
      toast.success("Permissions updated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update permissions");
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Permission Matrix"
        description="Assign module permissions to roles"
      />

      {rolesLoading || permsLoading ? (
        <LoadingState rows={3} />
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Select value={selectedRoleId || undefined} onValueChange={setSelectedRoleId}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                {roles?.data?.map((r) => (
                  <SelectItem key={r.id} value={r.id}>
                    {r.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {isSystemRole && (
              <Badge variant="secondary">
                <ShieldCheck className="mr-1 size-3" />
                System role — read only
              </Badge>
            )}
          </div>

          {role ? (
            <>
              <div className="overflow-x-auto rounded-md border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="sticky left-0 bg-muted/50 px-4 py-2 text-left font-medium">
                        Module
                      </th>
                      {actions.map((action) => (
                        <th
                          key={action}
                          className="px-2 py-2 text-center font-medium"
                        >
                          {action}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {modules.map((module) => {
                      const perms = permissions?.[module] ?? [];
                      return (
                        <tr key={module} className="border-b">
                          <td className="sticky left-0 bg-background px-4 py-2 font-medium capitalize">
                            {module}
                          </td>
                          {actions.map((action) => {
                            const perm = perms.find((p) => p.action === action);
                            return (
                              <td key={action} className="px-2 py-2 text-center">
                                {perm && (
                                  <Checkbox
                                    checked={selected.has(perm.id)}
                                    onCheckedChange={() => togglePermission(perm.id)}
                                    disabled={isSystemRole}
                                  />
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    if (role.rolePermissions?.length) {
                      setSelected(
                        new Set(role.rolePermissions.map((rp) => rp.permissionId))
                      );
                    } else {
                      setSelected(new Set());
                    }
                  }}
                  disabled={!dirty || isSystemRole}
                >
                  Reset
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={!dirty || isSystemRole || assignPermissions.isPending}
                >
                  <CheckCircle2 className="size-4" />
                  {assignPermissions.isPending ? "Saving..." : "Save Permissions"}
                </Button>
              </div>
            </>
          ) : (
            <p className="text-muted-foreground text-sm">
              Select a role to view and edit its permissions.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
