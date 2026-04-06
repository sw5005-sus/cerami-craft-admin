/**
 * @file Audit Log service
 * @description API calls for admin audit log listing and integrity verification.
 */

const API_BASE_URL = import.meta.env.VITE_API_URL + '/admin-ms/v1'

// ---------- Types ----------

/** A single audit log entry returned by the backend. */
export interface AuditLog {
  id: string
  service: string
  actor_id: number
  role: string
  description: string
  occurred_at: string
  created_at: string
}

/** Parsed description payload embedded in AuditLog.description. */
export interface AuditLogDescription {
  method: string
  path: string
  body: string
  status: number
}

/** Query parameters for the audit-log list endpoint. */
export interface AuditLogListParams {
  user_id?: string
  service?: string
  start_time?: string
  end_time?: string
  offset?: number
  limit?: number
}

/** Backend response wrapper for audit-log list. */
export interface AuditLogListResponse {
  code: number
  data: AuditLog[]
}

/** Result of the verification endpoint. */
export interface VerifyResult {
  is_valid: boolean
  failed_log_ids: string
  message: string
}

/** Backend response wrapper for verification. */
export interface VerifyResponse {
  code: number
  data: VerifyResult
}

// ---------- Helpers ----------

/**
 * Build a query-string from an object, omitting entries whose value is
 * `undefined`, `null` or empty-string.
 */
function buildQuery(params: Record<string, string | number | undefined>): string {
  const parts: string[] = []
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') {
      parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
    }
  }
  return parts.length > 0 ? `?${parts.join('&')}` : ''
}

/**
 * Safely parse the JSON `description` field of an audit log.
 * Returns `null` when parsing fails.
 */
export function parseDescription(raw: string): AuditLogDescription | null {
  try {
    return JSON.parse(raw) as AuditLogDescription
  } catch {
    return null
  }
}

// ---------- API calls ----------

/**
 * Fetch a (possibly paginated) list of audit logs.
 */
export async function getAuditLogs(params: AuditLogListParams): Promise<AuditLogListResponse> {
  const query = buildQuery({
    user_id: params.user_id,
    service: params.service,
    start_time: params.start_time,
    end_time: params.end_time,
    offset: params.offset,
    limit: params.limit,
  })

  const response = await fetch(`${API_BASE_URL}/merchant/audit-logs${query}`, {
    method: 'GET',
    credentials: 'include',
  })

  return response.json() as Promise<AuditLogListResponse>
}

/**
 * Verify log integrity for an optional time window.
 * Omit both parameters for full (all-time) verification.
 */
export async function verifyAuditLogs(
  startTime?: string,
  endTime?: string,
): Promise<VerifyResponse> {
  const query = buildQuery({
    start_time: startTime,
    end_time: endTime,
  })

  const response = await fetch(`${API_BASE_URL}/merchant/audit-logs/verify${query}`, {
    method: 'GET',
    credentials: 'include',
  })

  return response.json() as Promise<VerifyResponse>
}

