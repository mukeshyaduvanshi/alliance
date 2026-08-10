import { ApiClient } from "@cj/utils";

import {
  getAccessToken,
  getRefreshToken,
  updateTokens,
  clearSession,
} from "@/lib/session";

export const api = new ApiClient({
  getAccessToken,
  getRefreshToken,
  refreshPath: "/vendor-auth/refresh",
  onTokensRefreshed: (accessToken, refreshToken) => {
    updateTokens(accessToken, refreshToken);
  },
  onUnauthorized: () => {
    clearSession();
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
  },
});
