<template>
  <div class="review-management-page">
    <!-- 页面标题 -->
    <div class="page-header">
      <h1 class="page-title">Review Management</h1>
    </div>

    <!-- 过滤器区域 -->
    <div class="filters-section">
      <div class="filters-row">
        <div class="filter-group search-group">
          <input 
            v-model="filters.searchQuery" 
            type="text" 
            placeholder="Search by product or customer name"
            class="filter-input search-input"
            @keyup.enter="handleSearch"
          >
        </div>

        <div class="filter-group">
          <select v-model="filters.ratingFilter" class="filter-select">
            <option value="">All Ratings</option>
            <option value="5">5 Stars</option>
            <option value="4">4 Stars</option>
            <option value="3">3 Stars</option>
            <option value="2">2 Stars</option>
            <option value="1">1 Star</option>
          </select>
        </div>

        <div class="filter-group">
          <select v-model="filters.statusFilter" class="filter-select">
            <option value="">All Status</option>
            <option value="pinned">Pinned</option>
            <option value="normal">Normal</option>
          </select>
        </div>

        <button @click="handleApplyFilters" class="btn-primary apply-filters-btn">
          Apply Filters
        </button>
      </div>
    </div>

    <!-- 评论表格 -->
    <div class="table-section">
      <!-- 加载状态 -->
      <div v-if="loading" class="loading-state">
        <div class="loading-spinner">
          <svg class="loading-icon" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none" opacity="0.25"/>
            <path fill="currentColor" opacity="0.75" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
          </svg>
        </div>
        <p>Loading reviews...</p>
      </div>

      <!-- 空状态 -->
      <div v-else-if="reviews.length === 0" class="empty-state">
        <div class="empty-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 2L2 7l10 5 10-5-10-5z"/>
            <path d="M2 17l10 5 10-5M2 12l10 5 10-5"/>
          </svg>
        </div>
        <p class="empty-message">No reviews found</p>
        <p class="empty-description">
          {{ hasActiveFilters ? 'Please try adjusting search criteria' : 'No reviews in the system yet' }}
        </p>
      </div>

      <!-- 评论表格 -->
      <div v-else class="table-container">
        <table class="reviews-table">
          <thead>
            <tr>
              <th>REVIEW ID</th>
              <th>PRODUCT</th>
              <th>CUSTOMER</th>
              <th>RATING</th>
              <th>REVIEW</th>
              <th>LIKES</th>
              <th>DATE</th>
              <th>STATUS</th>
              <th>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="review in paginatedReviews" :key="review.id" class="review-row">
              <td class="review-id">{{ review.id }}</td>
              <td class="product-cell">{{ review.product.name }}</td>
              <td class="customer-name">{{ review.customer }}</td>
              <td class="rating-cell">
                <div class="rating-stars">
                  <span v-for="i in 5" :key="i" :class="['star', i <= review.rating ? 'filled' : 'empty']">★</span>
                </div>
              </td>
              <td class="review-text">
                <div class="review-content clickable" @click="replyToReview(review.id)">
                  {{ review.text }}
                  <span v-if="review.text.length > 80" class="view-more-indicator">
                    ... View More →
                  </span>
                </div>
                
                <!-- 简洁的回复标记 -->
                <div v-if="review.hasReply" class="reply-indicator">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="reply-check-icon">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  <span class="reply-badge">
                    Replied
                    <span v-if="review.replyCount && review.replyCount > 1" class="reply-count-badge">
                      ({{ review.replyCount }})
                    </span>
                  </span>
                </div>
              </td>
              <td class="likes-cell">
                <div class="likes-count">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="like-icon">
                    <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path>
                  </svg>
                  <span>{{ review.likes }}</span>
                </div>
              </td>
              <td class="review-date">{{ review.date }}</td>
              <td class="status-cell">
                <span :class="['status-badge', `status-${review.status.toLowerCase()}`]">
                  {{ review.status }}
                </span>
              </td>
              <td class="actions-cell">
                <button class="action-btn reply-btn" @click="replyToReview(review.id)" title="Reply to Customer">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
                  </svg>
                </button>
                <button class="action-btn pin-btn" @click="togglePin(review.id)" :title="review.status === 'Pinned' ? 'Unpin' : 'Pin'">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M12 17v5m-7-5h14l-2-7h-10l-2 7z"/>
                    <path d="M12 3v4"/>
                  </svg>
                </button>
                <button class="action-btn delete-btn" @click="deleteReview(review.id)" title="Delete">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                  </svg>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- 分页信息 -->
    <div v-if="reviews.length > 0" class="pagination-section">
      <div class="pagination-info">
        Showing {{ startIndex }}-{{ endIndex }} of {{ totalReviews }} reviews
      </div>
      <div class="pagination-controls">
        <button 
          @click="goToPage(currentPage - 1)" 
          :disabled="currentPage === 1"
          class="pagination-btn"
        >
          Previous
        </button>
        
        <div class="page-numbers">
          <button 
            v-for="page in visiblePages" 
            :key="page"
            @click="goToPage(page)"
            :class="['page-btn', { active: page === currentPage }]"
          >
            {{ page }}
          </button>
        </div>
        
        <button 
          @click="goToPage(currentPage + 1)" 
          :disabled="currentPage >= totalPages"
          class="pagination-btn"
        >
          Next
        </button>
      </div>
    </div>

    <!-- Reply Dialog -->
    <div v-if="showReplyDialog" class="dialog-overlay" @click.self="closeReplyDialog">
      <div class="dialog-content reply-dialog">
        <div class="dialog-header">
          <h2>Reply to Customer Review</h2>
          <button @click="closeReplyDialog" class="close-btn">
            <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" stroke-width="2" fill="none">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <div class="dialog-body" v-if="selectedReview">
          <!-- Review Info -->
          <div class="review-card">
            <div class="review-product">
              <img :src="selectedReview.product.image" :alt="selectedReview.product.name" class="product-img">
              <div class="product-info">
                <h3 class="product-name">{{ selectedReview.product.name }}</h3>
                <p class="customer-name">{{ selectedReview.customer }}</p>
              </div>
            </div>

            <div class="rating-stars">
              <span v-for="star in 5" :key="star" :class="['star', { filled: star <= selectedReview.rating }]">
                ★
              </span>
            </div>

            <p class="review-text">{{ selectedReview.text }}</p>
            <p class="review-date">{{ selectedReview.date }}</p>
          </div>

          <!-- Previous Replies Section -->
          <div v-if="selectedReview.allReplies && selectedReview.allReplies.length > 0" class="previous-replies">
            <h4 class="replies-title">Previous Replies ({{ selectedReview.allReplies.length }})</h4>
            <div v-for="reply in selectedReview.allReplies" :key="reply.id" class="reply-item">
              <div class="reply-header">
                <span class="reply-author">{{ reply.merchant }}</span>
                <span class="reply-time">{{ reply.date }}</span>
              </div>
              <p class="reply-content">{{ reply.text }}</p>
            </div>
          </div>

          <!-- Reply Form -->
          <div class="reply-form">
            <h3 class="form-title">Your Reply</h3>
            <textarea
              v-model="replyText"
              placeholder="Type your response to the customer here..."
              class="reply-textarea"
              rows="6"
            ></textarea>
          </div>
        </div>

        <div class="dialog-footer">
          <button @click="closeReplyDialog" class="btn-secondary">Cancel</button>
          <button @click="submitReply" class="btn-primary" :disabled="!replyText.trim()">
            Submit Reply
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { getReviewList, replyToReview as apiReplyToReview, deleteReview as deleteReviewApi, togglePinReview, type ReviewInfo } from '../services/review'

