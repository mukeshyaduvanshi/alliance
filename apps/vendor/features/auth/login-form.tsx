"use client";

import { LoginForm as UiLoginForm } from "@cj/ui";
import { saveSession, type AuthSession } from "@cj/utils";

const LOGIN_ENDPOINT = `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1"}/vendor-auth/login`;

export function LoginForm() {
  return (
    <UiLoginForm
      portalName="Cjalliance Vendor Portal"
      loginEndpoint={LOGIN_ENDPOINT}
      redirectTo="/dashboard"
      onSuccess={(data) => saveSession(data as unknown as AuthSession)}
    />
  );
}
