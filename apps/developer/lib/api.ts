import { ApiClient } from "@cj/utils";

import { getAccessToken, clearSession } from "@/lib/session";

export const api = new ApiClient({
  getAccessToken,
  onUnauthorized: () => {
    clearSession();
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
  },
});
