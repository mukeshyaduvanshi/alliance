"use client";

import Link from "next/link";
import { LoginForm as UiLoginForm } from "@cj/ui";
import type { AuthSession } from "@cj/utils";

import { saveSession } from "@/lib/session";

const LOGIN_ENDPOINT = `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1"}/vendor-auth/login`;

export function LoginForm() {
  return (
    <UiLoginForm
      portalName="Cjalliance Vendor Portal"
      loginEndpoint={LOGIN_ENDPOINT}
      redirectTo="/dashboard"
      onSuccess={(data) => saveSession(data as unknown as AuthSession)}
      footer={
        <p className="text-muted-foreground text-center text-sm">
          Don&apos;t have an account?{" "}
          <Link
            href="/register"
            className="text-primary font-medium hover:underline"
          >
            Sign up
          </Link>
        </p>
      }
    />
  );
}
