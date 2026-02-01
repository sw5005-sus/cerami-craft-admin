<template>
    <div class="products-container">
        <!-- Header -->
        <div class="header">
            <div class="header-content">
                <h1>Products</h1>
                <p class="subtitle">Manage your product inventory</p>
            </div>
            <router-link to="/products/add" class="add-product-btn">
                <i class="fas fa-plus"></i>
                Add New Product
            </router-link>
        </div>

        <!-- Search and Filter -->
        <div class="filter-section">
            <div class="search-box">
                <i class="fas fa-search search-icon"></i>
                <input v-model="searchQuery" type="text" placeholder="Search products" class="search-input"
                    @input="handleSearch" />
            </div>

            <div class="filter-group">
                <select v-model="selectedCategory" @change="handleFilter" class="filter-select">
                    <option value="">All Categories</option>
                    <option value="pottery">Pottery</option>
                    <option value="ceramics">Ceramics</option>
                    <option value="vases">Vases</option>
                    <option value="bowls">Bowls</option>
                    <option value="decorative">Decorative Items</option>
                    <option v-for="category in availableCategories" :key="category" :value="category"
                        v-show="!['pottery', 'ceramics', 'vases', 'bowls', 'decorative'].includes(category)">
                        {{ formatCategory(category) }}
                    </option>
                </select>

                <select v-model="sortOrder" @change="handleSort" class="filter-select">
                    <option value="0">Latest First</option>
                    <option value="1">Oldest First</option>
                </select>
            </div>
        </div>

        <!-- Loading State -->
        <div v-if="isLoading" class="loading-state">
            <div class="loading-spinner"></div>
            <p>Loading products...</p>
        </div>

        <!-- Products List -->
        <div v-else class="products-grid">
            <div v-if="products.length === 0 && !isLoading" class="empty-state">
                <div class="empty-icon">
                    <i class="fas fa-box-open fa-3x"></i>
                </div>
                <h3>{{ hasFilters ? 'No products found' : 'No products yet' }}</h3>
                <p>{{ hasFilters ? 'Try adjusting your search or filters.' : 'Get started by adding your first product to the inventory.' }}</p>
                <router-link v-if="!hasFilters" to="/products/add" class="btn btn-primary">
                    Add Your First Product
                </router-link>
                <button v-else @click="clearFilters" class="btn btn-outline">
                    Clear Filters
                </button>
            </div>

            <div v-for="product in products" :key="product.id" class="product-card">
                <div class="product-image">
                    <img :src="getImageUrl(product.pic_info)" :alt="product.name" />
                    <div class="product-overlay">
                        <button @click="viewProduct(product.id!)" class="overlay-btn">
                            <i class="fas fa-eye"></i>
                        </button>
                    </div>
                </div>
                <div class="product-info">
                    <h3 class="product-name">{{ product.name }}</h3>
                    <p class="product-category">{{ formatCategory(product.category) }}</p>
                    <div class="product-details">
                        <span class="product-price">${{ (product.price / 100).toFixed(2) }}</span>
                        <span class="product-stock">{{ product.stock }} in stock</span>
                    </div>
                    <div class="product-status">
                        <span :class="['status-badge', product.status === 1 ? 'published' : 'unpublished']">
                            {{ product.status === 1 ? 'Published' : 'Unpublished' }}
                        </span>
                    </div>
                </div>
                <div class="product-actions">
                    <button v-if="product.status === 0" @click="publishProduct(product.id!)"
                        class="btn btn-sm btn-success" :disabled="actionLoading[product.id!]">
                        <i class="fas fa-upload"></i>
                        {{ actionLoading[product.id!] ? 'Publishing...' : 'Publish' }}
                    </button>
                    <button v-else @click="unpublishProduct(product.id!)" class="btn btn-sm btn-warning"
                        :disabled="actionLoading[product.id!]">
                        <i class="fas fa-download"></i>
                        {{ actionLoading[product.id!] ? 'Unpublishing...' : 'Unpublish' }}
                    </button>
                    <button @click="updateStock(product)" class="btn btn-sm btn-outline">
                        <i class="fas fa-boxes"></i>
                        Stock
                    </button>
                </div>
            </div>

            <!-- Load More Button -->
            <div v-if="hasMore" class="load-more-section">
                <button @click="loadMore" class="btn btn-outline" :disabled="isLoadingMore">
                    <i v-if="isLoadingMore" class="fas fa-spinner fa-spin"></i>
                    <i v-else class="fas fa-chevron-down"></i>
                    {{ isLoadingMore ? 'Loading...' : 'Load More' }}
                </button>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ProductAPI, type ProductInfo, type ProductListParams, ProductStatus } from '../services/product'
