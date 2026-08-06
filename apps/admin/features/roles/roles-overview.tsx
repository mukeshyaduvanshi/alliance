"use client";

import * as React from "react";
import type { ColumnDef } from "@tanstack/react-table";
import {
  Copy,
  MoreHorizontal,
  Pencil,
  Power,
  Shield,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
  Badge,
  Button,
  DataTable,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  ErrorState,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
  LoadingState,
  PageHeader,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@cj/ui";
import type { CreateRoleDto, RoleDto } from "@cj/types";

import {
  useCloneRole,
  useCreateRole,
  useDeleteRole,
  useRoles,
  useToggleRoleStatus,
  useUpdateRole,
} from "./queries";

const roleSchema = z.object({
  name: z.string().min(2, "Name required"),
  description: z.string().optional(),
  department: z.string().optional(),
  parentRoleId: z.string().optional(),
});

type RoleValues = z.infer<typeof roleSchema>;

function RoleFormDialog({
  role,
  open,
  onOpenChange,
}: {
  role?: RoleDto;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { data: roles } = useRoles();
  const createRole = useCreateRole();
  const updateRole = useUpdateRole();
  const form = useForm<RoleValues>({
    resolver: zodResolver(roleSchema),
    defaultValues: {
      name: role?.name ?? "",
      description: role?.description ?? "",
      department: role?.department ?? "",
      parentRoleId: role?.parentRoleId ?? "",
    },
  });

  React.useEffect(() => {
    if (open) {
      form.reset({
        name: role?.name ?? "",
        description: role?.description ?? "",
        department: role?.department ?? "",
        parentRoleId: role?.parentRoleId ?? "",
      });
    }
  }, [open, role, form]);

  async function onSubmit(values: RoleValues) {
    try {
      if (role) {
        await updateRole.mutateAsync({
          id: role.id,
          data: {
            name: values.name,
            description: values.description || undefined,
            department: values.department || undefined,
            parentRoleId: values.parentRoleId || undefined,
          },
        });
        toast.success("Role updated");
      } else {
        await createRole.mutateAsync(values as CreateRoleDto);
        toast.success("Role created");
      }
      onOpenChange(false);
      form.reset();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save role");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{role ? "Edit Role" : "Create Role"}</DialogTitle>
          <DialogDescription>
            {role
              ? "Update role details and hierarchy."
              : "Create a new role in the hierarchy."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Operation Manager" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Input placeholder="Short description" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="department"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Department</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Operations" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="parentRoleId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Parent Role</FormLabel>
                  <FormControl>
                    <Select
                      value={field.value || undefined}
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="No parent (top level)" />
                      </SelectTrigger>
                      <SelectContent>
                        {roles?.data
                          ?.filter((r) => r.id !== role?.id)
                          .map((r) => (
                            <SelectItem key={r.id} value={r.id}>
                              {r.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={createRole.isPending || updateRole.isPending}>
                {role ? "Save Changes" : "Create Role"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function CloneRoleDialog({ role }: { role: RoleDto }) {
  const [open, setOpen] = React.useState(false);
  const cloneRole = useCloneRole();
  const [name, setName] = React.useState("");

  async function handleClone() {
    try {
      await cloneRole.mutateAsync({ id: role.id, name });
      toast.success("Role cloned");
      setOpen(false);
      setName("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to clone role");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
          <Copy className="size-4" />
          Clone
        </DropdownMenuItem>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Clone Role</DialogTitle>
          <DialogDescription>
            Clone "{role.name}" with its permissions to a new role.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <FormItem>
            <FormLabel>New Role Name</FormLabel>
            <FormControl>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Senior Operation Manager"
              />
            </FormControl>
          </FormItem>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleClone} disabled={!name.trim() || cloneRole.isPending}>
            {cloneRole.isPending ? "Cloning..." : "Clone Role"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DeleteRoleDialog({ role }: { role: RoleDto }) {
  const deleteRole = useDeleteRole();

  async function handleDelete() {
    try {
      await deleteRole.mutateAsync(role.id);
      toast.success("Role deleted");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete role");
    }
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <DropdownMenuItem
          className="text-destructive focus:text-destructive"
          onSelect={(e) => e.preventDefault()}
        >
          <Trash2 className="size-4" />
          Delete
        </DropdownMenuItem>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete role?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete "{role.name}". This action cannot be
            undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            onClick={handleDelete}
            disabled={deleteRole.isPending}
          >
            {deleteRole.isPending ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function RoleActions({ role }: { role: RoleDto }) {
  const [editOpen, setEditOpen] = React.useState(false);
  const toggleStatus = useToggleRoleStatus();

  async function handleToggle() {
    try {
      await toggleStatus.mutateAsync({
        id: role.id,
        status: role.status === "ACTIVE" ? "INACTIVE" : "ACTIVE",
      });
      toast.success(`Role ${role.status === "ACTIVE" ? "deactivated" : "activated"}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update status");
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon-sm">
            <MoreHorizontal className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={() => setEditOpen(true)}>
            <Pencil className="size-4" />
            Edit
          </DropdownMenuItem>
          <CloneRoleDialog role={role} />
          <DropdownMenuItem
            onSelect={handleToggle}
            disabled={role.isSystemRole}
          >
            <Power className="size-4" />
            {role.status === "ACTIVE" ? "Deactivate" : "Activate"}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DeleteRoleDialog role={role} />
        </DropdownMenuContent>
      </DropdownMenu>
      <RoleFormDialog role={role} open={editOpen} onOpenChange={setEditOpen} />
    </>
  );
}

const columns: ColumnDef<RoleDto>[] = [
  {
    accessorKey: "name",
    header: "Role",
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <span className="font-medium">{row.original.name}</span>
        {row.original.isSystemRole && <Badge variant="secondary">System</Badge>}
      </div>
    ),
  },
  {
    accessorKey: "department",
    header: "Department",
    cell: ({ row }) => row.original.department ?? "—",
  },
  {
    accessorKey: "parentRole.name",
    header: "Parent Role",
    cell: ({ row }) => row.original.parentRole?.name ?? "—",
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => (
      <Badge variant={row.original.status === "ACTIVE" ? "default" : "secondary"}>
        {row.original.status}
      </Badge>
    ),
  },
  {
    accessorKey: "permissions",
    header: "Permissions",
    cell: ({ row }) => (
      <span className="text-muted-foreground text-sm">
        {row.original.rolePermissions?.length ?? 0} assigned
      </span>
    ),
  },
  {
    id: "actions",
    cell: ({ row }) => <RoleActions role={row.original} />,
  },
];

export function RolesOverview() {
  const [createOpen, setCreateOpen] = React.useState(false);
  const [page, setPage] = React.useState(1);
  const { data, isLoading, isError, refetch } = useRoles(page);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Roles & Permissions"
        description="Manage role hierarchy and access control"
        actions={
          <Button onClick={() => setCreateOpen(true)}>
            <Shield className="size-4" />
            Create Role
          </Button>
        }
      />
      {isError ? (
        <ErrorState
          title="Failed to load roles"
          description="Could not fetch roles from the server."
          onRetry={() => refetch()}
        />
      ) : isLoading ? (
        <LoadingState rows={4} />
      ) : (
        <DataTable
          columns={columns}
          data={data?.data ?? []}
          totalRows={data?.meta.total ?? 0}
          pageIndex={page}
          pageSize={20}
          onPageChange={setPage}
          emptyTitle="No roles found"
          emptyDescription="Create your first role to get started."
        />
      )}
      <RoleFormDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}
