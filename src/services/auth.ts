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

const LOGIN_ATTEMPT_KEY = 'auth_login_attempted'
const ZITADEL_LOGOUT_TRIED_KEY = 'auth_zitadel_logout_tried'
const MAX_LOGIN_ATTEMPTS = 2
const ZITADEL_END_SESSION = 'https://cerami-t6ihrd.us1.zitadel.cloud/oidc/v1/end_session'

/**
 * Redirect the browser to the backend BFF OAuth-login endpoint.
 *
 * Recovery strategy for stale / cross-app cookies:
 *
 *  1. First 2 attempts: normal redirect to oauth-login.
 *  2. After 2 failures AND we haven't tried ZITADEL yet:
 *     fire-and-forget fetch(backend-logout), then redirect
 *     to ZITADEL end_session to kill the IdP session.
 *     ZITADEL redirects back → fresh login flow starts.
 *  3. After 2 more failures (ZITADEL end_session didn't help):
 *     show a static error page for manual recovery.
 */
export function login(): void {
  const attempts = Number(sessionStorage.getItem(LOGIN_ATTEMPT_KEY) || '0')

  if (attempts >= MAX_LOGIN_ATTEMPTS) {
    // Reset the login counter for a potential next cycle
    sessionStorage.removeItem(LOGIN_ATTEMPT_KEY)

    // Have we already tried ZITADEL end_session?
    if (sessionStorage.getItem(ZITADEL_LOGOUT_TRIED_KEY)) {
      // Exhausted all options → show error page
      sessionStorage.removeItem(ZITADEL_LOGOUT_TRIED_KEY)
      showAuthErrorPage()
      return
    }

    // ---- First time hitting the limit: try ZITADEL end_session ----
    sessionStorage.setItem(ZITADEL_LOGOUT_TRIED_KEY, '1')

    // Fire-and-forget: try to clear our backend's HttpOnly cookie
    fetch(`${API_BASE_URL}/${CLIENT_TYPE}/oauth-logout`, {
      method: 'GET',
      credentials: 'include',
    }).catch(() => { /* ignore */ })

    // Redirect to ZITADEL end_session to kill the IdP session.
    // post_logout_redirect_uri brings the user back to our app
    // (must be registered in ZITADEL console; if not, user lands
    // on ZITADEL's "logged out" page and can navigate back).
    const url = new URL(ZITADEL_END_SESSION)
    url.searchParams.set('post_logout_redirect_uri', globalThis.location.origin)
    globalThis.location.href = url.toString()
    return
  }

  // On retries, also try clearing the backend cookie (fire-and-forget)
  if (attempts > 0) {
    fetch(`${API_BASE_URL}/${CLIENT_TYPE}/oauth-logout`, {
      method: 'GET',
      credentials: 'include',
    }).catch(() => { /* ignore */ })
  }

  sessionStorage.setItem(LOGIN_ATTEMPT_KEY, String(attempts + 1))
  globalThis.location.href = `${API_BASE_URL}/${CLIENT_TYPE}/oauth-login`
}

/**
 * Redirect the browser to the backend BFF OAuth-logout endpoint.
 * The backend will clear the session / HttpOnly cookie and
 * optionally redirect to ZITADEL's end-session endpoint.
 */
export function logout(): void {
  sessionStorage.removeItem(LOGIN_ATTEMPT_KEY)
  sessionStorage.removeItem(ZITADEL_LOGOUT_TRIED_KEY)
  globalThis.location.href = `${API_BASE_URL}/${CLIENT_TYPE}/oauth-logout`
}

/**
 * Render a full-page error screen when the login loop cannot be
 * broken automatically (e.g. stale HttpOnly cookie that the backend
 * logout endpoint also rejects).
 */
function showAuthErrorPage(): void {
  const loginUrl = `${API_BASE_URL}/${CLIENT_TYPE}/oauth-login`

  document.body.innerHTML = `
    <div style="
      display:flex;flex-direction:column;align-items:center;justify-content:center;
      min-height:100vh;font-family:system-ui,-apple-system,sans-serif;
      background:#f9fafb;color:#1f2937;text-align:center;padding:24px;
    ">
      <div style="
        background:white;border-radius:16px;padding:40px 32px;
        box-shadow:0 4px 24px rgba(0,0,0,.08);max-width:420px;width:100%;
      ">
        <div style="font-size:48px;margin-bottom:16px;">⚠️</div>
        <h2 style="margin:0 0 12px;font-size:22px;font-weight:600;">
          Authentication Error
        </h2>
        <p style="color:#6b7280;font-size:15px;line-height:1.6;margin:0 0 24px;">
          Your session appears to be invalid or belongs to a different account.<br/>
          Please try one of the following:
        </p>
        <ul style="text-align:left;color:#6b7280;font-size:14px;line-height:1.8;margin:0 0 24px;padding-left:20px;">
          <li>Open an <strong>Incognito / Private window</strong> and try again</li>
          <li>Manually clear your browser cookies for this site, then retry</li>
        </ul>
        <a href="${loginUrl}" style="
          display:inline-block;padding:10px 28px;border-radius:8px;
          background:#b94a33;color:white;text-decoration:none;
          font-size:15px;font-weight:500;
        ">Try Login Again</a>
      </div>
    </div>
  `
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
 *
 * On success the login-attempt flag is cleared so future 401s can
 * trigger a fresh login redirect.
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

    // Auth succeeded → clear all login-loop flags
    if (_isAuthenticated) {
      sessionStorage.removeItem(LOGIN_ATTEMPT_KEY)
      sessionStorage.removeItem(ZITADEL_LOGOUT_TRIED_KEY)
    }

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
