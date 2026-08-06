import {
  getSession,
  saveSession as saveSessionRaw,
  clearSession as clearSessionRaw,
  getAccessToken as getAccessTokenRaw,
  type AuthSession,
} from "@cj/utils";

const PORTAL = "vendor";

export const session = {
  get: () => getSession(PORTAL),
  save: (s: AuthSession) => saveSessionRaw(s, PORTAL),
  clear: () => clearSessionRaw(PORTAL),
  getAccessToken: () => getAccessTokenRaw(PORTAL),
};

export function saveSession(s: AuthSession) {
  saveSessionRaw(s, PORTAL);
}

export function clearSession() {
  clearSessionRaw(PORTAL);
}

export function getAccessToken() {
  return getAccessTokenRaw(PORTAL);
}

export { getSession };