import { notification } from '../utils/notification'
import { handleAPIError, HTTP_STATUS } from '../services/auth'

const router = useRouter()

// 产品列表数据
const products = ref<ProductInfo[]>([])
const isLoading = ref(false)
const isLoadingMore = ref(false)
const currentOffset = ref(0)
const hasMore = ref(true)

// 搜索和筛选
const searchQuery = ref('')
const selectedCategory = ref('')
const sortOrder = ref('0')

// 动态分类列表
const availableCategories = computed(() => {
    const categories = new Set<string>()
    products.value.forEach(product => {
        if (product.category) {
            categories.add(product.category)
        }
    })
    return Array.from(categories).sort()
})

// 防抖搜索
let searchTimeout: number | null = null

// 操作loading状态
const actionLoading = ref<Record<number, boolean>>({})

// 计算属性
const hasFilters = computed(() => {
    return searchQuery.value.trim() !== '' || selectedCategory.value !== ''
})

// 获取产品列表
const loadProducts = async (append = false) => {
    if (append) {
        isLoadingMore.value = true
    } else {
        isLoading.value = true
        products.value = []
        currentOffset.value = 0
        hasMore.value = true
    }

    try {
        const params: ProductListParams = {
            offset: currentOffset.value,
            order_by: parseInt(sortOrder.value)
        }

        if (searchQuery.value.trim()) {
            params.keyword = searchQuery.value.trim()
        }

        if (selectedCategory.value) {
            params.category = selectedCategory.value
        }

        const response = await ProductAPI.getMerchantProductList(params)

        if (response.code === HTTP_STATUS.OK && response.data) {
            const newProducts = response.data.list || []

            if (append) {
                products.value.push(...newProducts)
            } else {
                products.value = newProducts
            }

            currentOffset.value += newProducts.length
            // 如果返回的商品数量少于预期，说明没有更多了
            hasMore.value = newProducts.length > 0 && response.data.total > currentOffset.value
        } else {
            notification.error(handleAPIError(response, 'Failed to load products'), 'Error')
        }
    } catch (error) {
        console.error('Error loading products:', error)
        notification.error('Network error, please try again later', 'Connection Error')
    } finally {
        isLoading.value = false
        isLoadingMore.value = false
    }
}

// 加载更多
const loadMore = () => {
    if (!isLoadingMore.value && hasMore.value) {
        loadProducts(true)
    }
}

// 搜索处理
const handleSearch = () => {
    if (searchTimeout) {
        clearTimeout(searchTimeout)
    }
    searchTimeout = window.setTimeout(() => {
        loadProducts()
    }, 500)
}

// 筛选处理
const handleFilter = () => {
    loadProducts()
}

// 排序处理
const handleSort = () => {
    loadProducts()
}

// 清除筛选
const clearFilters = () => {
    searchQuery.value = ''
    selectedCategory.value = ''
    loadProducts()
}

// 工具函数
const getImageUrl = (picInfo?: string | string[]) => {
    if (!picInfo) return '/img/placeholder.svg'

    let imageId = ''

    // 如果是数组，获取第一张图片的ID
    if (Array.isArray(picInfo) && picInfo.length > 0) {
        imageId = picInfo[0] || ''
    }
    // 如果是字符串，尝试解析
    else if (typeof picInfo === 'string') {
        try {
            // 尝试解析JSON字符串格式的图片信息
            const imageArray = JSON.parse(picInfo)
            if (Array.isArray(imageArray) && imageArray.length > 0) {
                imageId = imageArray[0] || ''
            }
        } catch {
            // 如果不是JSON格式，直接使用字符串
            if (picInfo.trim()) {
                imageId = picInfo
            }
        }
    }

    // 如果有图片ID，构建完整的S3 URL
    if (imageId) {
        return `https://ceramicraft.s3.ap-southeast-1.amazonaws.com/${imageId}`
    }

    return '/img/placeholder.svg'
}

const formatCategory = (category: string) => {
    return category.charAt(0).toUpperCase() + category.slice(1).replace('_', ' ')
}

// 查看产品详情  
const viewProduct = (productId: number) => {
    router.push(`/products/${productId}`)
}

