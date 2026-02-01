<template>
  <div class="dashboard">
    <h1 class="page-title">Dashboard</h1>

    <!-- 统计卡片 -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-content">
          <div class="stat-main">
            <div class="stat-value">{{ totalSalesDisplay }}</div>
            <div class="stat-label">Total Sales</div>
          </div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-content">
          <div class="stat-main">
            <div class="stat-value">{{ totalOrdersDisplay }}</div>
            <div class="stat-label">Total Orders</div>
          </div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-content">
          <div class="stat-main">
            <div class="stat-value">{{ avgOrderDisplay }}</div>
            <div class="stat-label">Average Order</div>
          </div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-content">
          <div class="stat-main">
            <div class="stat-value">{{ totalCustomersDisplay }}</div>
            <div class="stat-label">Total Customers</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 最近销售表格 -->
    <div class="sales-section">
      <div class="section-header">
        <h2 class="section-title">Recent Sales</h2>
        <button class="view-all-btn" @click="() => { router.push({ name: 'Orders' }) }">View All</button>
      </div>

      <div v-if="errorMsg" class="error-message">{{ errorMsg }}</div>

      <div v-if="loading" class="loading-spinner">
        Loading...
      </div>

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
            <tr v-for="sale in recentSales" :key="sale.id" class="order-row">
              <td class="order-no">{{ sale.id }}</td>
              <td>
                <div class="buyer-info">
                  <div class="buyer-name">{{ sale.customer }}</div>
                </div>
              </td>
              <td>{{ sale.phone }}</td>
              <td class="amount">{{ sale.amount }}</td>
              <td>
                <span :class="['status-badge', `status-${(sale.status||'unknown').toString().toLowerCase()}`]">
                  {{ sale.status || '—' }}
                </span>
              </td>
              <td>{{ sale.date }}</td>
              <td>
                <div class="action-buttons">
                  <button class="btn btn-secondary" @click="viewDetails(sale.id)">View Details</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import type { OrderInfoInList } from '../services/order'
import { OrderAPI } from '../services/order'

interface Sale {
  id: string
  customer: string
  date: string
  amount: string
  status: string
  phone?: string
}

const recentSales = ref<Sale[]>([])
const loading = ref(false)
const errorMsg = ref('')

// Dashboard stats
const totalSales = ref<number | null>(null) // 分
const totalOrders = ref<number | null>(null)
const avgOrder = ref<number | null>(null) // 分
const totalCustomers = ref<number | null>(null)

const totalSalesDisplay = ref<string>('$—')
const totalOrdersDisplay = ref<string>('—')
const avgOrderDisplay = ref<string>('$—')
const totalCustomersDisplay = ref<string>('—')

const router = useRouter()

function viewDetails(id: string) {
  // route defined as /orders/:id
  router.push({ name: 'OrderDetail', params: { id } })
}

// Load recent orders from backend on mount
onMounted(async () => {
  loading.value = true
  errorMsg.value = ''
  // load stats in parallel with orders
  const statsPromise = (async () => {
    try {
      const resp = await OrderAPI.getOrderStats()
      // 打印原始响应，便于在浏览器 console 或后端联调时查看实际结构
      console.debug('getOrderStats raw response:', resp)

      // 后端返回格式: { status:0, data: { total_sales, total_orders, avg_sales_per_order, total_customers } }
      // 使用 Record<string, unknown> 来安全处理后端返回的动态字段
      const payload: Record<string, unknown> = (resp?.data as unknown as Record<string, unknown>) ?? {}

      // 辅助解析：从对象中安全读取 number 类型字段
      const readNumber = (obj: Record<string, unknown>, key: string): number | null => {
        if (!obj) return null
        const v = obj[key]
        return typeof v === 'number' ? v : null
      }

      const totalSalesVal = readNumber(payload, 'total_sales')
      const totalOrdersVal = readNumber(payload, 'total_orders')
      // 后端返回的字段名是 avg_sales_per_order
      const avgOrderVal = readNumber(payload, 'avg_sales_per_order')
      const totalCustomersVal = readNumber(payload, 'total_customers')

      // 赋值并格式化显示（金额假定为分）
      totalSales.value = totalSalesVal
      totalOrders.value = totalOrdersVal
      avgOrder.value = avgOrderVal
      totalCustomers.value = totalCustomersVal

      totalSalesDisplay.value = totalSales.value !== null ? `$${(totalSales.value / 100).toFixed(2)}` : '$—'
      totalOrdersDisplay.value = totalOrders.value !== null ? String(totalOrders.value) : '—'
      avgOrderDisplay.value = avgOrder.value !== null ? `$${(avgOrder.value / 100).toFixed(2)}` : '$—'
      totalCustomersDisplay.value = totalCustomers.value !== null ? String(totalCustomers.value) : '—'
      // 如果后端返回了错误信息，且是认证相关，则在界面显示友好提示
      if (resp && resp.error) {
        const err = resp.error
        console.warn('Order stats returned error:', err)
        if (typeof err === 'string' && err.toLowerCase().includes('auth')) {
          errorMsg.value = '统计数据需要登录或会话已过期，请重新登录。'
        }
      }
    } catch (err) {
      console.error('Failed loading order stats:', err)
    }
  })()
  try {
    const response = await fetch('/api/order-ms/v1/merchant/orders/list', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ limit: 5, offset: 0 }),
      credentials: 'include'
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const resp = await response.json()
    console.debug('Home getOrderList response:', resp)

    if (resp && resp.data) {
      const list = resp.data.orders || []

      recentSales.value = list.map((o: OrderInfoInList) => {
        const date = o.create_time ? new Date(o.create_time).toLocaleString() : '—'
        const amount = typeof o.total_amount === 'number' ? `$${(o.total_amount / 100).toFixed(2)}` : '—'
        const customerName = [o.receiver_first_name, o.receiver_last_name].filter(Boolean).join(' ') || '—'

        return {
          id: o.order_no || '—',
          customer: customerName,
          phone: o.receiver_phone || '—',
          date,
          amount,
          status: o.status || '—'
        }
      })
    } else {
      console.warn('Unexpected response format:', resp)
      errorMsg.value = '获取订单数据失败，请稍后重试'
    }
  } catch (err: unknown) {
    console.error('Failed loading recent orders:', err)
    if (err instanceof Error) {
      errorMsg.value = err.message || 'Failed to load recent orders'
    } else {
      errorMsg.value = String(err) || 'Failed to load recent orders'
    }
  } finally {
    loading.value = false
  }
  // ensure statsPromise resolved (if not awaited before)
  try { await statsPromise } catch { /* ignore */ }
})
</script>

