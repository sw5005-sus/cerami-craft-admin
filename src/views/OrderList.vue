<template>
  <div class="order-list-page">
    <!-- 页面标题 -->
    <div class="page-header">
      <h1 class="page-title">Order Management</h1>
      <p class="page-subtitle">View and manage all orders</p>
    </div>

    <!-- 过滤器区域 -->
    <div class="filters-section">
      <div class="filters-row">
        <div class="filter-group">
          <label>Order Number</label>
          <input 
            v-model="filters.orderNo" 
            type="text" 
            placeholder="Enter order number"
            class="filter-input"
            @keyup.enter="handleSearch"
          />
        </div>
        
        <div class="filter-group">
          <label>Order Status</label>
          <select v-model="filters.orderStatus" class="filter-select">
            <option value="">All Status</option>
            <option value="1">Created</option>
            <option value="2">Paid</option>
            <option value="3">Shipped</option>
            <option value="4">Delivered</option>
            <option value="5">Confirmed</option>
            <option value="6">Cancelled</option>
          </select>
        </div>

        <div class="filter-group">
          <label>Customer ID</label>
          <input 
            v-model="filters.userId" 
            type="number" 
            placeholder="Enter customer ID"
            class="filter-input"
            @keyup.enter="handleSearch"
          />
        </div>

        <div class="filter-group date-filter-group">
          <label>Create Time</label>
          <div class="date-range">
            <input 
              v-model="filters.startTime" 
              type="datetime-local" 
              class="filter-input date-input"
              placeholder="Start time"
              lang="en-US"
            />
            <span class="date-separator">to</span>
            <input 
              v-model="filters.endTime" 
              type="datetime-local" 
              class="filter-input date-input"
              placeholder="End time"
              lang="en-US"
            />
          </div>
        </div>
      </div>

      <div class="filters-actions">
        <button @click="handleSearch" class="btn-primary" :disabled="loading">
          <svg v-if="loading" class="loading-icon" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none" opacity="0.25"/>
            <path fill="currentColor" opacity="0.75" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
          </svg>
          {{ loading ? 'Searching...' : 'Search' }}
        </button>
        <button @click="handleReset" class="btn-secondary">Reset</button>
      </div>
    </div>

    <!-- 订单表格 -->
    <div class="table-section">
      <!-- 加载状态 -->
      <div v-if="loading" class="loading-state">
        <div class="loading-spinner">
          <svg class="loading-icon" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none" opacity="0.25"/>
            <path fill="currentColor" opacity="0.75" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
          </svg>
        </div>
        <p>Loading...</p>
      </div>

      <!-- 错误状态 -->
      <div v-else-if="error" class="error-state">
        <div class="error-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="15" y1="9" x2="9" y2="15"/>
            <line x1="9" y1="9" x2="15" y2="15"/>
          </svg>
        </div>
        <p class="error-message">{{ error }}</p>
        <button @click="loadOrders" class="btn-primary">Retry</button>
      </div>

      <!-- 空状态 -->
      <div v-else-if="orders.length === 0" class="empty-state">
        <div class="empty-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10"/>
          </svg>
        </div>
        <p class="empty-message">No order data</p>
        <p class="empty-description">
          {{ hasActiveFilters ? 'Please try adjusting search criteria' : 'No orders in the system yet' }}
        </p>
      </div>

      <!-- 订单表格 -->
      <div v-else class="table-container">
        <table class="orders-table">
          <thead>
            <tr>
              <th>Order Number</th>
              <th>Customer Info</th>
              <th>Phone</th>
              <th>Order Amount</th>
              <th>Order Status</th>
              <th>Create Time</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="order in orders" :key="order.order_no" class="order-row">
              <td class="order-no">{{ order.order_no }}</td>
              <td class="customer-info">
                {{ order.receiver_last_name }}{{ order.receiver_first_name }}
              </td>
              <td class="phone">{{ order.receiver_phone }}</td>
              <td class="amount">${{ OrderAPI.formatAmount(order.total_amount) }}</td>
              <td class="status">
                <span :class="['status-badge', OrderAPI.getStatusClass(order.status)]">
                  {{ OrderAPI.getStatusName(order.status) }}
                </span>
              </td>
              <td class="create-time">{{ OrderAPI.formatDate(order.create_time) }}</td>
              <td class="actions">
                <button @click="viewOrder(order.order_no)" class="btn-link">View Details</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- 分页组件 -->
    <div v-if="orders.length > 0" class="pagination-section">
      <div class="pagination-info">
        Showing {{ (pagination.current - 1) * pagination.pageSize + 1 }} - 
        {{ Math.min(pagination.current * pagination.pageSize, pagination.total) }} of {{ pagination.total }} records
      </div>
      <div class="pagination-controls">
        <button 
          @click="changePage(pagination.current - 1)" 
          :disabled="pagination.current <= 1"
          class="pagination-btn"
        >
          Previous
        </button>
        
        <div class="page-numbers">
          <button 
            v-for="page in visiblePages" 
            :key="page"
            @click="changePage(page)"
            :class="['page-btn', { active: page === pagination.current }]"
          >
            {{ page }}
          </button>
        </div>
        
        <button 
          @click="changePage(pagination.current + 1)" 
          :disabled="pagination.current >= pagination.totalPages"
          class="pagination-btn"
        >
          Next
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { OrderAPI, type ListOrderRequest, type OrderInfoInList } from '../services/order'

