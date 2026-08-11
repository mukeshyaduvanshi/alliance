import {
  getSession as getSessionRaw,
  saveSession as saveSessionRaw,
  clearSession as clearSessionRaw,
  getAccessToken as getAccessTokenRaw,
  getRefreshToken as getRefreshTokenRaw,
  updateSessionTokens as updateTokensRaw,
  type AuthSession,
} from "@cj/utils";

const PORTAL = "vendor";

export const session = {
  get: () => getSessionRaw(PORTAL),
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

export function getRefreshToken() {
  return getRefreshTokenRaw(PORTAL);
}

export function updateTokens(accessToken: string, refreshToken?: string) {
  updateTokensRaw(accessToken, refreshToken, PORTAL);
}

export function getSession() {
  return getSessionRaw(PORTAL);
}