// 评论数据接口 - 适配后端数据
interface Review {
  id: string
  product_id: number  // 保存产品ID用于回复
  product: {
    name: string
    image: string
  }
  customer: string
  rating: number
  text: string
  date: string
  status: 'Pinned' | 'Normal'
  likes: number  // 点赞数
  hasReply?: boolean  // 是否有回复(用于列表显示)
  replyCount?: number  // 回复数量
  allReplies?: Array<{  // 所有回复(用于对话框显示)
    id: string
    text: string
    date: string
    merchant: string
  }>
  merchantReply?: {  // 兼容旧代码
    text: string
    date: string
    merchant: string
    totalReplies?: number
  }
}

// 转换后端数据到前端格式
const convertReviewData = (apiReview: ReviewInfo): Review => {
  return {
    id: apiReview.id,
    product_id: apiReview.product_id,  // 保存product_id
    product: {
      name: `Product #${apiReview.product_id}`, // 临时显示,后续需要关联产品表获取名称
      image: apiReview.pic_info && apiReview.pic_info[0] && apiReview.pic_info[0] !== '' 
        ? apiReview.pic_info[0] 
        : 'data:image/svg+xml,%3Csvg width="48" height="48" xmlns="http://www.w3.org/2000/svg"%3E%3Crect fill="%23E5E7EB" width="48" height="48"/%3E%3C/svg%3E'
    },
    customer: apiReview.is_anonymous ? 'Anonymous User' : `User #${apiReview.user_id}`, // 临时显示,后续需要关联用户表
    rating: apiReview.stars,
    text: apiReview.content,
    date: new Date(apiReview.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    status: apiReview.is_pinned ? 'Pinned' : 'Normal',
    likes: apiReview.likes
  }
}

// 响应式数据
const loading = ref(false)
const showReplyDialog = ref(false)
const selectedReview = ref<Review | null>(null)
const replyText = ref('')

const reviews = ref<Review[]>([])

// 加载评论列表
const loadReviews = async () => {
  loading.value = true
  try {
    const response = await getReviewList({
      product_id: 0, // 0表示获取所有产品的评论
      stars: filters.ratingFilter ? parseInt(filters.ratingFilter) : 0
    })
    
    console.log('API Response:', response) // 调试日志
    
    if (response.status === 0 && response.data) {
      // 分离顶级评论和回复
      const topLevelReviews = response.data.filter(r => !r.parent_id || r.parent_id === '')
      const replies = response.data.filter(r => r.parent_id && r.parent_id !== '')
      
      // 转换顶级评论
      reviews.value = topLevelReviews.map(review => {
        const converted = convertReviewData(review)
        
        // 查找该评论的所有回复,按时间倒序(最新的在前)
        const reviewReplies = replies
          .filter(r => r.parent_id === review.id)
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        
        if (reviewReplies.length > 0) {
          // 设置简单标记用于列表显示
          converted.hasReply = true
          converted.replyCount = reviewReplies.length
          
          // 保存所有回复详情用于对话框
          converted.allReplies = reviewReplies.map(r => ({
            id: r.id,
            text: r.content,
            date: new Date(r.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
            merchant: r.is_anonymous ? 'Anonymous' : 'CeramiCraft Store'
          }))
        }
        
        return converted
      })
      
      console.log('Reviews loaded:', reviews.value.length, 'items')
    } else {
      console.error('Failed to load reviews:', response.msg || response.error)
      reviews.value = []
    }
  } catch (error) {
    console.error('Error loading reviews:', error)
    reviews.value = []
  } finally {
    loading.value = false
  }
}

// 过滤器状态
const filters = reactive({
  searchQuery: '',
  ratingFilter: '',
  statusFilter: ''
})

// 分页状态
const currentPage = ref(1)
const itemsPerPage = ref(7)

// 计算属性
const hasActiveFilters = computed(() => {
  return filters.searchQuery || filters.ratingFilter || filters.statusFilter
})

const filteredReviews = computed(() => {
  let result = reviews.value

  if (filters.searchQuery) {
    const query = filters.searchQuery.toLowerCase()
    result = result.filter(r => 
      r.product.name.toLowerCase().includes(query) || 
      r.customer.toLowerCase().includes(query) ||
      r.text.toLowerCase().includes(query)
    )
  }

  if (filters.ratingFilter) {
    result = result.filter(r => r.rating === Number(filters.ratingFilter))
  }

  if (filters.statusFilter) {
    result = result.filter(r => r.status.toLowerCase() === filters.statusFilter.toLowerCase())
  }

  return result
})

const paginatedReviews = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  const end = start + itemsPerPage.value
  return filteredReviews.value.slice(start, end)
})