// 上架产品
const publishProduct = async (productId: number) => {
    actionLoading.value[productId] = true
    try {
        const response = await ProductAPI.publishProduct(productId)
        if (response.code === HTTP_STATUS.OK) {
            notification.success('Product published successfully!', 'Success')
            // 更新本地状态
            const product = products.value.find(p => p.id === productId)
            if (product) {
                product.status = ProductStatus.PUBLISHED
            }
        } else {
            notification.error(handleAPIError(response, 'Failed to publish product'), 'Error')
        }
    } catch (error) {
        console.error('Error publishing product:', error)
        notification.error('Network error, please try again later', 'Connection Error')
    } finally {
        actionLoading.value[productId] = false
    }
}

// 下架产品
const unpublishProduct = async (productId: number) => {
    actionLoading.value[productId] = true
    try {
        const response = await ProductAPI.unpublishProduct(productId)
        if (response.code === HTTP_STATUS.OK) {
            notification.success('Product unpublished successfully!', 'Success')
            // 更新本地状态
            const product = products.value.find(p => p.id === productId)
            if (product) {
                product.status = ProductStatus.UNPUBLISHED
            }
        } else {
            notification.error(handleAPIError(response, 'Failed to unpublish product'), 'Error')
        }
    } catch (error) {
        console.error('Error unpublishing product:', error)
        notification.error('Network error, please try again later', 'Connection Error')
    } finally {
        actionLoading.value[productId] = false
    }
}

// 更新库存
const updateStock = async (product: ProductInfo) => {
    if (product.status === ProductStatus.PUBLISHED) {
        notification.warning('Please unpublish the product first before updating stock', 'Cannot Update Stock')
        return
    }

    const newStock = prompt(`Current stock: ${product.stock}\nEnter new stock quantity:`, product.stock?.toString())
    if (newStock === null) return

    const stockNumber = parseInt(newStock)
    if (isNaN(stockNumber) || stockNumber < 0) {
        notification.error('Please enter a valid stock quantity', 'Invalid Input')
        return
    }

    try {
        const response = await ProductAPI.updateStock(product.id!, stockNumber)
        if (response.code === HTTP_STATUS.OK) {
            notification.success('Stock updated successfully!', 'Success')
            // 更新本地状态
            product.stock = stockNumber
        } else {
            notification.error(handleAPIError(response, 'Failed to update stock'), 'Error')
        }
    } catch (error) {
        console.error('Error updating stock:', error)
        notification.error('Network error, please try again later', 'Connection Error')
    }
}

// 组件挂载时加载产品
onMounted(() => {
    loadProducts()
})
</script>

<style scoped>
.products-container {
    width: 100%;
    padding: 24px;
    background: #f8f9fb;
    min-height: 100vh;
    box-sizing: border-box;
}

.header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 32px;
}

.header-content h1 {
    font-size: 28px;
    font-weight: 600;
    color: #1e293b;
    margin: 0 0 8px 0;
}

.subtitle {
    color: #64748b;
    font-size: 14px;
    margin: 0;
}

.add-product-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    background: #dc6643;
    color: white;
    text-decoration: none;
    padding: 12px 20px;
    border-radius: 8px;
    font-weight: 500;
    transition: background-color 0.2s;
}

.add-product-btn:hover {
    background: #c55a3a;
}

/* Filter Section */
.filter-section {
    background: white;
    border-radius: 12px;
    padding: 24px;
    margin-bottom: 24px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    display: grid;
    grid-template-columns: 1fr auto;
    gap: 24px;
    align-items: center;
}

.search-box {
    position: relative;
    width: 75%;
}

.search-icon {
    position: absolute;
    left: 16px;
    top: 50%;
    transform: translateY(-50%);
    color: #6b7280;
    z-index: 1;
}

.search-input {
    width: 100%;
    padding: 12px 16px 12px 48px;
    border: 1px solid #d1d5db;
    border-radius: 8px;
    font-size: 14px;
    transition: border-color 0.2s, box-shadow 0.2s;
}

.search-input:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.filter-group {
    display: flex;
    gap: 12px;
    align-items: center;
    white-space: nowrap;
}

.filter-select {
    padding: 12px 16px;
    border: 1px solid #d1d5db;
    border-radius: 8px;
    font-size: 14px;
    background: white;
    min-width: 160px;
    transition: border-color 0.2s;
}

.filter-select:focus {
    outline: none;
    border-color: #3b82f6;
}

/* Loading State */
.loading-state {
    text-align: center;
    padding: 64px 24px;
    background: white;
    border-radius: 12px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.loading-spinner {
    width: 40px;
    height: 40px;
    border: 4px solid #e5e7eb;
    border-top: 4px solid #3b82f6;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin: 0 auto 16px;
}

@keyframes spin {
    0% {
        transform: rotate(0deg);
    }

    100% {
        transform: rotate(360deg);
    }
}

.products-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 24px;
    padding: 0;
}

