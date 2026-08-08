"use client";

import * as React from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { KeyRound, Pencil, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import {
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
import type { CreateUserDto, UpdateUserDto, UserDto, UserStatus } from "@cj/types";
import { UserStatus as UserStatusEnum } from "@cj/types";
import { formatDateTime } from "@cj/utils";

import { InitialsAvatar } from "@/components/initials-avatar";

import {
  useCreateUser,
  useResetPassword,
  useRoles,
  useUpdateUser,
  useUsers,
} from "./queries";

const createUserSchema = z.object({
  fullName: z.string().min(2, "Name required"),
  email: z.string().email("Invalid email"),
  phone: z.string().optional(),
  password: z.string().min(6, "Min 6 characters"),
  roleId: z.string().min(1, "Role required"),
});

type CreateUserValues = z.infer<typeof createUserSchema>;

function RoleSelect({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const { data: roles, isLoading } = useRoles();
  return (
    <Select value={value || undefined} onValueChange={onChange}>
      <SelectTrigger>
        <SelectValue placeholder="Select role" />
      </SelectTrigger>
      <SelectContent>
        {isLoading ? (
          <div className="p-2 text-sm">Loading roles...</div>
        ) : (
          roles?.data?.map((role) => (
            <SelectItem key={role.id} value={role.id}>
              {role.name}
            </SelectItem>
          ))
        )}
      </SelectContent>
    </Select>
  );
}

function StatusSelect({
  value,
  onChange,
}: {
  value: UserStatus;
  onChange: (v: UserStatus) => void;
}) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as UserStatus)}>
      <SelectTrigger>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {(Object.values(UserStatusEnum) as UserStatus[]).map((s) => (
          <SelectItem key={s} value={s}>
            {s}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function EditUserDialog({
  user,
  open,
  onOpenChange,
}: {
  user: UserDto;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const updateUser = useUpdateUser();
  const [fullName, setFullName] = React.useState(user.fullName);
  const [phone, setPhone] = React.useState(user.phone ?? "");
  const [roleId, setRoleId] = React.useState(user.roleId);
  const [status, setStatus] = React.useState<UserStatus>(user.status);

  async function handleSubmit() {
    const data: UpdateUserDto = {};
    if (fullName !== user.fullName) data.fullName = fullName;
    if (phone !== (user.phone ?? "")) data.phone = phone || undefined;
    if (roleId !== user.roleId) data.roleId = roleId;
    if (status !== user.status) data.status = status;
    if (Object.keys(data).length === 0) {
      onOpenChange(false);
      return;
    }
    try {
      await updateUser.mutateAsync({ id: user.id, data });
      toast.success("User updated");
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update user");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit User</DialogTitle>
          <DialogDescription>{user.email}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <FormLabel>Full Name</FormLabel>
            <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <FormLabel>Phone</FormLabel>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 ..." />
          </div>
          <div className="space-y-2">
            <FormLabel>Role</FormLabel>
            <RoleSelect value={roleId} onChange={setRoleId} />
          </div>
          <div className="space-y-2">
            <FormLabel>Status</FormLabel>
            <StatusSelect value={status} onChange={setStatus} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={updateUser.isPending}>
            {updateUser.isPending ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ResetPasswordDialog({
  user,
  open,
  onOpenChange,
}: {
  user: UserDto;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const resetPassword = useResetPassword();
  const [password, setPassword] = React.useState("");

  async function handleSubmit() {
    if (!password) return;
    try {
      await resetPassword.mutateAsync({ id: user.id, newPassword: password });
      toast.success("Password reset");
      setPassword("");
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to reset password");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Reset Password</DialogTitle>
          <DialogDescription>
            Set a new password for {user.fullName}.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <FormLabel>New Password</FormLabel>
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Min 6 characters"
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!password || resetPassword.isPending}>
            {resetPassword.isPending ? "Resetting..." : "Reset Password"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function UserActions({ user }: { user: UserDto }) {
  const [editOpen, setEditOpen] = React.useState(false);
  const [resetOpen, setResetOpen] = React.useState(false);
  const updateUser = useUpdateUser();

  async function handleToggleStatus() {
    try {
      await updateUser.mutateAsync({
        id: user.id,
        data: {
          status:
            user.status === UserStatusEnum.ACTIVE
              ? UserStatusEnum.INACTIVE
              : UserStatusEnum.ACTIVE,
        },
      });
      toast.success(user.status === "ACTIVE" ? "User deactivated" : "User activated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update status");
    }
  }

  return (
    <div className="flex items-center justify-end gap-1">
      <Button variant="ghost" size="icon-sm" title="Edit" onClick={() => setEditOpen(true)}>
        <Pencil className="size-4" />
      </Button>
      <Button variant="ghost" size="icon-sm" title="Reset password" onClick={() => setResetOpen(true)}>
        <KeyRound className="size-4" />
      </Button>
      <Button variant="ghost" size="sm" onClick={handleToggleStatus}>
        {user.status === "ACTIVE" ? "Deactivate" : "Activate"}
      </Button>
      {editOpen && (
        <EditUserDialog user={user} open={editOpen} onOpenChange={setEditOpen} />
      )}
      {resetOpen && (
        <ResetPasswordDialog user={user} open={resetOpen} onOpenChange={setResetOpen} />
      )}
    </div>
  );
}

const columns: ColumnDef<UserDto>[] = [
  {
    accessorKey: "fullName",
    header: "Name",
    cell: ({ row }) => (
      <div className="flex items-center gap-3">
        <InitialsAvatar name={row.original.fullName} tone={0} />
        <div>
          <p className="font-medium">{row.original.fullName}</p>
          <p className="text-muted-foreground text-xs">{row.original.email}</p>
        </div>
      </div>
    ),
  },
  {
    accessorKey: "role.name",
    header: "Role",
    cell: ({ row }) => (
      <Badge variant="violet">{row.original.role?.name ?? "—"}</Badge>
    ),
  },
  {
    accessorKey: "phone",
    header: "Phone",
    cell: ({ row }) => row.original.phone ?? "—",
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => (
      <Badge
        variant={
          row.original.status === UserStatusEnum.ACTIVE
            ? "success"
            : row.original.status === UserStatusEnum.SUSPENDED
              ? "destructive"
              : "warning"
        }
      >
        {row.original.status}
      </Badge>
    ),
  },
  {
    accessorKey: "lastLoginAt",
    header: "Last Login",
    cell: ({ row }) =>
      row.original.lastLoginAt
        ? formatDateTime(row.original.lastLoginAt)
        : "Never",
  },
  {
    id: "actions",
    cell: ({ row }) => <UserActions user={row.original} />,
  },
];

function CreateUserDialog() {
  const [open, setOpen] = React.useState(false);
  const createUser = useCreateUser();

  const form = useForm<CreateUserValues>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      fullName: "",
      email: "",
      phone: "",
      password: "",
      roleId: "",
    },
  });

  async function onSubmit(values: CreateUserValues) {
    try {
      await createUser.mutateAsync(values as CreateUserDto);
      toast.success("User created");
      setOpen(false);
      form.reset();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create user");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <UserPlus className="size-4" />
          Create User
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create User</DialogTitle>
          <DialogDescription>
            Create a new internal user and assign a role.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="fullName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Rahul Sharma" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="user@colorjet.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone (optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="+91 98765 43210" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="Min 6 characters" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="roleId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role</FormLabel>
                  <FormControl>
                    <RoleSelect value={field.value} onChange={field.onChange} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={createUser.isPending}>
                {createUser.isPending ? "Creating..." : "Create User"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export function UsersOverview() {
  const [page, setPage] = React.useState(1);
  const { data, isLoading, isError, refetch } = useUsers(page);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Users"
        description="Manage internal users and their roles"
        actions={<CreateUserDialog />}
      />
      {isError ? (
        <ErrorState
          title="Failed to load users"
          description="Could not fetch user list from the server."
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
          emptyTitle="No users found"
          emptyDescription="Create your first user to get started."
        />
      )}
    </div>
  );
}
