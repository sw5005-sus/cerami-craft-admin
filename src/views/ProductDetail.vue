<template>
  <div class="product-detail-container">
    <!-- Loading State -->
    <div v-if="isLoading" class="loading-state">
      <div class="loading-spinner"></div>
      <p>Loading product details...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error-state">
      <div class="error-icon">
        <i class="fas fa-exclamation-triangle fa-3x"></i>
      </div>
      <h3>Failed to load product</h3>
      <p>{{ error }}</p>
      <div class="error-actions">
        <button @click="loadProduct" class="btn btn-primary">
          <i class="fas fa-redo"></i> Retry
        </button>
        <router-link to="/products" class="btn btn-outline">
          <i class="fas fa-arrow-left"></i> Back to Products
        </router-link>
      </div>
    </div>

    <!-- Product Detail Content -->
    <div v-else-if="product" class="product-detail">
      <!-- Header with Back Button -->
      <div class="detail-header">
        <router-link to="/products" class="back-button">
          <i class="fas fa-arrow-left"></i>
          <span>Back to Products</span>
        </router-link>
        <div class="header-actions">
          <button @click="openEditModal" class="btn btn-primary">
            <i class="fas fa-edit"></i>
            Edit Product
          </button>
          <button v-if="product.status === 0" @click="publishProduct" class="btn btn-success" :disabled="actionLoading">
            <i class="fas fa-upload"></i>
            {{ actionLoading ? 'Publishing...' : 'Publish Product' }}
          </button>
          <button v-else @click="unpublishProduct" class="btn btn-warning" :disabled="actionLoading">
            <i class="fas fa-download"></i>
            {{ actionLoading ? 'Unpublishing...' : 'Unpublish Product' }}
          </button>
          <button @click="showStockModal = true" class="btn btn-outline">
            <i class="fas fa-boxes"></i>
            Update Stock
          </button>
        </div>
      </div>

      <!-- Main Content -->
      <div class="product-content">
        <!-- Left: Image Gallery -->
        <div class="image-section">
          <div class="main-image">
            <img v-if="currentImage" :src="getImageUrl(currentImage)" :alt="product.name" class="product-image" />
            <div v-else class="no-image">
              <i class="fas fa-image fa-3x"></i>
              <p>No image available</p>
            </div>
          </div>

          <!-- Image Thumbnails -->
          <div v-if="imageList.length > 1" class="image-thumbnails">
            <button v-for="(image, index) in imageList" :key="index" @click="selectImage(index)"
              :class="['thumbnail-btn', { active: currentImageIndex === index }]">
              <img :src="getImageUrl(image)" :alt="`${product.name} image ${index + 1}`" />
            </button>
          </div>

          <!-- Image Navigation -->
          <div v-if="imageList.length > 1" class="image-navigation">
            <button @click="previousImage" :disabled="currentImageIndex === 0" class="nav-btn prev-btn">
              <i class="fas fa-chevron-left"></i>
            </button>
            <span class="image-counter">
              {{ currentImageIndex + 1 }} / {{ imageList.length }}
            </span>
            <button @click="nextImage" :disabled="currentImageIndex === imageList.length - 1" class="nav-btn next-btn">
              <i class="fas fa-chevron-right"></i>
            </button>
          </div>

          <!-- Image Preview Indicators -->
          <div v-if="imageList.length > 1" class="image-indicators">
            <button v-for="(_, index) in imageList" :key="index" @click="selectImage(index)"
              :class="['indicator-dot', { active: currentImageIndex === index }]">
            </button>
          </div>
        </div>

        <!-- Right: Product Information -->
        <div class="info-section">
          <div class="basic-info">
            <h1 class="product-title">{{ product.name }}</h1>
            <div class="product-meta">
              <span class="category">{{ formatCategory(product.category) }}</span>
              <span :class="['status-badge', product.status === 1 ? 'published' : 'unpublished']">
                {{ product.status === 1 ? 'Published' : 'Unpublished' }}
              </span>
            </div>
            <div class="price-stock">
              <span class="price">${{ (product.price / 100).toFixed(2) }}</span>
              <span class="stock">{{ product.stock }} in stock</span>
            </div>
          </div>

          <div class="description-section">
            <h3>Description</h3>
            <p class="description">{{ product.desc || 'No description available' }}</p>
          </div>

          <!-- Product Specifications -->
          <div v-if="hasSpecifications" class="specifications">
            <h3>Specifications</h3>
            <div class="spec-grid">
              <div v-if="product.dimensions" class="spec-item">
                <span class="spec-label">Dimensions:</span>
                <span class="spec-value">{{ product.dimensions }}</span>
              </div>
              <div v-if="product.material" class="spec-item">
                <span class="spec-label">Material:</span>
                <span class="spec-value">{{ product.material }}</span>
              </div>
              <div v-if="product.weight" class="spec-item">
                <span class="spec-label">Weight:</span>
                <span class="spec-value">{{ product.weight }}</span>
              </div>
              <div v-if="product.capacity" class="spec-item">
                <span class="spec-label">Capacity:</span>
                <span class="spec-value">{{ product.capacity }}</span>
              </div>
              <div v-if="product.care_instructions" class="spec-item">
                <span class="spec-label">Care Instructions:</span>
                <span class="spec-value">{{ product.care_instructions }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Stock Update Modal -->
    <div v-if="showStockModal" class="modal-overlay" @click="closeStockModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>Update Stock</h3>
          <button @click="closeStockModal" class="close-btn">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-body">
          <p>Current stock: <strong>{{ product?.stock }}</strong></p>
          <div class="input-group">
            <label for="newStock">New Stock Quantity:</label>
            <input id="newStock" v-model.number="newStock" type="number" min="0" placeholder="Enter new stock quantity"
              class="stock-input" />
          </div>
          <p v-if="product?.status === 1" class="warning-text">
            <i class="fas fa-exclamation-triangle"></i>
            Note: Product must be unpublished before updating stock.
          </p>
        </div>
        <div class="modal-footer">
          <button @click="closeStockModal" class="btn btn-outline">Cancel</button>
          <button @click="updateStock"
            :disabled="stockUpdateLoading || product?.status === 1 || newStock === product?.stock"
            class="btn btn-primary">
            {{ stockUpdateLoading ? 'Updating...' : 'Update Stock' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Edit Product Modal -->
    <div v-if="showEditModal" class="modal-overlay" @click="closeEditModal">
      <div class="modal-content edit-modal" @click.stop>
        <div class="modal-header">
          <h3>Edit Product</h3>
          <button @click="closeEditModal" class="close-btn">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-body">
          <form @submit.prevent="saveProduct" class="edit-form">
            <!-- Basic Information -->
            <div class="form-section">
              <h4>Basic Information</h4>
              <div class="form-row">
                <div class="input-group">
                  <label for="editName">Product Name *</label>
                  <input id="editName" v-model="editForm.name" type="text" required placeholder="Enter product name"
                    class="form-input" />
                </div>
                <div class="input-group">
                  <label for="editCategory">Category *</label>
                  <select id="editCategory" v-model="editForm.category" required class="form-input">
                    <option value="">Select category</option>
                    <option value="餐具">餐具</option>
                    <option value="容器">容器</option>
                    <option value="装饰">装饰</option>
                    <option value="pottery">Pottery</option>
                    <option value="vases">Vases</option>
                  </select>
                </div>
              </div>
              <div class="form-row">
                <div class="input-group">
                  <label for="editPrice">Price (cents) *</label>
                  <input id="editPrice" v-model.number="editForm.price" type="number" min="0" required
                    placeholder="Enter price in cents" class="form-input" />
                  <small class="price-hint">Current: ${{ (editForm.price / 100).toFixed(2) }}</small>
                </div>
              </div>
              <div class="input-group">
                <label for="editDesc">Description</label>
                <textarea id="editDesc" v-model="editForm.desc" rows="3" placeholder="Enter product description"
                  class="form-input"></textarea>
              </div>
            </div>

            <!-- Specifications -->
            <div class="form-section">
              <h4>Specifications</h4>
              <div class="form-row">
                <div class="input-group">
                  <label for="editDimensions">Dimensions</label>
                  <input id="editDimensions" v-model="editForm.dimensions" type="text" placeholder="e.g., 10x8x15cm"
                    class="form-input" />
                </div>
                <div class="input-group">
                  <label for="editMaterial">Material</label>
                  <input id="editMaterial" v-model="editForm.material" type="text"
                    placeholder="e.g., Ceramic, Porcelain" class="form-input" />
                </div>
              </div>
              <div class="form-row">
                <div class="input-group">
                  <label for="editWeight">Weight</label>
                  <input id="editWeight" v-model="editForm.weight" type="text" placeholder="e.g., 0.5kg"
                    class="form-input" />
                </div>
                <div class="input-group">
                  <label for="editCapacity">Capacity</label>
                  <input id="editCapacity" v-model="editForm.capacity" type="text" placeholder="e.g., 500ml"
                    class="form-input" />
                </div>
              </div>
              <div class="input-group">
                <label for="editCareInstructions">Care Instructions</label>
                <textarea id="editCareInstructions" v-model="editForm.care_instructions" rows="2"
                  placeholder="Enter care instructions" class="form-input"></textarea>
              </div>
            </div>

            <!-- Image Upload -->
            <div class="form-section">
              <h4>Product Images</h4>
              <div class="image-upload-section">
                <div class="current-images" v-if="editForm.imageList && editForm.imageList.length > 0">
                  <label>Current Images:</label>
                  <div class="image-grid">
                    <div v-for="(image, index) in editForm.imageList" :key="index" class="image-item">
                      <img :src="getImageUrl(image)" :alt="`Product image ${index + 1}`" />
                      <button type="button" @click="removeImage(index)" class="remove-image-btn">
                        <i class="fas fa-times"></i>
                      </button>
                    </div>
                  </div>
                </div>
                <div class="upload-area">
                  <label for="imageUpload" class="upload-label">
                    <i class="fas fa-cloud-upload-alt"></i>
                    <span>Click to upload new images</span>
                    <small>JPG, PNG up to 10MB each</small>
                  </label>
                  <input id="imageUpload" type="file" @change="handleImageUpload"
                    accept="image/jpeg,image/jpg,image/png" multiple class="file-input" />
                </div>
                <div v-if="imageUploadLoading" class="upload-progress">
                  <div class="loading-spinner small"></div>
                  <span>Uploading images...</span>
                </div>
              </div>
            </div>
          </form>
        </div>
        <div class="modal-footer">
          <button type="button" @click="closeEditModal" class="btn btn-outline">Cancel</button>
          <button type="button" @click="saveProduct" :disabled="editLoading || !isFormValid" class="btn btn-primary">
            {{ editLoading ? 'Saving...' : 'Save Changes' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { ProductAPI, type ProductInfo, ProductStatus, type UpdateProductRequest } from '../services/product'
import { showSuccessNotification, showErrorNotification } from '../utils/notification'

// Route
const route = useRoute()

// Reactive state
const product = ref<ProductInfo | null>(null)
const isLoading = ref(true)
const error = ref<string>('')
const actionLoading = ref(false)
const showStockModal = ref(false)
const newStock = ref<number>(0)
const stockUpdateLoading = ref(false)

// Edit modal state
const showEditModal = ref(false)
const editLoading = ref(false)
const imageUploadLoading = ref(false)

// Edit form data
const editForm = ref({
  name: '',
  category: '',
  price: 0,
  desc: '',
  dimensions: '',
  material: '',
  weight: '',
  capacity: '',
  care_instructions: '',
  imageList: [] as string[]
})

// Image gallery state
const currentImageIndex = ref(0)

// Computed properties
const imageList = computed(() => {
  if (!product.value?.pic_info) return []

  // Handle both string and string[] types
  if (Array.isArray(product.value.pic_info)) {
    return product.value.pic_info
  }

  // If it's a string, try to parse as JSON first, then fallback to single image
  if (typeof product.value.pic_info === 'string') {
    try {
      const parsed = JSON.parse(product.value.pic_info)
      if (Array.isArray(parsed)) {
        return parsed
      } else if (typeof parsed === 'string') {
        return [parsed]
      }
    } catch {
      // If parsing fails, treat as single image ID
      return [product.value.pic_info]
    }
  }

  return []
})

const currentImage = computed(() => {
  return imageList.value[currentImageIndex.value] || null
})

const hasSpecifications = computed(() => {
  if (!product.value) return false
  return !!(product.value.dimensions || product.value.material ||
    product.value.weight || product.value.capacity ||
    product.value.care_instructions)
})

const isFormValid = computed(() => {
  return editForm.value.name.trim() !== '' &&
    editForm.value.category !== '' &&
    editForm.value.price > 0
})

// Methods
const loadProduct = async () => {
  try {
    isLoading.value = true
    error.value = ''

    const productId = Number(route.params.id)
    if (!productId || isNaN(productId)) {
      throw new Error('Invalid product ID')
    }

    const response = await ProductAPI.getProduct(productId)

    if (response.code !== 200) {
      throw new Error(response.err_msg || 'Failed to load product')
    }

    if (!response.data) {
      throw new Error('Product not found')
    }

    product.value = response.data
    product.value.id = productId
    newStock.value = response.data.stock || 0
    currentImageIndex.value = 0

  } catch (err) {
    error.value = err instanceof Error ? err.message : 'An unexpected error occurred'
    console.error('Error loading product:', err)
  } finally {
    isLoading.value = false
  }
}

const publishProduct = async () => {
  if (!product.value?.id) return

  try {
    actionLoading.value = true
    const response = await ProductAPI.publishProduct(product.value.id)

    if (response.code === 200) {
      product.value.status = ProductStatus.PUBLISHED
      showSuccessNotification('Product published successfully')
    } else {
      throw new Error(response.err_msg || 'Failed to publish product')
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to publish product'
    showErrorNotification(message)
    console.error('Error publishing product:', err)
  } finally {
    actionLoading.value = false
  }
}

const unpublishProduct = async () => {
  if (!product.value?.id) return

  try {
    actionLoading.value = true
    const response = await ProductAPI.unpublishProduct(product.value.id)

    if (response.code === 200) {
      product.value.status = ProductStatus.UNPUBLISHED
      showSuccessNotification('Product unpublished successfully')
    } else {
      throw new Error(response.err_msg || 'Failed to unpublish product')
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to unpublish product'
    showErrorNotification(message)
    console.error('Error unpublishing product:', err)
  } finally {
    actionLoading.value = false
  }
}

const updateStock = async () => {
  if (!product.value?.id) return

  try {
    stockUpdateLoading.value = true
    const response = await ProductAPI.updateStock(product.value.id, newStock.value)

    if (response.code === 200) {
      product.value.stock = newStock.value
      showSuccessNotification('Stock updated successfully')
      closeStockModal()
    } else {
      throw new Error(response.err_msg || 'Failed to update stock')
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to update stock'
    showErrorNotification(message)
    console.error('Error updating stock:', err)
  } finally {
    stockUpdateLoading.value = false
  }
}

// Image navigation methods
const selectImage = (index: number) => {
  currentImageIndex.value = index
}

const previousImage = () => {
  if (currentImageIndex.value > 0) {
    currentImageIndex.value--
  }
}

const nextImage = () => {
  if (currentImageIndex.value < imageList.value.length - 1) {
    currentImageIndex.value++
  }
}

// Modal methods
const closeStockModal = () => {
  showStockModal.value = false
  newStock.value = product.value?.stock || 0
}

// Edit modal methods
const openEditModal = () => {
  if (!product.value) return

  // Initialize form with current product data
  editForm.value = {
    name: product.value.name || '',
    category: product.value.category || '',
    price: product.value.price || 0,
    desc: product.value.desc || '',
    dimensions: product.value.dimensions || '',
    material: product.value.material || '',
    weight: product.value.weight || '',
    capacity: product.value.capacity || '',
    care_instructions: product.value.care_instructions || '',
    imageList: ProductAPI.parsePicInfo(product.value.pic_info as string)
  }

  showEditModal.value = true
}

const closeEditModal = () => {
  showEditModal.value = false
  editLoading.value = false
  imageUploadLoading.value = false
}

const removeImage = (index: number) => {
  editForm.value.imageList.splice(index, 1)
}

const handleImageUpload = async (event: Event) => {
  const target = event.target as HTMLInputElement
  const files = target.files

  if (!files || files.length === 0) return

  try {
    imageUploadLoading.value = true

    // Convert FileList to Array
    const fileArray = Array.from(files)

    // Upload images
    const imageIds = await ProductAPI.uploadMultipleImages(fileArray)

    // Add to current image list
    editForm.value.imageList.push(...imageIds)

    showSuccessNotification(`${fileArray.length} image(s) uploaded successfully`)

    // Clear the input
    target.value = ''

  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to upload images'
    showErrorNotification(message)
    console.error('Error uploading images:', err)
  } finally {
    imageUploadLoading.value = false
  }
}

const saveProduct = async () => {
  if (!product.value?.id || !isFormValid.value) {
    showErrorNotification('Please fill in all required fields before saving the product.')
    return
  }

  try {
    editLoading.value = true

    // Prepare update data
    const updateData: UpdateProductRequest = {
      id: product.value.id,
      name: editForm.value.name.trim(),
      category: editForm.value.category,
      price: editForm.value.price,
      desc: editForm.value.desc.trim(),
      pic_info: ProductAPI.formatPicInfo(editForm.value.imageList)
    }

    // Only include non-empty optional fields
    if (editForm.value.dimensions.trim()) updateData.dimensions = editForm.value.dimensions.trim()
    if (editForm.value.material.trim()) updateData.material = editForm.value.material.trim()
    if (editForm.value.weight.trim()) updateData.weight = editForm.value.weight.trim()
    if (editForm.value.capacity.trim()) updateData.capacity = editForm.value.capacity.trim()
    if (editForm.value.care_instructions.trim()) updateData.care_instructions = editForm.value.care_instructions.trim()

    const response = await ProductAPI.editProduct(updateData)

    if (response.code === 200) {
      showSuccessNotification('Product updated successfully')
      closeEditModal()
      // Reload product data to show updated information
      await loadProduct()
    } else {
      throw new Error(response.err_msg || 'Failed to update product')
    }

  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to update product'
    showErrorNotification(message)
    console.error('Error updating product:', err)
  } finally {
    editLoading.value = false
  }
}

// Utility methods
const formatCategory = (category: string) => {
  return category.charAt(0).toUpperCase() + category.slice(1)
}

const getImageUrl = (imageId: string) => {
  if (!imageId) return '/img/placeholder.svg'
  if (imageId.startsWith('http')) return imageId
  return `https://ceramicraft.s3.ap-southeast-1.amazonaws.com/${imageId}`
}

// Keyboard navigation
const handleKeydown = (event: KeyboardEvent) => {
  if (imageList.value.length <= 1) return

  switch (event.key) {
    case 'ArrowLeft':
      event.preventDefault()
      previousImage()
      break
    case 'ArrowRight':
      event.preventDefault()
      nextImage()
      break
    case 'Home':
      event.preventDefault()
      selectImage(0)
      break
    case 'End':
      event.preventDefault()
      selectImage(imageList.value.length - 1)
      break
  }
}

// Lifecycle
onMounted(() => {
  loadProduct()
  document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
})
</script>

<style scoped>
.product-detail-container {
  padding: 24px;
  max-width: 1200px;
  margin: 0 auto;
}

/* Loading and Error States */
.loading-state,
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  text-align: center;
}

.loading-spinner {
  width: 48px;
  height: 48px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid var(--primary-color);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }

  100% {
    transform: rotate(360deg);
  }
}

.error-icon {
  color: #f56565;
  margin-bottom: 16px;
}

.error-actions {
  display: flex;
  gap: 12px;
  margin-top: 16px;
}

/* Header */
.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--border-color);
}

.back-button {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--text-color);
  text-decoration: none;
  font-weight: 500;
  transition: color 0.3s;
}

.back-button:hover {
  color: var(--primary-color);
}

.header-actions {
  display: flex;
  gap: 12px;
}

/* Main Content */
.product-content {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 48px;
  align-items: start;
}

/* Image Section */
.image-section {
  position: sticky;
  top: 24px;
}

.main-image {
  width: 100%;
  aspect-ratio: 1;
  background: #f8f9fa;
  border-radius: 12px;
  overflow: hidden;
  margin-bottom: 16px;
  border: 1px solid var(--border-color);
}

.product-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.no-image {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--text-lightest);
}

.image-thumbnails {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
  overflow-x: auto;
  padding-bottom: 4px;
}

.thumbnail-btn {
  flex-shrink: 0;
  width: 60px;
  height: 60px;
  border: 2px solid transparent;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  transition: border-color 0.3s;
  background: none;
  padding: 0;
}

.thumbnail-btn:hover,
.thumbnail-btn.active {
  border-color: var(--primary-color);
}

.thumbnail-btn img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.image-navigation {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
}

.nav-btn {
  width: 40px;
  height: 40px;
  border: 1px solid var(--border-color);
  background: white;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s;
}

.nav-btn:hover:not(:disabled) {
  background: var(--primary-color);
  color: white;
  border-color: var(--primary-color);
}

.nav-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.image-counter {
  font-size: 14px;
  color: var(--text-light);
  min-width: 60px;
  text-align: center;
}

.image-indicators {
  display: flex;
  justify-content: center;
  gap: 8px;
  margin-top: 16px;
}

.indicator-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: none;
  background: #ddd;
  cursor: pointer;
  transition: background-color 0.3s;
  padding: 0;
}

.indicator-dot.active {
  background: var(--primary-color);
}

.indicator-dot:hover {
  background: var(--primary-hover);
}

/* Info Section */
.info-section {
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.basic-info {
  border-bottom: 1px solid var(--border-color);
  padding-bottom: 24px;
}

.product-title {
  font-size: 2.5em;
  font-weight: 600;
  margin: 0 0 16px 0;
  color: var(--text-color);
}

.product-meta {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 16px;
}

.category {
  padding: 6px 12px;
  background: var(--bg-light);
  border-radius: 6px;
  font-size: 14px;
  color: var(--text-light);
  font-weight: 500;
}

.status-badge {
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
}

.status-badge.published {
  background: #d4edda;
  color: #155724;
}

.status-badge.unpublished {
  background: #f8d7da;
  color: #721c24;
}

.price-stock {
  display: flex;
  align-items: center;
  gap: 24px;
}

.price {
  font-size: 2em;
  font-weight: 700;
  color: var(--primary-color);
}

.stock {
  font-size: 16px;
  color: var(--text-light);
}

.description-section h3,
.specifications h3 {
  font-size: 1.5em;
  font-weight: 600;
  margin: 0 0 16px 0;
  color: var(--text-color);
}

.description {
  font-size: 16px;
  line-height: 1.6;
  color: var(--text-light);
  margin: 0;
}

.spec-grid {
  display: grid;
  gap: 12px;
}

.spec-item {
  display: grid;
  grid-template-columns: 140px 1fr;
  gap: 16px;
  padding: 12px 0;
  border-bottom: 1px solid #f0f0f0;
}

.spec-item:last-child {
  border-bottom: none;
}

.spec-label {
  font-weight: 600;
  color: var(--text-color);
}

.spec-value {
  color: var(--text-light);
}

/* Buttons */
.btn {
  padding: 10px 20px;
  border-radius: 8px;
  font-weight: 500;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  transition: all 0.3s;
  border: 1px solid transparent;
  font-size: 14px;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-primary {
  background: var(--primary-color);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: var(--primary-hover);
}

.btn-success {
  background: #28a745;
  color: white;
}

.btn-success:hover:not(:disabled) {
  background: #218838;
}

.btn-warning {
  background: #ffc107;
  color: #212529;
}

.btn-warning:hover:not(:disabled) {
  background: #e0a800;
}

.btn-outline {
  background: white;
  color: var(--text-color);
  border-color: var(--border-color);
}

.btn-outline:hover:not(:disabled) {
  background: var(--bg-light);
}

/* Modal */
.modal-overlay {
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
}

.modal-content {
  background: white;
  border-radius: 12px;
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid var(--border-color);
}

.modal-header h3 {
  margin: 0;
  font-size: 1.25em;
  font-weight: 600;
}

.close-btn {
  background: none;
  border: none;
  font-size: 18px;
  color: var(--text-lightest);
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: color 0.3s;
}

.close-btn:hover {
  color: var(--text-color);
}

.modal-body {
  padding: 24px;
}

.input-group {
  margin: 16px 0;
}

.input-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: var(--text-color);
}

.stock-input {
  width: 100%;
  padding: 12px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  font-size: 16px;
  transition: border-color 0.3s;
}

.stock-input:focus {
  outline: none;
  border-color: var(--primary-color);
}

.warning-text {
  color: #856404;
  background: #fff3cd;
  padding: 12px;
  border-radius: 8px;
  border: 1px solid #ffeaa7;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 16px;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 20px 24px;
  border-top: 1px solid var(--border-color);
}

/* Responsive Design */
@media (max-width: 768px) {
  .product-content {
    grid-template-columns: 1fr;
    gap: 32px;
  }

  .detail-header {
    flex-direction: column;
    gap: 16px;
    align-items: stretch;
  }

  .header-actions {
    justify-content: center;
  }

  .product-title {
    font-size: 2em;
  }

  .price-stock {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .spec-item {
    grid-template-columns: 1fr;
    gap: 4px;
  }

  .image-section {
    position: static;
  }
}

/* Edit Modal Styles */
.edit-modal {
  max-width: 800px;
  max-height: 90vh;
}

.edit-form {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.form-section {
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 20px;
}

.form-section h4 {
  margin: 0 0 16px 0;
  font-size: 1.1em;
  font-weight: 600;
  color: var(--text-color);
  border-bottom: 1px solid var(--border-color);
  padding-bottom: 8px;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 16px;
}

.form-row:last-child {
  margin-bottom: 0;
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.input-group label {
  font-weight: 500;
  color: var(--text-color);
  font-size: 14px;
}

.form-input {
  padding: 10px 12px;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  font-size: 14px;
  transition: border-color 0.3s;
}

.form-input:focus {
  outline: none;
  border-color: var(--primary-color);
}

.form-input[required] {
  box-shadow: none;
}

.price-hint {
  color: var(--text-light);
  font-size: 12px;
  margin-top: 4px;
}

.image-upload-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.image-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 12px;
  margin-top: 8px;
}

.image-item {
  position: relative;
  width: 100px;
  height: 100px;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid var(--border-color);
}

.image-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.remove-image-btn {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 20px;
  height: 20px;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  border: none;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 10px;
  transition: background-color 0.3s;
}

.remove-image-btn:hover {
  background: rgba(255, 0, 0, 0.8);
}

.upload-area {
  border: 2px dashed var(--border-color);
  border-radius: 8px;
  padding: 20px;
  text-align: center;
  transition: border-color 0.3s;
}

.upload-area:hover {
  border-color: var(--primary-color);
}

.upload-label {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  color: var(--text-light);
}

.upload-label i {
  font-size: 24px;
  color: var(--primary-color);
}

.upload-label span {
  font-weight: 500;
}

.upload-label small {
  font-size: 12px;
  color: var(--text-lightest);
}

.file-input {
  display: none;
}

.upload-progress {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--text-light);
  font-size: 14px;
}

.loading-spinner.small {
  width: 16px;
  height: 16px;
  border-width: 2px;
}

/* Mobile responsive for edit modal */
@media (max-width: 768px) {
  .edit-modal {
    max-width: 95vw;
    margin: 20px;
  }

  .form-row {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  .image-grid {
    grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
  }

  .image-item {
    width: 80px;
    height: 80px;
  }
}
</style>