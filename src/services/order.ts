/**
 * @file 订单API服务
 * @description 管理订单相关的API调用
 */

// API基础配置
const API_BASE_URL = '/api/order-ms/v1'

// 订单状态枚举
export enum OrderStatus {
  CREATED = 1,    // 已创建
  PAID = 2,       // 已支付
  SHIPPED = 3,    // 已发货
  DELIVERED = 4,  // 已送达
  CONFIRMED = 5,  // 已确认收货
  CANCELLED = 6   // 已取消
}

// 订单状态名称映射（英文 -> 中文）
export const OrderStatusNames: Record<string, string> = {
  'Created': 'Created',
  'Paid': 'Paid',
  'Shipped': 'Shipped',
  'Delivered': 'Delivered',
  'Confirmed': 'Confirmed',
  'Cancelled': 'Cancelled'
}

// 订单状态样式映射
export const OrderStatusClassMap: Record<string, string> = {
  'Created': 'status-created',
  'Paid': 'status-paid',
  'Shipped': 'status-shipped',
  'Delivered': 'status-delivered',
  'Confirmed': 'status-confirmed',
  'Cancelled': 'status-cancelled'
}

// 订单基础信息类型（列表中显示）
export interface OrderInfoInList {
  order_no: string
  receiver_first_name: string
  receiver_last_name: string
  receiver_phone: string
  create_time: string
  total_amount: number
  status: string
}

// 订单商品详情
export interface OrderItemDetail {
  id: number
  product_id: number
  product_name: string
  price: number
  quantity: number
  total_price: number
  create_time: string
  update_time: string
}

// 订单状态日志
export interface OrderStatusLogDetail {
  id: number
  current_status: number
  status_name: string
  create_time: string
  remark: string
}

// 订单详情
export interface OrderDetail {
  order_no: string
  user_id: number
  status: number
  status_name: string
  total_amount: number
  pay_amount: number
  shipping_fee: number
  tax: number
  pay_time: string
  create_time: string
  update_time: string
  delivery_time: string
  confirm_time: string
  receiver_first_name: string
  receiver_last_name: string
  receiver_phone: string
  receiver_address: string
  receiver_country: string
  receiver_zip_code: number
  remark: string
  logistics_no: string
  order_items: OrderItemDetail[]
  status_logs: OrderStatusLogDetail[]
}

// 订单列表请求参数
export interface ListOrderRequest {
  limit: number
  offset: number
  order_no?: string
  order_status?: number
  user_id?: number
  start_time?: string
  end_time?: string
}

// 订单列表响应
export interface ListOrderResponse {
  orders: OrderInfoInList[]
  total: number
}

// API响应格式（订单服务使用不同的响应格式）
export interface OrderApiResponse<T = unknown> {
  status: number
  data?: T
  msg?: string
  error?: string
}

// 订单统计接口返回类型（基于实际后端响应）
export interface OrderStats {
  total_sales: number         // 总销售额（分）
  total_orders: number        // 总订单数
  avg_sales_per_order: number // 平均订单金额（分）
  total_customers: number     // 总客户数
}

export interface OrderStatsResponse {
  total_sales: number
  total_orders: number
  avg_sales_per_order: number
  total_customers: number
}

// 订单API服务类
export class OrderAPI {
  /**
   * 获取订单列表
   * @param params 查询参数
   * @returns Promise<OrderApiResponse<ListOrderResponse>>
   */
  static async getOrderList(params: ListOrderRequest): Promise<OrderApiResponse<ListOrderResponse>> {
    const response = await fetch(`${API_BASE_URL}/merchant/orders/list`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
      credentials: 'include'  // 包含cookies
    })

    return response.json()
  }

  /**
   * 获取订单详情
   * @param orderNo 订单号
   * @returns Promise<OrderApiResponse<OrderDetail>>
   */
  static async getOrderDetail(orderNo: string): Promise<OrderApiResponse<OrderDetail>> {
    const response = await fetch(`${API_BASE_URL}/merchant/orders/${orderNo}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include'  // 包含cookies
    })

    return response.json()
  }

  /**
   * 发货
   * @param orderNo 订单号
   * @param trackingNo 物流单号
   * @returns Promise<OrderApiResponse<void>>
   */
  static async shipOrder(orderNo: string, trackingNo: string): Promise<OrderApiResponse<void>> {
    const response = await fetch(`${API_BASE_URL}/merchant/orders/${orderNo}/ship`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tracking_no: trackingNo
      }),
      credentials: 'include'  // 包含cookies
    })

    return response.json()
  }

  /**
   * 获取订单统计数据（Dashboard 使用）
   * 后端接口路径: /merchant/order-stats
   * 返回格式: { status: 0, data: { total_sales, total_orders, avg_sales_per_order, total_customers }, msg: "ok", error: "" }
   */
  static async getOrderStats(): Promise<OrderApiResponse<OrderStatsResponse>> {
    const response = await fetch(`${API_BASE_URL}/merchant/order-stats`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include'
    })

    // 如果不是 2xx，尝试读取返回的错误信息并返回一个包含 error 的结构，方便上层处理
    if (!response.ok) {
      let errBody: Record<string, unknown> = {}
      try {
        errBody = await response.json() as Record<string, unknown>
      } catch {
        // ignore parse errors
      }

      return {
        status: response.status,
        error: errBody?.error ?? errBody?.msg ?? `HTTP ${response.status}`
      } as unknown as OrderApiResponse<OrderStatsResponse>
    }

    return response.json()
  }

  /**
   * 检查API响应是否成功
   * @param response API响应
   * @returns boolean
   */
  static isSuccess(response: OrderApiResponse): boolean {
    return response.status === 0
  }

  /**
   * 格式化金额显示（分转元）
   * @param amount 金额（分）
   * @returns string 格式化后的金额字符串
   */
  static formatAmount(amount: number): string {
    return (amount / 100).toFixed(2)
  }

  /**
   * 格式化日期显示
   * @param dateString 日期字符串
   * @returns string 格式化后的日期字符串
   */
  static formatDate(dateString: string): string {
    if (!dateString || dateString === '0001-01-01T00:00:00Z') {
      return '-'
    }
    
    const date = new Date(dateString)
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  /**
   * 获取订单状态的样式类名
   * @param status 订单状态（英文字符串）
   * @returns string CSS类名
   */
  static getStatusClass(status: string): string {
    return OrderStatusClassMap[status] || 'status-unknown'
  }

  /**
   * 获取订单状态的中文名称
   * @param status 订单状态（英文字符串）
   * @returns string 中文状态名称
   */
  static getStatusName(status: string): string {
    return OrderStatusNames[status] || status
  }
}