const totalReviews = computed(() => filteredReviews.value.length)

const totalPages = computed(() => Math.ceil(totalReviews.value / itemsPerPage.value))

const startIndex = computed(() => (currentPage.value - 1) * itemsPerPage.value + 1)

const endIndex = computed(() => {
  const end = currentPage.value * itemsPerPage.value
  return end > totalReviews.value ? totalReviews.value : end
})

const visiblePages = computed(() => {
  const pages = []
  const start = Math.max(1, currentPage.value - 2)
  const end = Math.min(totalPages.value, currentPage.value + 2)
  
  for (let i = start; i <= end; i++) {
    pages.push(i)
  }
  
  return pages
})

// 方法
const handleSearch = () => {
  currentPage.value = 1
}

const handleApplyFilters = async () => {
  currentPage.value = 1
  await loadReviews()
}

const goToPage = (page: number) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page
  }
}

const replyToReview = (reviewId: string) => {
  const review = reviews.value.find(r => r.id === reviewId)
  if (review) {
    selectedReview.value = review
    showReplyDialog.value = true
    replyText.value = ''
  }
}

const closeReplyDialog = () => {
  showReplyDialog.value = false
  selectedReview.value = null
  replyText.value = ''
}

const submitReply = async () => {
  if (!replyText.value.trim() || !selectedReview.value) return
  
  try {
    const response = await apiReplyToReview({
      content: replyText.value,
      is_anonymous: false,  // 商家回复不匿名
      parentID: selectedReview.value.id,
      pic_info: [],
      productID: selectedReview.value.product_id,
      stars: selectedReview.value.rating
    })
    
    if (response.status === 0) {
      alert('Reply submitted successfully!')
      closeReplyDialog()
      // 重新加载评论列表
      await loadReviews()
    } else {
      alert('Failed to submit reply: ' + (response.msg || response.error || 'Unknown error'))
    }
  } catch (error) {
    console.error('Error submitting reply:', error)
    alert('Failed to submit reply. Please try again.')
  }
}