.empty-state {
    grid-column: 1 / -1;
    text-align: center;
    padding: 64px 24px;
    background: white;
    border-radius: 12px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.empty-icon {
    color: #9ca3af;
    margin-bottom: 24px;
}

.empty-state h3 {
    font-size: 20px;
    font-weight: 600;
    color: #1e293b;
    margin: 0 0 8px 0;
}

.empty-state p {
    color: #64748b;
    margin: 0 0 24px 0;
}

.btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: 12px 24px;
    border: none;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 500;
    text-decoration: none;
    cursor: pointer;
    transition: all 0.2s;
}

.btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
}

.btn-primary {
    background: #dc6643;
    color: white;
}

.btn-primary:hover:not(:disabled) {
    background: #c55a3a;
}

.btn-sm {
    padding: 6px 12px;
    font-size: 12px;
    gap: 4px;
}

.btn-outline {
    background: transparent;
    border: 1px solid #d1d5db;
    color: #374151;
}

.btn-outline:hover:not(:disabled) {
    background: #f3f4f6;
}

.btn-danger {
    background: #ef4444;
    color: white;
}

.btn-danger:hover:not(:disabled) {
    background: #dc2626;
}

.product-card {
    background: white;
    border-radius: 12px;
    padding: 20px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    transition: transform 0.2s, box-shadow 0.2s;
}

.product-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.product-image {
    position: relative;
    width: 100%;
    height: 200px;
    border-radius: 8px;
    overflow: hidden;
    margin-bottom: 16px;
    background: #f3f4f6;
}

.product-image img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.2s;
}

.product-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    transition: opacity 0.2s;
}

.product-image:hover .product-overlay {
    opacity: 1;
}

.overlay-btn {
    background: white;
    border: none;
    border-radius: 50%;
    width: 48px;
    height: 48px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #374151;
    cursor: pointer;
    transition: transform 0.2s;
}

.overlay-btn:hover {
    transform: scale(1.1);
}

.product-name {
    font-size: 16px;
    font-weight: 600;
    color: #1e293b;
    margin: 0 0 4px 0;
    line-height: 1.4;
}

.product-category {
    font-size: 14px;
    color: #64748b;
    margin: 0 0 12px 0;
    text-transform: capitalize;
}

.product-details {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
}

.product-price {
    font-size: 18px;
    font-weight: 600;
    color: #dc6643;
}

.product-stock {
    font-size: 12px;
    color: #64748b;
}

.product-status {
    margin-bottom: 16px;
}

.status-badge {
    font-size: 11px;
    padding: 4px 8px;
    border-radius: 4px;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

.status-badge.published {
    background: #dcfce7;
    color: #166534;
}

.status-badge.unpublished {
    background: #fef3c7;
    color: #92400e;
}

.product-actions {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
}

.btn-success {
    background: #10b981;
    color: white;
}

.btn-success:hover:not(:disabled) {
    background: #059669;
}

.btn-warning {
    background: #f59e0b;
    color: white;
}

.btn-warning:hover:not(:disabled) {
    background: #d97706;
}

.load-more-section {
    grid-column: 1 / -1;
    text-align: center;
    margin-top: 24px;
}

.fa-spin {
    animation: fa-spin 2s infinite linear;
}

@keyframes fa-spin {
    0% {
        transform: rotate(0deg);
    }

    100% {
        transform: rotate(360deg);
    }
}

@media (max-width: 768px) {
    .products-container {
        padding: 16px;
    }

    .header {
        flex-direction: column;
        gap: 16px;
        align-items: stretch;
    }

    .add-product-btn {
        justify-content: center;
    }

    .filter-section {
        grid-template-columns: 1fr;
        gap: 16px;
        padding: 16px;
    }

    .filter-group {
        justify-content: space-between;
        gap: 8px;
    }

    .filter-select {
        flex: 1;
        min-width: 120px;
    }

    .products-grid {
        grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
        gap: 16px;
    }
}

@media (min-width: 769px) and (max-width: 1024px) {
    .filter-section {
        grid-template-columns: 1fr;
        gap: 16px;
    }

    .filter-group {
        justify-content: center;
    }

    .products-grid {
        grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
        gap: 20px;
    }
}

@media (min-width: 1025px) and (max-width: 1400px) {
    .products-grid {
        grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
        gap: 24px;
    }
}

@media (min-width: 1401px) {
    .products-grid {
        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
        gap: 24px;
    }
}
</style>