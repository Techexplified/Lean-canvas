// Single source of truth for member's Trello authentication token for Link Canvas.
//
// Stored in Trello's member-scoped private plugin storage:
// `t.set('member', 'private', 'token', token)`.
// It is scoped to that single member on the current board and cannot be read
// by any other board member. It is never stored in external servers.

export const APP_KEY = import.meta.env.VITE_TRELLO_APP_KEY;
export const APP_NAME = "Link Canvas";

// Shared message tag validated by authorized.js and AuthPopup.jsx
export const AUTH_MESSAGE_SOURCE = "link-canvas-auth";

import { safeTrelloGet, safeTrelloSet, safeTrelloRemove } from "./trelloStorage.js";

const TOKEN_KEY = "token";

/**
 * Retrieves the stored token from Trello member-private storage.
 * @param {object} t - Trello Power-Up client instance
 * @returns {Promise<string|null>}
 */
export function getToken(t) {
  return safeTrelloGet(t, "member", "private", TOKEN_KEY);
}

/**
 * Saves the authenticated token into Trello member-private storage.
 * @param {object} t - Trello Power-Up client instance
 * @param {string} token - Trello member OAuth token
 * @returns {Promise<void>}
 */
export function saveToken(t, token) {
  return safeTrelloSet(t, "member", "private", TOKEN_KEY, token);
}

/**
 * Clears the stored token from Trello member-private storage.
 * @param {object} t - Trello Power-Up client instance
 * @returns {Promise<void>}
 */
export function clearToken(t) {
  return safeTrelloRemove(t, "member", "private", TOKEN_KEY);
}

/**
 * Checks whether the member currently has an authorized token.
 * @param {object} t - Trello Power-Up client instance
 * @returns {Promise<boolean>}
 */
export async function isAuthorized(t) {
  const token = await getToken(t);
  return Boolean(token);
}

/**
 * Constructs the Trello OAuth authorization URL for Link Canvas.
 * @param {string} returnUrl - Full URL to authorized.html on the current origin
 * @returns {string} Complete authorization URL
 */
export function buildAuthorizeUrl(returnUrl) {
  const params = new URLSearchParams({
    expiration: "never",
    name: APP_NAME,
    scope: "read,write",
    response_type: "token",
    key: APP_KEY || "",
    return_url: returnUrl,
  });

  return `https://trello.com/1/authorize?${params.toString()}`;
}
