<template>
  <div class="order-detail-page">
    <!-- 页面顶部导航 -->
    <div class="page-header">
      <button @click="goBack" class="back-btn">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M19 12H5"/>
          <path d="M12 19l-7-7 7-7"/>
        </svg>
        Back to Order List
      </button>
      <h1 class="page-title">Order Details</h1>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="loading-state">
      <div class="loading-spinner">
        <svg class="loading-icon" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none" opacity="0.25"/>
          <path fill="currentColor" opacity="0.75" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
        </svg>
      </div>
      <p>Loading order details...</p>
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
      <button @click="loadOrderDetail" class="btn-primary">Reload</button>
    </div>

    <!-- 订单详情内容 -->
    <div v-else-if="orderDetail" class="order-content">
      <!-- 第一行：订单基本信息 + 收货信息 -->
      <div class="panel-row">
        <!-- 订单基本信息面板 -->
        <div class="info-panel">
          <div class="panel-header">
            <h2>Order Information</h2>
            <div class="order-status">
              <span :class="['status-badge', OrderAPI.getStatusClass(orderDetail.status_name)]">
                {{ OrderAPI.getStatusName(orderDetail.status_name) }}
              </span>
            </div>
          </div>

          <div class="info-grid">
            <div class="info-item">
              <label>Order Number</label>
              <span class="order-no">{{ orderDetail.order_no }}</span>
            </div>
            <div class="info-item">
              <label>Customer ID</label>
              <span>{{ orderDetail.user_id }}</span>
            </div>
            <div class="info-item">
              <label>Create Time</label>
              <span>{{ OrderAPI.formatDate(orderDetail.create_time) }}</span>
            </div>
            <div class="info-item">
              <label>Payment Time</label>
              <span>{{ OrderAPI.formatDate(orderDetail.pay_time) }}</span>
            </div>
            <div class="info-item">
              <label>Delivery Time</label>
              <span>{{ OrderAPI.formatDate(orderDetail.delivery_time) }}</span>
            </div>
            <div class="info-item">
              <label>Tracking Number</label>
              <span>{{ orderDetail.logistics_no || '-' }}</span>
            </div>
            <div class="info-item full-width">
              <label>Remark</label>
              <span>{{ orderDetail.remark || 'None' }}</span>
            </div>
          </div>
        </div>

        <!-- 收货信息面板 -->
        <div class="info-panel">
          <div class="panel-header">
            <h2>Shipping Information</h2>
          </div>

          <div class="info-grid">
            <div class="info-item">
              <label>Receiver</label>
              <span>{{ orderDetail.receiver_last_name }}{{ orderDetail.receiver_first_name }}</span>
            </div>
            <div class="info-item">
              <label>Phone</label>
              <span>{{ orderDetail.receiver_phone }}</span>
            </div>
            <div class="info-item">
              <label>Country/Region</label>
              <span>{{ orderDetail.receiver_country }}</span>
            </div>
            <div class="info-item">
              <label>Postal Code</label>
              <span>{{ orderDetail.receiver_zip_code }}</span>
            </div>
            <div class="info-item full-width">
              <label>Address</label>
              <span>{{ orderDetail.receiver_address }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 第二行：订单商品 + 订单金额 -->
      <div class="panel-row">
        <!-- 订单商品表格 -->
        <div class="items-panel">
          <div class="panel-header">
            <h2>Order Items</h2>
            <span class="items-count">{{ orderDetail.order_items.length }} items total</span>
          </div>

          <div class="items-table-container">
            <table class="items-table">
              <thead>
                <tr>
                  <th>Product ID</th>
                  <th>Product Name</th>
                  <th>Price</th>
                  <th>Qty</th>
                  <th>Subtotal</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in orderDetail.order_items" :key="item.id" class="item-row">
                  <td class="product-id">{{ item.product_id }}</td>
                  <td class="product-name">{{ item.product_name }}</td>
                  <td class="price">¥{{ OrderAPI.formatAmount(item.price) }}</td>
                  <td class="quantity">{{ item.quantity }}</td>
                  <td class="total-price">¥{{ OrderAPI.formatAmount(item.total_price) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- 订单金额汇总 -->
        <div class="summary-panel">
          <div class="panel-header">
            <h2>Order Amount</h2>
          </div>

          <div class="summary-grid">
            <div class="summary-row">
              <span class="summary-label">Items Total</span>
              <span class="summary-value">¥{{ OrderAPI.formatAmount(getItemsTotal()) }}</span>
            </div>
            <div class="summary-row">
              <span class="summary-label">Shipping Fee</span>
              <span class="summary-value">¥{{ OrderAPI.formatAmount(orderDetail.shipping_fee) }}</span>
            </div>
            <div class="summary-row">
              <span class="summary-label">Tax</span>
              <span class="summary-value">¥{{ OrderAPI.formatAmount(orderDetail.tax) }}</span>
            </div>
            <div class="summary-row total">
              <span class="summary-label">Order Total</span>
              <span class="summary-value">¥{{ OrderAPI.formatAmount(orderDetail.total_amount) }}</span>
            </div>
            <div v-if="orderDetail.pay_amount > 0" class="summary-row">
              <span class="summary-label">Amount Paid</span>
              <span class="summary-value paid">¥{{ OrderAPI.formatAmount(orderDetail.pay_amount) }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 状态时间线 -->
      <div v-if="displayStatusLogs && displayStatusLogs.length > 0" class="timeline-panel">
        <div class="panel-header">
          <h2>Status History</h2>
        </div>

        <div class="timeline-container">
          <div v-for="(log, index) in displayStatusLogs" :key="log.id" class="timeline-item">
            <div class="timeline-marker">
              <div class="timeline-dot"></div>
              <div v-if="index < displayStatusLogs.length - 1" class="timeline-line"></div>
            </div>
            <div class="timeline-content">
              <div class="timeline-status">{{ log.status_name }}</div>
              <div class="timeline-time">{{ OrderAPI.formatDate(log.create_time) }}</div>
              <div v-if="log.remark" class="timeline-remark">{{ log.remark }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- 操作按钮区域 -->
      <div class="actions-panel">
        <div class="actions-grid">
          <button 
            v-if="canShipOrder" 
            @click="showShipDialog = true" 
            class="btn-primary"
          >
            Ship Order
          </button>
          <button @click="printOrder" class="btn-secondary">
            Print Order
          </button>
          <button @click="exportOrder" class="btn-secondary">
            Export Order
          </button>
        </div>
      </div>
    </div>

    <!-- Ship Order 对话框 -->
    <div v-if="showShipDialog" class="dialog-overlay" @click.self="closeShipDialog">
      <div class="dialog-content">
        <div class="dialog-header">
          <h2>Ship Order #{{ orderDetail?.order_no }}</h2>
        </div>

        <div class="dialog-body">
          <div class="customer-info">
            <h3>Customer Information</h3>
            <div class="customer-details">
              <p class="customer-name">
                {{ orderDetail?.receiver_last_name }}{{ orderDetail?.receiver_first_name }}
              </p>
              <p class="customer-email">{{ orderDetail?.receiver_phone }}</p>
            </div>
          </div>

          <div class="form-group">
            <label for="trackingNumber">Tracking Number</label>
            <input
              id="trackingNumber"
              v-model="trackingNumber"
              type="text"
              placeholder="Enter tracking number"
              class="form-input"
              @keyup.enter="confirmShipment"
            />
            <p class="form-hint">This tracking number will be sent to the customer so they can track their shipment.</p>
          </div>

          <div v-if="shipError" class="error-alert">
            {{ shipError }}
          </div>
        </div>

        <div class="dialog-footer">
          <button @click="closeShipDialog" class="btn-secondary" :disabled="isShipping">
            Cancel
          </button>
          <button @click="confirmShipment" class="btn-primary" :disabled="isShipping || !trackingNumber.trim()">
            <span v-if="isShipping">Shipping...</span>
            <span v-else>Confirm Shipment</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { OrderAPI, type OrderDetail } from '../services/order'

const router = useRouter()
const route = useRoute()

// 响应式数据
const loading = ref(false)
const error = ref('')
const orderDetail = ref<OrderDetail | null>(null)
const showShipDialog = ref(false)
const trackingNumber = ref('')
const isShipping = ref(false)
const shipError = ref('')

// 计算属性
const canShipOrder = computed(() => {
  if (!orderDetail.value) return false
  // 只在 Paid 状态下显示 Ship Order 按钮
  return orderDetail.value.status_name === 'Paid'
})

// 修复后端缺失的状态日志：如果订单已发货但status_logs中没有记录，前端补充显示
const displayStatusLogs = computed(() => {
  if (!orderDetail.value || !orderDetail.value.status_logs) return []
  
  const logs = [...orderDetail.value.status_logs]
  
  // 检查是否已有 Shipped 状态的日志
  const hasShippedLog = logs.some(log => log.current_status === 3 || log.status_name === 'Shipped')
  
  // 如果订单状态是 Shipped (3) 但日志中没有对应记录，补充一个临时记录用于显示
  if (orderDetail.value.status === 3 && !hasShippedLog) {
    logs.push({
      id: 999, // 临时ID
      current_status: 3,
      status_name: 'Shipped',
      remark: 'Paid --> Shipped',
      create_time: orderDetail.value.delivery_time || orderDetail.value.update_time
    })
  }
  
  return logs
})

// 方法
const loadOrderDetail = async () => {
  // 支持不同路由参数名（同事代码里可能用的是 `id`）
  const rawParam = (route.params.orderNo ?? route.params.id ?? route.params.order_no ?? '') as string
  const orderNo = rawParam ? String(rawParam).trim() : ''
  if (!orderNo) {
    error.value = 'Invalid order number parameter'
    return
  }

  try {
    loading.value = true
    error.value = ''

    const response = await OrderAPI.getOrderDetail(orderNo)

    if (OrderAPI.isSuccess(response) && response.data) {
      orderDetail.value = response.data
      // 调试日志：查看状态历史
      console.log('Order detail loaded:', {
        order_no: response.data.order_no,
        status: response.data.status,
        status_name: response.data.status_name,
        status_logs_count: response.data.status_logs?.length || 0,
        status_logs: response.data.status_logs
      })
    } else {
      throw new Error(response.error || 'Failed to fetch order details')
    }
  } catch (err) {
    console.error('Failed to load order detail:', err)
    error.value = err instanceof Error ? err.message : 'Network error, please try again later'
  } finally {
    loading.value = false
  }
}

const getItemsTotal = (): number => {
  if (!orderDetail.value) return 0
  return orderDetail.value.order_items.reduce((total, item) => total + item.total_price, 0)
}

const goBack = () => {
  router.push('/orders')
}

const printOrder = () => {
  window.print()
}

const exportOrder = () => {
  // 这里可以实现导出功能
  console.log('Export order:', orderDetail.value?.order_no)
}

const closeShipDialog = () => {
  showShipDialog.value = false
  trackingNumber.value = ''
  shipError.value = ''
}

const confirmShipment = async () => {
  if (!orderDetail.value || !trackingNumber.value.trim()) {
    shipError.value = 'Please enter a tracking number'
    return
  }

  try {
    isShipping.value = true
    shipError.value = ''

    const response = await OrderAPI.shipOrder(
      orderDetail.value.order_no,
      trackingNumber.value.trim()
    )

    if (OrderAPI.isSuccess(response)) {
      // 关闭对话框并显示成功提示
      closeShipDialog()
      alert('Order shipped successfully!')
      
      // 等待一小段时间让后端完成状态更新，然后重新加载订单详情
      await new Promise(resolve => setTimeout(resolve, 500))
      await loadOrderDetail()
    } else {
      throw new Error(response.msg || response.error || 'Failed to ship order')
    }
  } catch (err) {
    console.error('Failed to ship order:', err)
    shipError.value = err instanceof Error ? err.message : 'Failed to ship order, please try again'
  } finally {
    isShipping.value = false
  }
}

// 生命周期
onMounted(() => {
  loadOrderDetail()
})
</script>

<style scoped>
.order-detail-page {
  padding: 24px;
  max-width: 1200px;
  margin: 0 auto;
}

/* 页面头部 */
.page-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 32px;
}

.back-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: #f3f4f6;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  color: #374151;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.back-btn:hover {
  background: #e5e7eb;
}

.back-btn svg {
  width: 16px;
  height: 16px;
}

.page-title {
  font-size: 28px;
  font-weight: 600;
  color: #1a1a1a;
  margin: 0;
}

/* 状态样式 */
.loading-state, .error-state {
  padding: 64px 24px;
  text-align: center;
}

.loading-spinner, .error-icon {
  width: 48px;
  height: 48px;
  margin: 0 auto 16px;
  color: #9ca3af;
}

.loading-icon {
  width: 48px;
  height: 48px;
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

/* 面板样式 */
.panel-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  margin-bottom: 24px;
}

.info-panel, .items-panel, .summary-panel, .timeline-panel, .actions-panel {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

/* 让商品面板占用更多空间 */
.panel-row .items-panel {
  grid-column: 1;
}

.panel-row .summary-panel {
  grid-column: 2;
}

/* 单独的面板（状态历史和操作按钮） */
.timeline-panel, .actions-panel {
  margin-bottom: 24px;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid #e5e7eb;
}

.panel-header h2 {
  font-size: 20px;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
}

.order-status {
  display: flex;
  align-items: center;
}

.status-badge {
  padding: 6px 16px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 500;
}

.status-created { background: #fef3c7; color: #92400e; }
.status-paid { background: #dbeafe; color: #1e40af; }
.status-shipped { background: #fce7f3; color: #ec4899; }
.status-delivered { background: #d1fae5; color: #065f46; }
.status-confirmed { background: #dcfce7; color: #166534; }
.status-cancelled { background: #fecaca; color: #991b1b; }
.status-unknown { background: #f3f4f6; color: #374151; }

/* 信息网格 */
.info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.info-item.full-width {
  grid-column: 1 / -1;
}

.info-item label {
  font-size: 14px;
  font-weight: 500;
  color: #6b7280;
}

.info-item span {
  font-size: 16px;
  color: #1f2937;
}

.order-no {
  font-family: monospace;
  color: #3b82f6;
  font-weight: 500;
}

/* 商品表格 */
.items-count {
  font-size: 14px;
  color: #6b7280;
}

.items-table-container {
  overflow-x: auto;
}

.items-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.items-table th,
.items-table td {
  padding: 10px 8px;
  text-align: left;
  border-bottom: 1px solid #e5e7eb;
}

.items-table th {
  background: #f9fafb;
  font-weight: 600;
  color: #374151;
  font-size: 12px;
  white-space: nowrap;
}

.items-table td {
  font-size: 13px;
  color: #1f2937;
}

.item-row:hover {
  background: #f9fafb;
}

.product-id {
  font-family: monospace;
  color: #3b82f6;
  font-size: 12px;
}

.product-name {
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.price, .total-price {
  font-weight: 600;
  color: #059669;
  white-space: nowrap;
}

.quantity {
  text-align: center;
}

/* 金额汇总 */
.summary-grid {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
}

.summary-row.total {
  border-top: 2px solid #e5e7eb;
  margin-top: 8px;
  padding-top: 16px;
  font-weight: 600;
  font-size: 16px;
}

.summary-label {
  color: #6b7280;
}

.summary-value {
  color: #1f2937;
  font-weight: 500;
}

.summary-value.paid {
  color: #059669;
  font-weight: 600;
}

/* 时间线 */
.timeline-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.timeline-item {
  display: flex;
  gap: 16px;
  position: relative;
}

.timeline-marker {
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
}

.timeline-dot {
  width: 12px;
  height: 12px;
  background: #3b82f6;
  border-radius: 50%;
  border: 3px solid white;
  box-shadow: 0 0 0 2px #3b82f6;
}

.timeline-line {
  width: 2px;
  height: 40px;
  background: #e5e7eb;
  margin-top: 8px;
}

.timeline-content {
  flex: 1;
  padding-bottom: 16px;
}

.timeline-status {
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 4px;
}

.timeline-time {
  font-size: 14px;
  color: #6b7280;
  margin-bottom: 8px;
}

.timeline-remark {
  font-size: 14px;
  color: #374151;
  background: #f9fafb;
  padding: 8px 12px;
  border-radius: 6px;
}

/* 操作按钮 */
.actions-grid {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.btn-primary, .btn-secondary {
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary {
  background: #dc6643;
  color: white;
}

.btn-primary:hover {
  background: #c55a3a;
}

.btn-secondary {
  background: #f3f4f6;
  color: #374151;
  border: 1px solid #d1d5db;
}

.btn-secondary:hover {
  background: #e5e7eb;
}

/* 响应式样式 */
@media (max-width: 1024px) {
  .panel-row {
    grid-template-columns: 1fr;
    gap: 16px;
  }
  
  .panel-row .items-panel,
  .panel-row .summary-panel {
    grid-column: 1;
  }
}

@media (max-width: 768px) {
  .order-detail-page {
    padding: 16px;
  }
  
  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  
  .panel-row {
    grid-template-columns: 1fr;
    gap: 16px;
  }
  
  .info-grid {
    grid-template-columns: 1fr;
    gap: 12px;
  }
  
  .items-table {
    font-size: 12px;
  }
  
  .items-table th,
  .items-table td {
    padding: 8px 6px;
  }
  
  .product-name {
    max-width: 100px;
  }
  
  .actions-grid {
    flex-direction: column;
  }
  
  .btn-primary, .btn-secondary {
    width: 100%;
    justify-content: center;
  }
}

/* Ship Order 对话框样式 */
.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.dialog-content {
  background: white;
  border-radius: 16px;
  max-width: 500px;
  width: 100%;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  animation: slideUp 0.3s ease-out;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.dialog-header {
  padding: 24px;
  border-bottom: 1px solid #e5e7eb;
}

.dialog-header h2 {
  font-size: 24px;
  font-weight: 600;
  color: #1a1a1a;
  margin: 0;
}

.dialog-body {
  padding: 24px;
}

.customer-info {
  margin-bottom: 24px;
}

.customer-info h3 {
  font-size: 14px;
  font-weight: 500;
  color: #6b7280;
  margin: 0 0 12px 0;
}

.customer-details {
  background: #f9fafb;
  padding: 16px;
  border-radius: 8px;
}

.customer-name {
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 4px 0;
}

.customer-email {
  font-size: 14px;
  color: #6b7280;
  margin: 0;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: #374151;
  margin-bottom: 8px;
}

.form-input {
  width: 100%;
  padding: 12px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 14px;
  color: #1f2937;
  transition: all 0.2s;
  box-sizing: border-box;
}

.form-input:focus {
  outline: none;
  border-color: #dc6643;
  box-shadow: 0 0 0 3px rgba(220, 102, 67, 0.1);
}

.form-input::placeholder {
  color: #9ca3af;
}

.form-hint {
  font-size: 12px;
  color: #6b7280;
  margin: 8px 0 0 0;
}

.error-alert {
  padding: 12px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 8px;
  color: #dc2626;
  font-size: 14px;
}

.dialog-footer {
  padding: 16px 24px;
  border-top: 1px solid #e5e7eb;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.dialog-footer .btn-primary,
.dialog-footer .btn-secondary {
  min-width: 120px;
  justify-content: center;
}

.dialog-footer .btn-primary:disabled,
.dialog-footer .btn-secondary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 打印样式 */
@media print {
  .page-header,
  .actions-panel {
    display: none;
  }
  
  .order-detail-page {
    padding: 0;
  }
  
  .info-panel, .items-panel, .summary-panel, .timeline-panel {
    box-shadow: none;
    border: 1px solid #e5e7eb;
    margin-bottom: 16px;
  }

  .dialog-overlay {
    display: none;
  }
}</style>