import { getSession, saveSession, clearSession, getAccessToken } from "@cj/utils";

export const session = {
  get: getSession,
  save: saveSession,
  clear: clearSession,
  getAccessToken,
};

export { getSession, saveSession, clearSession, getAccessToken };