const router = useRouter()

// 响应式数据
const loading = ref(false)
const error = ref('')
const orders = ref<OrderInfoInList[]>([])

// 过滤器状态
const filters = reactive({
  orderNo: '',
  orderStatus: '',
  userId: '',
  startTime: '',
  endTime: ''
})

// 分页状态
const pagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0,
  totalPages: 0
})

// 计算属性
const hasActiveFilters = computed(() => {
  return filters.orderNo || filters.orderStatus || filters.userId || filters.startTime || filters.endTime
})

const visiblePages = computed(() => {
  const pages = []
  const start = Math.max(1, pagination.current - 2)
  const end = Math.min(pagination.totalPages, pagination.current + 2)
  
  for (let i = start; i <= end; i++) {
    pages.push(i)
  }
  
  return pages
})

// 方法
const loadOrders = async () => {
  try {
    loading.value = true
    error.value = ''

    const params: ListOrderRequest = {
      limit: pagination.pageSize,
      offset: (pagination.current - 1) * pagination.pageSize
    }

    // 添加过滤条件
    if (filters.orderNo) params.order_no = filters.orderNo
    if (filters.orderStatus) params.order_status = Number(filters.orderStatus)
    if (filters.userId) params.user_id = Number(filters.userId)
    if (filters.startTime) params.start_time = new Date(filters.startTime).toISOString()
    if (filters.endTime) params.end_time = new Date(filters.endTime).toISOString()

    const response = await OrderAPI.getOrderList(params)

    if (OrderAPI.isSuccess(response) && response.data) {
      orders.value = response.data.orders || []
      pagination.total = response.data.total || 0
      pagination.totalPages = Math.ceil(pagination.total / pagination.pageSize)
    } else {
      throw new Error(response.error || 'Failed to fetch order list')
    }
  } catch (err) {
    console.error('Failed to load orders:', err)
    error.value = err instanceof Error ? err.message : 'Network error, please try again later'
    orders.value = []
    pagination.total = 0
    pagination.totalPages = 0
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  pagination.current = 1
  loadOrders()
}

const handleReset = () => {
  filters.orderNo = ''
  filters.orderStatus = ''
  filters.userId = ''
  filters.startTime = ''
  filters.endTime = ''
  pagination.current = 1
  loadOrders()
}

const changePage = (page: number) => {
  if (page >= 1 && page <= pagination.totalPages) {
    pagination.current = page
    loadOrders()
  }
}

const viewOrder = (orderNo: string) => {
  router.push(`/orders/${orderNo}`)
}

// 生命周期
onMounted(() => {
  loadOrders()
})
</script>

<style scoped>
.order-list-page {
  padding: 24px;
  max-width: 1200px;
  margin: 0 auto;
}

/* 页面标题 */
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

/* 过滤器样式 */
.filters-section {
  background: white;
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.filters-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.date-filter-group {
  grid-column: span 2;
  min-width: 400px;
}

@media (max-width: 1024px) {
  .date-filter-group {
    grid-column: span 1;
    min-width: auto;
  }
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.filter-group label {
  font-size: 14px;
  font-weight: 500;
  color: #374151;
}

.filter-input, .filter-select {
  padding: 10px 12px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 14px;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.filter-input:focus, .filter-select:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.date-range {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.date-input {
  flex: 1;
  min-width: 160px;
}

/* 强制日期输入框使用英文显示 */
.date-input::-webkit-datetime-edit-fields-wrapper {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.date-input::-webkit-datetime-edit-text {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.date-input::-webkit-datetime-edit-month-field,
.date-input::-webkit-datetime-edit-day-field,
.date-input::-webkit-datetime-edit-year-field,
.date-input::-webkit-datetime-edit-hour-field,
.date-input::-webkit-datetime-edit-minute-field {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.date-separator {
  font-size: 14px;
  color: #6b7280;
  white-space: nowrap;
  padding: 0 4px;
}

.filters-actions {
  display: flex;
  gap: 12px;
}

.btn-primary, .btn-secondary, .btn-link {
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 6px;
}

.btn-primary {
  background: #dc6643;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #c55a3a;
}

.btn-primary:disabled {
  background: #9ca3af;
  cursor: not-allowed;
}

.btn-secondary {
  background: #f3f4f6;
  color: #374151;
  border: 1px solid #d1d5db;
}

.btn-secondary:hover {
  background: #e5e7eb;
}

.btn-link {
  background: none;
  color: #dc6643;
  padding: 4px 8px;
}

.btn-link:hover {
  background: #fef3c7;
  color: #c55a3a;
}

/* 表格样式 */
.table-section {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.table-container {
  overflow-x: auto;
}

.orders-table {
  width: 100%;
  border-collapse: collapse;
}

.orders-table th,
.orders-table td {
  padding: 16px;
  text-align: left;
  border-bottom: 1px solid #e5e7eb;
}

.orders-table th {
  background: #f9fafb;
  font-weight: 600;
  color: #374151;
  font-size: 14px;
}

.orders-table td {
  font-size: 14px;
  color: #1f2937;
}

.order-row:hover {
  background: #f9fafb;
}

.order-no {
  color: #3b82f6;
  font-weight: 500;
}

.amount {
  font-weight: 600;
  color: #059669;
}

.status-badge {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
}

.status-created { background: #fef3c7; color: #92400e; }
.status-paid { background: #dbeafe; color: #1e40af; }
.status-shipped { background: #fce7f3; color: #ec4899; }
.status-delivered { background: #d1fae5; color: #065f46; }
.status-confirmed { background: #dcfce7; color: #166534; }
.status-cancelled { background: #fecaca; color: #991b1b; }
.status-unknown { background: #f3f4f6; color: #374151; }

/* 状态样式 */
.loading-state, .error-state, .empty-state {
  padding: 64px 24px;
  text-align: center;
}

.loading-spinner, .error-icon, .empty-icon {
  width: 48px;
  height: 48px;
  margin: 0 auto 16px;
  color: #9ca3af;
}

.loading-icon {
  width: 20px;
  height: 20px;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.error-message {
  color: #dc2626;
  font-size: 16px;
  margin-bottom: 16px;
}

.empty-message {
  font-size: 18px;
  font-weight: 500;
  color: #374151;
  margin-bottom: 8px;
}

.empty-description {
  color: #6b7280;
  margin-bottom: 24px;
}

/* 分页样式 */
.pagination-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 24px;
  padding: 16px 0;
}

.pagination-info {
  font-size: 14px;
  color: #6b7280;
}

.pagination-controls {
  display: flex;
  align-items: center;
  gap: 8px;
}

.pagination-btn, .page-btn {
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  background: white;
  color: #374151;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.pagination-btn:hover:not(:disabled) {
  background: #f3f4f6;
}

.pagination-btn:disabled {
  color: #9ca3af;
  cursor: not-allowed;
}

.page-numbers {
  display: flex;
  gap: 4px;
}

.page-btn.active {
  background: #dc6643;
  color: white;
  border-color: #dc6643;
}

.page-btn:hover:not(.active) {
  background: #f3f4f6;
}

/* 响应式样式 */
@media (max-width: 768px) {
  .order-list-page {
    padding: 16px;
  }
  
  .filters-row {
    grid-template-columns: 1fr;
  }
  
  .date-filter-group {
    grid-column: span 1;
    min-width: auto;
  }
  
  .date-range {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }
  
  .date-separator {
    text-align: center;
    font-weight: 500;
  }
  
  .date-input {
    min-width: auto;
  }
  
  .pagination-section {
    flex-direction: column;
    gap: 16px;
  }
  
  .orders-table {
    font-size: 12px;
  }
  
  .orders-table th,
  .orders-table td {
    padding: 12px 8px;
  }
}

@media (max-width: 480px) {
  .date-range {
    gap: 8px;
  }
  
  .date-separator {
    padding: 4px 0;
  }
}</style>