<style scoped>
.dashboard {
  width: 100%;
  padding: 24px 32px;
  background: #f8f9fa;
  min-height: 100vh;
  box-sizing: border-box;
}

.page-title {
  font-size: 28px;
  font-weight: 600;
  color: #1a1a1a;
  margin: 0 0 24px 0;
}

/* 统计卡片 */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  margin-bottom: 32px;
}

.stat-card {
  background: white;
  border-radius: 8px;
  padding: 20px 24px;
  border: 1px solid #e5e7eb;
}

.stat-content {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.stat-main {
  flex: 1;
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
  color: #1a1a1a;
  margin-bottom: 6px;
}

.stat-label {
  font-size: 13px;
  color: #6b7280;
  font-weight: 400;
}

.stat-change {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  font-weight: 600;
  padding: 4px 0;
}

.stat-change.positive {
  color: #10b981;
}

.stat-change.negative {
  color: #ef4444;
}

.stat-change i {
  font-size: 10px;
}

/* 销售部分 */
.sales-section {
  background: white;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  overflow: hidden;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #e5e7eb;
}

.section-title {
  font-size: 18px;
  font-weight: 600;
  color: #1a1a1a;
  margin: 0;
}

.view-all-btn {
  background: none;
  border: none;
  color: #ea6844;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  padding: 0;
  transition: color 0.2s;
}

.view-all-btn:hover {
  color: #d9603d;
}

/* 表格 */
.table-container {
  overflow-x: auto;
}

.sales-table {
  width: 100%;
  border-collapse: collapse;
}

.sales-table thead {
  background: #f9fafb;
}

.sales-table th {
  padding: 12px 24px;
  text-align: left;
  font-size: 11px;
  font-weight: 600;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.sales-table tbody tr {
  border-bottom: 1px solid #f3f4f6;
  transition: background-color 0.2s;
}

.sales-table tbody tr:hover {
  background: #f9fafb;
}

.sales-table tbody tr:last-child {
  border-bottom: none;
}

.sales-table td {
  padding: 16px 24px;
  font-size: 14px;
  color: #4b5563;
}

.order-id {
  font-weight: 600;
  color: #1a1a1a;
}

.date {
  color: #6b7280;
}

.amount {
  font-weight: 600;
  color: #1a1a1a;
}

/* 状态徽章 */
.status-badge {
  display: inline-block;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
}

.status-paid {
  background-color: #fef3c7;
  color: #92400e;
}

.status-shipped {
  background-color: #d1fae5;
  color: #065f46;
}

.status-cancelled {
  background-color: #fee2e2;
  color: #991b1b;
}

/* 操作按钮 */
.action-btn {
  background: none;
  border: none;
  color: #9ca3af;
  cursor: pointer;
  padding: 4px 8px;
  font-size: 14px;
  transition: color 0.2s;
}

.action-btn:hover {
  color: #4b5563;
}

/* 错误和加载状态 */
.error-message {
  color: #ef4444;
  padding: 16px 24px;
  background: #fee2e2;
  border-radius: 4px;
  margin: 12px 24px;
  font-size: 14px;
}

.loading-spinner {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 32px;
  color: #6b7280;
}

/* 响应式设计 */
@media (max-width: 1400px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .dashboard {
    padding: 16px;
  }

  .page-title {
    font-size: 24px;
  }

  .stats-grid {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  .stat-card {
    padding: 16px 20px;
  }

  .section-header {
    padding: 16px 20px;
  }

  .sales-table th,
  .sales-table td {
    padding: 12px 16px;
    font-size: 13px;
  }

  .stat-value {
    font-size: 24px;
  }
}

@media (max-width: 640px) {
  .table-container {
    overflow-x: scroll;
  }

  .sales-table {
    min-width: 800px;
  }
}

/* copy orders-table styles from OrderList to keep consistent look */
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

.status-created { background: #fef3c7; color: #92400e; }
.status-paid { background: #dbeafe; color: #1e40af; }
.status-shipped { background: #fce7f3; color: #ec4899; }
.status-delivered { background: #d1fae5; color: #065f46; }
.status-confirmed { background: #dcfce7; color: #166534; }
.status-cancelled { background: #fecaca; color: #991b1b; }
.status-unknown { background: #f3f4f6; color: #374151; }

.btn {
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  border: none;
  transition: all 0.2s;
}

.btn-secondary {
  background: #f3f4f6;
  color: #374151;
  border: 1px solid #d1d5db;
}

.btn-secondary:hover { background: #e5e7eb }
</style>