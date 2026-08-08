"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
} from "@cj/ui";
import type { AuthSession } from "@cj/utils";

import { saveSession } from "@/lib/session";
import { api } from "@/lib/api";

const loginSchema = z.object({
  email: z.string().trim().min(1, "Email is required").email("Invalid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginValues = z.infer<typeof loginSchema>;

interface MeResponse {
  id: string;
  fullName: string;
  email: string;
  roleId: string | null;
  roleName: string | null;
  isSuperAdmin: boolean;
  permissions: { module: string; action: string }[];
  assignedBrandIds: string[];
}

const LOGIN_ENDPOINT = `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1"}/auth/login`;

export function LoginForm() {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);

  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(values: LoginValues) {
    setLoading(true);
    try {
      const res = await fetch(LOGIN_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
        credentials: "include",
      });

      if (!res.ok) {
        let message = "Login failed";
        try {
          const data = await res.json();
          if (data?.message) message = data.message;
        } catch {
          // ignore
        }
        throw new Error(message);
      }

      const data = (await res.json()) as AuthSession;

      let enriched: Partial<MeResponse> = {};
      try {
        const me = await api.get<MeResponse>("/users/me");
        enriched = me ?? {};
      } catch {
        // session works without permissions; gating falls back to "no permission"
      }

      const session: AuthSession & { assignedBrandIds?: string[] } = {
        ...data,
        permissions: enriched.permissions ?? [],
        user: {
          ...data.user,
          fullName: enriched.fullName ?? data.user?.fullName,
          roleName: enriched.roleName ?? data.user?.roleName,
        },
        assignedBrandIds: enriched.assignedBrandIds ?? [],
      };

      saveSession(session);
      toast.success("Logged in successfully");
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-muted/30 flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Cjalliance System Panel</CardTitle>
          <p className="text-muted-foreground text-sm">
            Sign in to your account
          </p>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="you@company.com"
                        autoComplete="email"
                        {...field}
                      />
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
                      <Input
                        type="password"
                        autoComplete="current-password"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="animate-spin" />}
                Sign in
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
