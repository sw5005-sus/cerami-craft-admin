<template>
  <div class="audit-logs-page">
    <!-- Page Header -->
    <div class="page-header">
      <h1 class="page-title">Audit Logs</h1>
      <p class="page-subtitle">View and verify merchant operation logs</p>
    </div>

    <!-- Filters Section -->
    <div class="filters-section">
      <div class="filters-row">
        <div class="filter-group date-filter-group">
          <label>Time Range</label>
          <div class="date-range">
            <input
              v-model="filters.startTime"
              type="datetime-local"
              class="filter-input date-input"
              placeholder="Start time"
            />
            <span class="date-separator">to</span>
            <input
              v-model="filters.endTime"
              type="datetime-local"
              class="filter-input date-input"
              placeholder="End time"
            />
          </div>
        </div>

        <div class="filter-group">
          <label>User ID</label>
          <input
            v-model="filters.userId"
            type="text"
            placeholder="Enter user ID"
            class="filter-input"
            @keyup.enter="handleSearch"
          />
        </div>

        <div class="filter-group">
          <label>Service</label>
          <input
            v-model="filters.service"
            type="text"
            placeholder="e.g. product-ms"
            class="filter-input"
            @keyup.enter="handleSearch"
          />
        </div>
      </div>

      <div class="filters-actions">
        <button @click="handleSearch" class="btn-primary" :disabled="loading">
          <svg v-if="loading" class="loading-icon-inline" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none" opacity="0.25"/>
            <path fill="currentColor" opacity="0.75" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
          </svg>
          {{ loading ? 'Searching...' : 'Search' }}
        </button>
        <button @click="handleReset" class="btn-secondary">Reset</button>
        <button @click="handleVerify" class="btn-verify" :disabled="verifying">
          <svg v-if="verifying" class="loading-icon-inline" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none" opacity="0.25"/>
            <path fill="currentColor" opacity="0.75" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
          </svg>
          <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M9 12l2 2 4-4"/>
            <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/>
          </svg>
          {{ verifying ? 'Verifying...' : 'Verify Integrity' }}
        </button>
      </div>
    </div>

    <!-- Table Section -->
    <div class="table-section">
      <!-- Loading State -->
      <div v-if="loading" class="loading-state">
        <div class="loading-spinner">
          <svg class="loading-icon" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none" opacity="0.25"/>
            <path fill="currentColor" opacity="0.75" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
          </svg>
        </div>
        <p>Loading logs...</p>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="error-state">
        <div class="error-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="15" y1="9" x2="9" y2="15"/>
            <line x1="9" y1="9" x2="15" y2="15"/>
          </svg>
        </div>
        <p class="error-message">{{ error }}</p>
        <button @click="loadLogs" class="btn-primary">Retry</button>
      </div>

      <!-- Empty State -->
      <div v-else-if="displayLogs.length === 0" class="empty-state">
        <div class="empty-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14,2 14,8 20,8"/>
            <line x1="16" y1="13" x2="8" y2="13"/>
            <line x1="16" y1="17" x2="8" y2="17"/>
            <polyline points="10,9 9,9 8,9"/>
          </svg>
        </div>
        <p class="empty-message">No audit logs found</p>
        <p class="empty-description">
          {{ hasActiveFilters ? 'Try adjusting your search criteria' : 'No audit logs recorded yet' }}
        </p>
      </div>

      <!-- Log Table -->
      <div v-else class="table-container">
        <table class="logs-table">
          <thead>
            <tr>
              <th>TIME</th>
              <th>ACTOR ID</th>
              <th>ROLE</th>
              <th>SERVICE</th>
              <th>DETAILS</th>
              <th>STATUS</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="log in displayLogs"
              :key="log.id"
              :class="{ 'failed-row': failedLogId === log.id }"
            >
              <td class="col-time">{{ formatTime(log.occurred_at) }}</td>
              <td class="col-actor">{{ log.actor_id }}</td>
              <td class="col-role">
                <span :class="['role-tag', roleTagClass(log.role)]">{{ formatRole(log.role) }}</span>
              </td>
              <td class="col-service">{{ log.service }}</td>
              <td class="col-details">
                <div v-if="parsedDesc(log.description)" class="desc-parsed">
                  <span :class="['method-badge', methodClass(parsedDesc(log.description)!.method)]">
                    {{ parsedDesc(log.description)!.method }}
                  </span>
                  <code class="desc-path">{{ parsedDesc(log.description)!.path }}</code>
                  <span class="desc-status-code" :class="descStatusClass(parsedDesc(log.description)!.status)">
                    {{ parsedDesc(log.description)!.status }}
                  </span>
                  <div v-if="parsedDesc(log.description)!.body" class="desc-body">
                    <code>{{ parsedDesc(log.description)!.body }}</code>
                  </div>
                </div>
                <pre v-else class="desc-raw">{{ log.description }}</pre>
              </td>
              <td class="col-flag">
                <span v-if="failedLogId === log.id" class="failed-badge">FAILED</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Pagination -->
    <div v-if="displayLogs.length > 0 && !isVerifyResultMode" class="pagination-section">
      <div class="pagination-info">
        <label class="page-size-label">Per page:</label>
        <select v-model.number="pageSize" @change="handlePageSizeChange" class="page-size-select">
          <option :value="5">5</option>
          <option :value="10">10</option>
          <option :value="15">15</option>
        </select>
        <span class="page-current">Page {{ currentPage }}</span>
      </div>
      <div class="pagination-controls">
        <button
          @click="changePage(currentPage - 1)"
          :disabled="currentPage <= 1"
          class="pagination-btn"
        >
          Previous
        </button>
        <button
          @click="changePage(currentPage + 1)"
          :disabled="!hasNextPage"
          class="pagination-btn"
        >
          Next
        </button>
      </div>
    </div>

    <!-- Verify result mode hint -->
    <div v-if="isVerifyResultMode" class="verify-result-hint">
      <span>Showing full verification results.</span>
      <button @click="exitVerifyMode" class="btn-link">Return to paginated view</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, reactive } from 'vue'