const togglePin = async (reviewId: string) => {
  const review = reviews.value.find(r => r.id === reviewId)
  if (!review) return
  
  // 如果已经是置顶状态，提示无法重复置顶
  if (review.status === 'Pinned') {
    alert('This review is already pinned. Cannot pin it again.')
    return
  }
  
  try {
    const response = await togglePinReview(reviewId, true)
    
    console.log('Toggle pin response:', response) // 调试日志
    
    if (response.status === 0) {
      console.log(`Review ${reviewId} pinned successfully`)
      alert('Successfully pinned the review!')
      
      // 刷新评论列表以获取最新状态
      await loadReviews()
    } else {
      const errorMsg = response.msg || response.error || 'Unknown error'
      console.error('Pin failed:', errorMsg)
      alert('Failed to pin review: ' + errorMsg)
    }
  } catch (error) {
    console.error('Error pinning review:', error)
    alert('Failed to pin review. Please try again.')
  }
}

const deleteReview = async (reviewId: string) => {
  if (!confirm('Are you sure you want to delete this review? This action cannot be undone.')) {
    return
  }
  
  try {
    const response = await deleteReviewApi(reviewId)
    
    if (response.status === 0) {
      reviews.value = reviews.value.filter(r => r.id !== reviewId)
      console.log(`Review ${reviewId} deleted`)
      alert('Review deleted successfully!')
    } else {
      alert('Failed to delete review: ' + (response.msg || response.error || 'Unknown error'))
    }
  } catch (error) {
    console.error('Error deleting review:', error)
    alert('Failed to delete review. Please try again.')
  }
}

