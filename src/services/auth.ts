/**
 * @file Authentication service (BFF + ZITADEL OIDC)
 * @description Frontend auth is handled via backend BFF endpoints.
 *   Login/logout are full-page redirects to the backend, which manages
 *   the OIDC flow with ZITADEL and stores tokens in HttpOnly cookies.
 */

const API_BASE_URL = import.meta.env.VITE_API_URL + '/user-ms/v1'
const CLIENT_TYPE = 'merchant'

// ---------- Backward-compatible type exports (used by product.ts etc.) ----------

/** Generic API response wrapper */
export interface BaseResponse<T = unknown> {
  code: number
  data?: T
  err_msg?: string
}

/** HTTP status code constants */
export const HTTP_STATUS = {
  OK: 200,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500
} as const

// ---------- Utility ----------

/**
 * Extract a human-readable error message from various error shapes.
 */
export const handleAPIError = (
  error: BaseResponse | { message?: string } | Error,
  defaultMessage = 'An error occurred',
): string => {
  if (error && typeof error === 'object' && 'err_msg' in error && error.err_msg) {
    return error.err_msg
  }
  if (error && typeof error === 'object' && 'message' in error && error.message) {
    return error.message
  }
  return defaultMessage
}

// ---------- BFF Auth methods ----------

/**
 * Redirect the browser to the backend BFF OAuth-login endpoint.
 * The backend will start the OIDC Authorization Code (PKCE) flow
 * and redirect the user to ZITADEL's hosted login page.
 */
export function login(): void {
  window.location.href = `${API_BASE_URL}/${CLIENT_TYPE}/oauth-login`
}

/**
 * Redirect the browser to the backend BFF OAuth-logout endpoint.
 * The backend will clear the session / HttpOnly cookie and
 * optionally redirect to ZITADEL's end-session endpoint.
 */
export function logout(): void {
  window.location.href = `${API_BASE_URL}/${CLIENT_TYPE}/oauth-logout`
}

// ---------- Session check ----------

let _authChecked = false
let _isAuthenticated = false

/**
 * Verify whether the current session is authenticated by making a
 * lightweight API call (order-stats) and inspecting the HTTP status.
 *
 * The result is cached for the lifetime of the page so that subsequent
 * route navigations do not trigger extra network requests.
 */
export async function checkAuth(): Promise<boolean> {
  if (_authChecked) return _isAuthenticated

  try {
    const response = await fetch(
      `${import.meta.env.VITE_API_URL}/order-ms/v1/merchant/order-stats`,
      { method: 'GET', credentials: 'include' },
    )
    _isAuthenticated = response.status !== 401
    _authChecked = true
    return _isAuthenticated
  } catch {
    // Network error – assume not authenticated
    _isAuthenticated = false
    _authChecked = true
    return false
  }
}

/**
 * Invalidate the cached auth status.
 * Call this whenever a 401 response is received from any API call
 * so the next route navigation triggers re-authentication.
 */
export function invalidateAuth(): void {
  _authChecked = false
  _isAuthenticated = false
}