import {
  getAuditLogs,
  verifyAuditLogs,
  parseDescription,
  type AuditLog,
  type AuditLogDescription,
} from '../services/auditLog'
import { notification } from '../utils/notification'

// ---------- State ----------

const loading = ref(false)
const verifying = ref(false)
const error = ref('')
const logs = ref<AuditLog[]>([])

const filters = reactive({
  startTime: '',
  endTime: '',
  userId: '',
  service: '',
})

// Pagination (server-side offset/limit)
const currentPage = ref(1)
const pageSize = ref(5)
const hasNextPage = ref(false)

// Verify result mode: when verify completes, show the full dataset
const isVerifyResultMode = ref(false)
const failedLogId = ref<string | null>(null)

// ---------- Computed ----------

const hasActiveFilters = computed(() => {
  return !!(filters.startTime || filters.endTime || filters.userId || filters.service)
})

/**
 * In normal mode, show `logs` as-is.
 * In verify-result mode, pin the failed log (if any) to the top.
 */
const displayLogs = computed<AuditLog[]>(() => {
  if (!failedLogId.value) return logs.value

  const failed = logs.value.find((l) => l.id === failedLogId.value)
  const rest = logs.value.filter((l) => l.id !== failedLogId.value)
  return failed ? [failed, ...rest] : logs.value
})

// ---------- Description parsing cache (avoid re-parsing per render) ----------

const descCache = new Map<string, AuditLogDescription | null>()

function parsedDesc(raw: string): AuditLogDescription | null {
  if (descCache.has(raw)) return descCache.get(raw)!
  const parsed = parseDescription(raw)
  descCache.set(raw, parsed)
  return parsed
}

// ---------- API calls ----------

/** Fetch paginated logs (normal mode). */
async function loadLogs(): Promise<void> {
  loading.value = true
  error.value = ''
  try {
    const offset = (currentPage.value - 1) * pageSize.value
    const res = await getAuditLogs({
      user_id: filters.userId || undefined,
      service: filters.service || undefined,
      start_time: filters.startTime ? new Date(filters.startTime).toISOString() : undefined,
      end_time: filters.endTime ? new Date(filters.endTime).toISOString() : undefined,
      offset,
      limit: pageSize.value,
    })

    if (Array.isArray(res.data)) {
      logs.value = res.data
      // If backend returned exactly `limit` rows there *might* be a next page
      hasNextPage.value = res.data.length >= pageSize.value
    } else {
      logs.value = []
      hasNextPage.value = false
    }
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to load audit logs'
    logs.value = []
  } finally {
    loading.value = false
  }
}

/** Fetch ALL logs (for verify-result mode), optionally filtered by time range. */
async function loadAllLogs(startTime?: string, endTime?: string): Promise<void> {
  loading.value = true
  error.value = ''
  try {
    const res = await getAuditLogs({
      start_time: startTime,
      end_time: endTime,
    })
    logs.value = Array.isArray(res.data) ? res.data : []
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to load audit logs'
    logs.value = []
  } finally {
    loading.value = false
  }
}

// ---------- Actions ----------

function handleSearch(): void {
  exitVerifyMode()
  currentPage.value = 1
  loadLogs()
}

function handleReset(): void {
  filters.startTime = ''
  filters.endTime = ''
  filters.userId = ''
  filters.service = ''
  exitVerifyMode()
  currentPage.value = 1
  loadLogs()
}

function handlePageSizeChange(): void {
  currentPage.value = 1
  loadLogs()
}

