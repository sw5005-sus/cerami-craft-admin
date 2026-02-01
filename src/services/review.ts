/**
 * @file 评论API服务
 * @description 管理评论相关的API调用
 */

// 后端通用响应格式
export interface ApiResponse {
  status: number
  msg?: string
  error?: string
}

// 评论列表请求参数
export interface ReviewListRequest {
  product_id?: number  // 产品ID,0表示所有产品
  stars?: number       // 星级筛选,0表示所有星级
}

// 评论信息类型 - 匹配后端真实返回格式
export interface ReviewInfo {
  id: string
  content: string
  user_id: number
  product_id: number
  parent_id: string
  stars: number
  is_anonymous: boolean
  is_pinned: boolean
  pic_info: string[]
  created_at: string
  likes: number
  current_user_liked: boolean
}

// 评论列表响应 - 后端使用 status 字段
export interface ReviewListResponse {
  status: number
  data?: ReviewInfo[]
  msg?: string
  error?: string
}

// 回复评论请求
export interface ReplyReviewRequest {
  content: string
  is_anonymous: boolean
  parentID: string
  pic_info?: string[]
  productID: number
  stars: number
}

// 回复评论响应
export interface ReplyReviewResponse extends ApiResponse {
  data?: {
    review_id: string
    reply_text: string
    reply_date: string
  }
}

/**
 * 获取评论列表
 * @param params 筛选参数
 * @returns 评论列表
 */
export const getReviewList = async (params: ReviewListRequest = {}): Promise<ReviewListResponse> => {
  try {
    const response = await fetch('/api/comment-ms/v1/merchant/reviews/list', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'Content-Type': 'application/json',
      },
      credentials: 'include',  // 包含cookies
      body: JSON.stringify({
        product_id: params.product_id || 0,
        stars: params.stars || 0
      })
    })

    const data = await response.json()
    return data
  } catch (error) {
    console.error('Failed to fetch review list:', error)
    throw error
  }
}

/**
 * 回复评论
 * @param params 回复参数
 * @returns 回复结果
 */
export const replyToReview = async (params: ReplyReviewRequest): Promise<ReplyReviewResponse> => {
  try {
    // 新API: POST /reviews/:review_id/reply
  const response = await fetch(`/api/comment-ms/v1/merchant/reviews/${params.parentID}/replies`, {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'Content-Type': 'application/json',
      },
      credentials: 'include',  // 包含cookies
      body: JSON.stringify({
        content: params.content,
        is_anonymous: params.is_anonymous,
        pic_info: params.pic_info,
        productID: params.productID,
        stars: params.stars
      })
    })

    const data: ReplyReviewResponse = await response.json()
    return data
  } catch (error) {
    console.error('Failed to reply to review:', error)
    return {
      status: 500,
      error: 'Failed to reply to review'
    }
  }
}

/**
 * 删除评论
 * @param reviewId 评论ID
 * @returns 删除结果
 */
export const deleteReview = async (reviewId: string): Promise<ApiResponse> => {
  try {
    const response = await fetch(`/api/comment-ms/v1/merchant/review/${reviewId}`, {
      method: 'DELETE',
      headers: {
        'accept': 'application/json',
      },
      credentials: 'include'  // 包含cookies
    })

    const data: ApiResponse = await response.json()
    return data
  } catch (error) {
    console.error('Failed to delete review:', error)
    return {
      status: 500,
      error: 'Failed to delete review'
    }
  }
}

/**
 * 置顶/取消置顶评论
 * @param reviewId 评论ID
 * @param isPinned 是否置顶
 * @returns 操作结果
 */
export const togglePinReview = async (reviewId: string, isPinned: boolean): Promise<ApiResponse> => {
  try {
    const response = await fetch(`/api/comment-ms/v1/merchant/reviews/${reviewId}`, {
      method: 'PATCH',
      headers: {
        'accept': 'application/json',
        'Content-Type': 'application/json',
      },
      credentials: 'include',  // 包含cookies
      body: JSON.stringify({ is_pinned: isPinned })
    })

    const data: ApiResponse = await response.json()
    return data
  } catch (error) {
    console.error('Failed to toggle pin review:', error)
    return {
      status: 500,
      error: 'Failed to toggle pin review'
    }
  }
}