// 生命周期 - 组件加载时获取评论数据
onMounted(() => {
  loadReviews()
})
</script>

<style scoped>
.review-management-page {
  padding: 24px;
  max-width: 1400px;
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
  grid-template-columns: 2fr 1fr 1fr auto;
  gap: 16px;
  margin-bottom: 16px;
  align-items: center;
}

.filters-row:last-child {
  margin-bottom: 0;
}

.search-group {
  min-width: 0;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.filter-label {
  font-size: 12px;
  font-weight: 500;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.filter-input, .filter-select {
  padding: 10px 12px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 14px;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.search-input {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2'%3E%3Ccircle cx='11' cy='11' r='8'%3E%3C/circle%3E%3Cpath d='m21 21-4.35-4.35'%3E%3C/path%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: 12px center;
  background-size: 18px;
  padding-left: 40px;
}

.filter-input:focus, .filter-select:focus {
  outline: none;
  border-color: #dc6643;
  box-shadow: 0 0 0 3px rgba(220, 102, 67, 0.1);
}

.apply-filters-btn {
  padding: 10px 24px;
  background: #dc6643;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
  align-self: stretch;
}

.apply-filters-btn:hover {
  background: #c55a3a;
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

.reviews-table {
  width: 100%;
  border-collapse: collapse;
}

.reviews-table th,
.reviews-table td {
  padding: 16px;
  text-align: left;
  border-bottom: 1px solid #e5e7eb;
}

.reviews-table th {
  background: #f9fafb;
  font-weight: 600;
  color: #6b7280;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.reviews-table td {
  font-size: 14px;
  color: #1f2937;
}

.review-row:hover {
  background: #f9fafb;
}

.review-id {
  font-weight: 500;
  color: #374151;
}

.product-cell {
  color: #374151;
}

.customer-name {
  font-weight: 500;
  color: #374151;
}

.rating-stars {
  display: flex;
  gap: 2px;
}

.star {
  font-size: 18px;
  color: #fbbf24;
}

.star.empty {
  color: #d1d5db;
}

.review-text {
  max-width: 300px;
}

.review-content {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-height: 1.5;
  position: relative;
}

.review-content.clickable {
  cursor: pointer;
  transition: color 0.2s;
}

.review-content.clickable:hover {
  color: #dc6643;
}

.view-more-indicator {
  color: #dc6643;
  font-size: 13px;
  font-weight: 500;
  margin-left: 4px;
}

/* 简洁的回复标记 */
.reply-indicator {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-top: 8px;
  padding: 4px 10px;
  background: #dcfce7;
  border-radius: 12px;
  border: 1px solid #86efac;
}

.reply-check-icon {
  width: 14px;
  height: 14px;
  color: #16a34a;
}

.reply-badge {
  font-size: 12px;
  font-weight: 600;
  color: #16a34a;
}

.reply-count-badge {
  font-size: 11px;
  color: #22c55e;
  margin-left: 2px;
}

.likes-cell {
  text-align: center;
}

.likes-count {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 12px;
  background: #f3f4f6;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 500;
  color: #374151;
}

.like-icon {
  width: 16px;
  height: 16px;
  color: #6b7280;
}

.review-date {
  color: #6b7280;
  white-space: nowrap;
}

.status-badge {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
  white-space: nowrap;
}

.status-pinned {
  background: #dbeafe;
  color: #1e40af;
}

.status-normal {
  background: #f3f4f6;
  color: #374151;
}

.actions-cell {
  white-space: nowrap;
}

.action-btn {
  padding: 6px;
  background: none;
  border: none;
  cursor: pointer;
  color: #6b7280;
  border-radius: 6px;
  transition: all 0.2s;
  margin-right: 4px;
}

.action-btn:last-child {
  margin-right: 0;
}

.action-btn svg {
  width: 18px;
  height: 18px;
}

.action-btn:hover {
  background: #f3f4f6;
  color: #374151;
}

.reply-btn:hover {
  background: #dbeafe;
  color: #1e40af;
}

.pin-btn:hover {
  background: #fef3c7;
  color: #92400e;
}

.delete-btn:hover {
  background: #fee2e2;
  color: #dc2626;
}

/* 状态样式 */
.loading-state, .empty-state {
  padding: 64px 24px;
  text-align: center;
}

.loading-spinner, .empty-icon {
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
@media (max-width: 1200px) {
  .filters-row {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .review-management-page {
    padding: 16px;
  }
  
  .filters-row {
    grid-template-columns: 1fr;
  }
  
  .reviews-table {
    font-size: 12px;
  }
  
  .reviews-table th,
  .reviews-table td {
    padding: 12px 8px;
  }

  .pagination-section {
    flex-direction: column;
    gap: 16px;
  }
}

/* Reply Dialog Styles */
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
  width: 100%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
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
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px;
  border-bottom: 1px solid #e5e7eb;
}

.dialog-header h2 {
  font-size: 24px;
  font-weight: 600;
  color: #1a1a1a;
  margin: 0;
}

.close-btn {
  background: none;
  border: none;
  cursor: pointer;
  color: #6b7280;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: all 0.2s;
}

.close-btn:hover {
  background: #f3f4f6;
  color: #1f2937;
}

.dialog-body {
  padding: 24px;
}

.review-card {
  background: #f9fafb;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 24px;
}

.review-product {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 16px;
}

.product-img {
  width: 64px;
  height: 64px;
  border-radius: 8px;
  object-fit: cover;
}

.product-info {
  flex: 1;
}

.product-name {
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 4px 0;
}

.customer-name {
  font-size: 14px;
  color: #6b7280;
  margin: 0;
}

.rating-stars {
  margin-bottom: 12px;
}

.rating-stars .star {
  font-size: 20px;
  color: #d1d5db;
  margin-right: 4px;
}

.rating-stars .star.filled {
  color: #fbbf24;
}

.review-text {
  font-size: 14px;
  color: #374151;
  line-height: 1.6;
  margin: 0 0 8px 0;
}

.review-date {
  font-size: 12px;
  color: #9ca3af;
  margin: 0;
}

.reply-form {
  margin-bottom: 0;
}

/* 历史回复样式 */
.previous-replies {
  margin: 24px 0;
  padding: 16px;
  background: #f9fafb;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
}

.replies-title {
  font-size: 14px;
  font-weight: 600;
  color: #374151;
  margin: 0 0 12px 0;
}

.reply-item {
  padding: 12px;
  background: white;
  border-radius: 6px;
  margin-bottom: 8px;
  border: 1px solid #e5e7eb;
}

.reply-item:last-child {
  margin-bottom: 0;
}

.reply-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.reply-author {
  font-size: 13px;
  font-weight: 600;
  color: #dc6643;
}

.reply-time {
  font-size: 11px;
  color: #9ca3af;
}

.reply-content {
  font-size: 13px;
  color: #374151;
  line-height: 1.6;
  margin: 0;
}

.form-title {
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 12px 0;
}

.reply-textarea {
  width: 100%;
  padding: 12px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 14px;
  font-family: inherit;
  resize: vertical;
  margin-bottom: 16px;
  box-sizing: border-box;
}

.reply-textarea:focus {
  outline: none;
  border-color: #dc6643;
  box-shadow: 0 0 0 3px rgba(220, 102, 67, 0.1);
}

.reply-textarea::placeholder {
  color: #9ca3af;
}

.form-checkbox {
  display: flex;
  align-items: center;
  gap: 8px;
}

.form-checkbox input[type="checkbox"] {
  width: 18px;
  height: 18px;
  cursor: pointer;
}

.form-checkbox label {
  font-size: 14px;
  color: #374151;
  cursor: pointer;
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
}

.dialog-footer .btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