function changePage(page: number): void {
  if (page < 1) return
  currentPage.value = page
  loadLogs()
}

function exitVerifyMode(): void {
  isVerifyResultMode.value = false
  failedLogId.value = null
}

async function handleVerify(): Promise<void> {
  const hasTimeRange = !!(filters.startTime && filters.endTime)

  if (!hasTimeRange) {
    const ok = globalThis.confirm(
      'No time range selected — this will perform a full verification of ALL logs, which may take a long time.\n\nContinue?',
    )
    if (!ok) return
  }

  verifying.value = true

  try {
    const startIso = filters.startTime ? new Date(filters.startTime).toISOString() : undefined
    const endIso = filters.endTime ? new Date(filters.endTime).toISOString() : undefined

    const res = await verifyAuditLogs(startIso, endIso)
    const result = res.data

    if (result.is_valid) {
      notification.success(result.message || 'All logs verified successfully.', 'Verification Passed')
    } else {
      notification.error(
        result.message || 'Log integrity check failed!',
        'Verification Failed',
      )
      failedLogId.value = result.failed_log_ids || null
    }

    // Switch to verify-result mode and reload data
    isVerifyResultMode.value = true
    await loadAllLogs(startIso, endIso)
  } catch (err) {
    notification.error(
      err instanceof Error ? err.message : 'Verification request failed',
      'Error',
    )
  } finally {
    verifying.value = false
  }
}

// ---------- Formatting helpers ----------

function formatTime(iso: string): string {
  if (!iso) return '-'
  const d = new Date(iso)
  return d.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  })
}

function formatRole(role: string): string {
  switch (role) {
    case 'merchant_admin':
      return 'Admin'
    case 'product_editor':
      return 'Editor'
    case 'product_auditor':
      return 'Auditor'
    default:
      return role
  }
}

function roleTagClass(role: string): string {
  switch (role) {
    case 'merchant_admin':
      return 'role-admin'
    case 'product_editor':
      return 'role-editor'
    case 'product_auditor':
      return 'role-auditor'
    default:
      return ''
  }
}

function methodClass(method: string): string {
  switch (method.toUpperCase()) {
    case 'POST':
      return 'method-post'
    case 'PUT':
    case 'PATCH':
      return 'method-patch'
    case 'DELETE':
      return 'method-delete'
    default:
      return 'method-get'
  }
}

function descStatusClass(status: number): string {
  if (status >= 200 && status < 300) return 'status-ok'
  if (status >= 400) return 'status-err'
  return ''
}

// ---------- Lifecycle ----------

onMounted(() => {
  loadLogs()
})
</script>

<style scoped>
.audit-logs-page {
  padding: 24px;
  max-width: 1400px;
  margin: 0 auto;
}

/* Page Header */
.page-header {
  margin-bottom: 32px;
}

.page-title {
  font-size: 28px;
  font-weight: 600;
  color: #1a1a1a;
  margin: 0 0 8px 0;
}

.page-subtitle {
  font-size: 16px;
  color: #666;
  margin: 0;
}

