/**
 * @file Role service
 * @description Fetches and caches user roles from the backend.
 *   Roles are fetched once per page session (similar to auth check)
 *   and cached in module-level variables.
 */

const API_BASE_URL = import.meta.env.VITE_API_URL + '/user-ms/v1'

// ---------- Role constants ----------

export type Role = 'merchant_admin' | 'product_editor' | 'product_auditor'

export const ROLES = {
  ADMIN: 'merchant_admin' as Role,
  EDITOR: 'product_editor' as Role,
  AUDITOR: 'product_auditor' as Role,
} as const

// ---------- Cache ----------

let _rolesFetched = false
let _roles: string[] = []

// ---------- Core API ----------

/**
 * Fetch user roles from the backend and cache the result.
 * Subsequent calls return the cached value unless invalidated.
 */
export async function fetchRoles(): Promise<string[]> {
  if (_rolesFetched) return _roles

  try {
    const response = await fetch(`${API_BASE_URL}/merchant/users/self/roles`, {
      method: 'GET',
      credentials: 'include',
    })

    if (!response.ok) {
      console.warn('Failed to fetch roles, status:', response.status)
      _roles = []
      _rolesFetched = true
      return _roles
    }

    const data = await response.json()
    // Expected: { code: 200, data: ["merchant_admin"] }
    if (data?.code === 200 && Array.isArray(data.data)) {
      _roles = data.data
    } else {
      console.warn('Unexpected roles response format:', data)
      _roles = []
    }
  } catch (err) {
    console.error('Error fetching roles:', err)
    _roles = []
  }

  _rolesFetched = true
  return _roles
}

/**
 * Synchronous getter — returns the cached roles array.
 * Returns empty array if roles have not been fetched yet.
 */
export function getRoles(): string[] {
  return _roles
}

// ---------- Role check helpers ----------

export function hasRole(role: string): boolean {
  return _roles.includes(role)
}

export function isAdmin(): boolean {
  return _roles.includes(ROLES.ADMIN)
}

export function isEditor(): boolean {
  return _roles.includes(ROLES.EDITOR)
}

export function isAuditor(): boolean {
  return _roles.includes(ROLES.AUDITOR)
}

/**
 * Check if the user can edit products (admin or editor).
 */
export function canEditProducts(): boolean {
  return isAdmin() || isEditor()
}

/**
 * Check if the user can review/audit products (admin or auditor).
 */
export function canReviewProducts(): boolean {
  return isAdmin() || isAuditor()
}

// ---------- Cache invalidation ----------

/**
 * Invalidate the cached roles so the next fetchRoles() call
 * will re-fetch from the backend.
 */
export function invalidateRoles(): void {
  _rolesFetched = false
  _roles = []
}

