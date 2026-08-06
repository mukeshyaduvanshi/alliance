"use client";

import { LoginForm as UiLoginForm } from "@cj/ui";
import type { AuthSession } from "@cj/utils";

import { saveSession } from "@/lib/session";

const LOGIN_ENDPOINT = `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1"}/brand-auth/login`;

export function LoginForm() {
  return (
    <UiLoginForm
      portalName="Cjalliance Brand Portal"
      loginEndpoint={LOGIN_ENDPOINT}
      redirectTo="/dashboard"
      onSuccess={(data) => saveSession(data as unknown as AuthSession)}
    />
  );
}