/* Filters */
.filters-section {
  background: white;
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.filters-row {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr;
  gap: 16px;
  margin-bottom: 16px;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.filter-group label {
  font-size: 13px;
  font-weight: 600;
  color: #374151;
}

.date-range {
  display: flex;
  align-items: center;
  gap: 8px;
}

.date-separator {
  color: #9ca3af;
  font-size: 13px;
  flex-shrink: 0;
}

.filter-input {
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 14px;
  color: #1f2937;
  background: white;
  transition: border-color 0.2s;
}

.filter-input:focus {
  outline: none;
  border-color: #b94a33;
  box-shadow: 0 0 0 3px rgba(185, 74, 51, 0.1);
}

.date-input {
  flex: 1;
  min-width: 0;
}

.filters-actions {
  display: flex;
  gap: 10px;
  align-items: center;
}

.btn-primary,
.btn-secondary,
.btn-verify {
  padding: 8px 20px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s;
  border: none;
}

.btn-primary {
  background: #b94a33;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #a3402d;
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-secondary {
  background: white;
  color: #374151;
  border: 1px solid #d1d5db;
}

.btn-secondary:hover {
  background: #f9fafb;
  border-color: #9ca3af;
}

.btn-verify {
  background: #059669;
  color: white;
  margin-left: auto;
}

.btn-verify:hover:not(:disabled) {
  background: #047857;
}

.btn-verify:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-link {
  background: none;
  border: none;
  color: #b94a33;
  cursor: pointer;
  text-decoration: underline;
  font-size: 14px;
  padding: 0 4px;
}

.btn-link:hover {
  color: #a3402d;
}

/* Loading / Error / Empty */
.loading-state,
.error-state,
.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #6b7280;
}

.loading-spinner {
  display: inline-flex;
}

.loading-icon {
  width: 36px;
  height: 36px;
  animation: spin 1s linear infinite;
  color: #b94a33;
}

.loading-icon-inline {
  width: 16px;
  height: 16px;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.error-icon svg,
.empty-icon svg {
  width: 48px;
  height: 48px;
  color: #9ca3af;
  margin-bottom: 12px;
}

.error-icon svg {
  color: #ef4444;
}

.error-message,
.empty-message {
  font-size: 16px;
  font-weight: 500;
  color: #374151;
  margin: 8px 0 4px;
}

.empty-description {
  font-size: 14px;
  color: #9ca3af;
}

/* Table */
.table-section {
  background: white;
  border-radius: 12px;
  padding: 0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.table-container {
  overflow-x: auto;
}

.logs-table {
  width: 100%;
  border-collapse: collapse;
}

.logs-table thead {
  background: #f9fafb;
}

.logs-table th {
  padding: 14px 16px;
  text-align: left;
  font-size: 12px;
  font-weight: 600;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-bottom: 1px solid #e5e7eb;
  white-space: nowrap;
}

.logs-table td {
  padding: 14px 16px;
  font-size: 14px;
  color: #374151;
  border-bottom: 1px solid #f3f4f6;
  vertical-align: top;
}

.logs-table tbody tr:hover {
  background: #f9fafb;
}

/* Failed row highlight */
.failed-row {
  background: #fef2f2 !important;
  border-left: 4px solid #ef4444;
}

.failed-badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 700;
  background: #ef4444;
  color: white;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* Column helpers */
.col-time {
  white-space: nowrap;
  font-size: 13px;
  color: #6b7280;
}

.col-actor {
  font-weight: 500;
}

/* Role tags */
.role-tag {
  display: inline-block;
  padding: 2px 10px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;
}

.role-admin {
  background: #ede9fe;
  color: #6d28d9;
}

.role-editor {
  background: #dbeafe;
  color: #1d4ed8;
}

.role-auditor {
  background: #d1fae5;
  color: #047857;
}

/* Description */
.desc-parsed {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  max-width: 500px;
}

.method-badge {
  display: inline-block;
  padding: 1px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 700;
  color: white;
  text-transform: uppercase;
  flex-shrink: 0;
}

.method-post {
  background: #2563eb;
}

.method-patch {
  background: #d97706;
}

.method-delete {
  background: #dc2626;
}

.method-get {
  background: #059669;
}

.desc-path {
  font-size: 13px;
  color: #374151;
  word-break: break-all;
}

.desc-status-code {
  font-size: 12px;
  font-weight: 600;
  padding: 1px 6px;
  border-radius: 4px;
  flex-shrink: 0;
}

.status-ok {
  background: #d1fae5;
  color: #065f46;
}

.status-err {
  background: #fef2f2;
  color: #991b1b;
}

.desc-body {
  width: 100%;
  margin-top: 4px;
}

.desc-body code {
  font-size: 12px;
  color: #6b7280;
  word-break: break-all;
  background: #f3f4f6;
  padding: 2px 6px;
  border-radius: 4px;
  display: inline-block;
  max-width: 100%;
}

.desc-raw {
  font-size: 12px;
  color: #6b7280;
  white-space: pre-wrap;
  word-break: break-all;
  margin: 0;
  max-width: 500px;
}

/* Pagination */
.pagination-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 0;
}

.pagination-info {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 14px;
  color: #6b7280;
}

.page-size-label {
  font-weight: 500;
  font-size: 14px;
  color: #374151;
}

.page-size-select {
  padding: 6px 10px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
  color: #374151;
  background: white;
  cursor: pointer;
}

.page-current {
  font-weight: 500;
  color: #374151;
}

.pagination-controls {
  display: flex;
  gap: 8px;
}

.pagination-btn {
  padding: 8px 16px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  background: white;
  font-size: 14px;
  color: #374151;
  cursor: pointer;
  transition: all 0.2s;
}

.pagination-btn:hover:not(:disabled) {
  background: #f9fafb;
  border-color: #9ca3af;
}

.pagination-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Verify result hint */
.verify-result-hint {
  text-align: center;
  padding: 16px;
  font-size: 14px;
  color: #6b7280;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
}

/* Responsive */
@media (max-width: 1024px) {
  .filters-row {
    grid-template-columns: 1fr;
  }

  .desc-parsed {
    max-width: 300px;
  }
}

@media (max-width: 768px) {
  .audit-logs-page {
    padding: 16px;
  }

  .filters-actions {
    flex-wrap: wrap;
  }

  .btn-verify {
    margin-left: 0;
  }

  .pagination-section {
    flex-direction: column;
    gap: 12px;
  }
}
</style>


