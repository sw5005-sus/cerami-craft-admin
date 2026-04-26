<template>
    <div class="add-product-container">
        <!-- Header -->
        <div class="header">
            <div class="breadcrumb">
                <span>Products</span>
                <span class="divider">></span>
                <span class="current">Add New Product</span>
            </div>
            <h1>Add New Product</h1>
            <p class="subtitle">Fill in the details to add a new product to your inventory</p>
        </div>

        <!-- Form Container -->
        <div class="form-container">
            <form @submit.prevent="handleSubmit" class="product-form">
                <!-- Product Name -->
                <div class="form-group">
                    <label class="form-label required">Product Name</label>
                    <input v-model="form.name" type="text" class="form-input" placeholder="Enter product name"
                        :class="{ 'error': errors.name }" />
                    <span v-if="errors.name" class="error-message">{{ errors.name }}</span>
                </div>

                <!-- Category and Price Row -->
                <div class="form-row">
                    <div class="form-group half-width">
                        <label class="form-label required">Category</label>
                        <select v-model="form.category" class="form-select" :class="{ 'error': errors.category }">
                            <option value="">Select category</option>
                            <option value="dinnerware">Dinnerware</option>
                            <option value="drinkware">Drinkware</option>
                            <option value="vases_decor">Vases & Decorative</option>
                            <option value="tea_sets">Tea & Coffee Sets</option>
                            <option value="kitchenware">Kitchenware</option>
                            <option value="tiles_panels">Tiles & Wall Panels</option>
                            <option value="garden_outdoor">Garden & Outdoor</option>
                            <option value="pottery">Pottery</option>
                            <option value="ceramics">Ceramics</option>
                        </select>
                        <span v-if="errors.category" class="error-message">{{ errors.category }}</span>
                    </div>

                    <div class="form-group half-width">
                        <label class="form-label required">Price</label>
                        <div class="price-input-container">
                            <span class="currency-symbol">$</span>
                            <input v-model="form.price" type="number" step="0.01" min="0" class="form-input price-input"
                                placeholder="0.00" :class="{ 'error': errors.price }" />
                        </div>
                        <span v-if="errors.price" class="error-message">{{ errors.price }}</span>
                    </div>
                </div>

                <!-- Stock -->
                <div class="form-group">
                    <label class="form-label required">Stock</label>
                    <input v-model="form.stock" type="number" min="0" class="form-input stock-input" placeholder="0"
                        :class="{ 'error': errors.stock }" />
                    <span v-if="errors.stock" class="error-message">{{ errors.stock }}</span>
                </div>

                <!-- Product Image Upload -->
                <div class="form-group">
                    <label class="form-label">Product Image</label>
                    <div class="upload-container">
                        <div class="upload-area" :class="{ 'has-image': previewUrls.length > 0, 'dragover': isDragOver }"
                            @click="triggerFileInput" @dragenter.prevent="handleDragEnter"
                            @dragover.prevent="handleDragOver" @dragleave.prevent="handleDragLeave"
                            @drop.prevent="handleDrop">
                            <div v-if="previewUrls.length === 0" class="upload-placeholder">
                                <i class="fas fa-cloud-upload-alt fa-3x upload-icon"></i>
                                <p class="upload-text">Drag and drop images here, or</p>
                                <button type="button" class="select-file-btn">Select Images</button>
                                <p class="upload-text" style="font-size: 12px; color: #9ca3af;">
                                    Supported formats: JPG, JPEG, PNG (Max 10MB each)
                                </p>
                            </div>
                            <div v-else class="image-previews">
                                <div v-for="(url, index) in previewUrls" :key="index" class="image-preview-item">
                                    <img :src="url" :alt="`Product preview ${index + 1}`" class="preview-img" />
                                    <button type="button" class="remove-image-btn" @click.stop="removeImage(index)"
                                        :title="`Remove image ${index + 1}`">
                                        <i class="fas fa-times"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                        <input ref="fileInput" type="file" class="file-input" multiple accept="image/jpeg,image/jpg,image/png"
                            @change="handleFileSelect" />
                        <div v-if="uploadProgress > 0 && uploadProgress < 100" class="upload-progress">
                            <div class="progress-bar">
                                <div class="progress-fill" :style="{ width: uploadProgress + '%' }"></div>
                            </div>
                            <span class="progress-text">Uploading... {{ uploadProgress }}%</span>
                        </div>
                        <span v-if="errors.image" class="error-message">{{ errors.image }}</span>
                    </div>
                </div>

                <!-- AI Generate Section -->
                <div class="ai-section">
                    <div class="ai-header">
                        <h3 class="section-title" style="margin:0">AI Content Generation</h3>
                        <button type="button" class="btn btn-ai" :disabled="isAiGenerating" @click="handleAiGenerate">
                            <span v-if="isAiGenerating">Generating...</span>
                            <span v-else>&#10024; AI Generate</span>
                        </button>
                    </div>
                    <p class="ai-hint">Fill in Product Name (and optionally upload an image above), then click AI Generate. Gemini will auto-fill description, category, SEO keywords, and promotional content.</p>
                    <div v-if="aiResult" class="ai-result">
                        <div v-if="aiResult.image_analysis?.name_suggestion" class="ai-result-block">
                            <div class="ai-result-label">Image Analysis (Gemini Vision)</div>
                            <div class="ai-result-item"><strong>Detected:</strong> {{ aiResult.image_analysis.name_suggestion }}</div>
                            <div class="ai-result-item"><strong>Material:</strong> {{ aiResult.image_analysis.material }}</div>
                            <div class="ai-result-item"><strong>Color:</strong> {{ aiResult.image_analysis.color }}</div>
                            <div v-if="aiResult.image_analysis.description_hints" class="ai-result-item" style="margin-top:4px;font-style:italic;color:#64748b">{{ aiResult.image_analysis.description_hints }}</div>
                        </div>
                        <div v-if="aiResult.categorization" class="ai-result-block">
                            <div class="ai-result-label">Categorization</div>
                            <div class="ai-tags">
                                <span class="ai-tag category">{{ aiResult.categorization.category }}</span>
                                <span class="ai-tag style">{{ aiResult.categorization.style }}</span>
                                <span class="ai-tag confidence">{{ (aiResult.categorization.confidence * 100).toFixed(0) }}%</span>
                            </div>
                            <div v-if="aiResult.categorization.tags?.length" class="ai-tags" style="margin-top:6px">
                                <span v-for="tag in aiResult.categorization.tags" :key="tag" class="ai-tag">{{ tag }}</span>
                            </div>
                        </div>
                        <div v-if="aiResult.description?.seo_keywords?.length" class="ai-result-block">
                            <div class="ai-result-label">SEO Keywords</div>
                            <div class="ai-tags">
                                <span v-for="kw in aiResult.description.seo_keywords" :key="kw" class="ai-tag seo">{{ kw }}</span>
                            </div>
                        </div>
                        <div v-if="aiPromotion" class="ai-result-block">
                            <div class="ai-result-label">Promotion</div>
                            <div class="ai-result-item"><strong>Headline:</strong> {{ aiPromotion.headline }}</div>
                            <div class="ai-result-item"><strong>Short Text:</strong> {{ aiPromotion.short_text }}</div>
                            <div class="ai-result-item"><strong>CTA:</strong> {{ aiPromotion.call_to_action }}</div>
                            <div class="ai-tags" style="margin-top:6px">
                                <span v-for="h in aiPromotion.hashtags" :key="h" class="ai-tag hashtag">{{ h }}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Description -->
                <div class="form-group">
                    <label class="form-label required">Description</label>
                    <textarea v-model="form.desc" class="form-textarea" placeholder="Enter product description" rows="4"
                        :class="{ 'error': errors.desc }"></textarea>
                    <span v-if="errors.desc" class="error-message">{{ errors.desc }}</span>
                </div>

                <!-- Specifications -->
                <div class="specifications-section">
                    <h3 class="section-title">Specifications</h3>

                    <div class="form-group">
                        <label class="form-label">Dimensions</label>
                        <input v-model="form.dimensions" type="text" class="form-input"
                            placeholder="Enter dimensions (e.g., 10&quot; x 5&quot; x 3&quot;)" />
                    </div>

                    <div class="form-group">
                        <label class="form-label">Material</label>
                        <input v-model="form.material" type="text" class="form-input"
                            placeholder="Enter material (e.g., Porcelain, Stoneware)" />
                    </div>

                    <div class="form-group">
                        <label class="form-label">Weight</label>
                        <input v-model="form.weight" type="text" class="form-input"
                            placeholder="Enter weight (e.g., 2.5 lbs)" />
                    </div>

                    <div class="form-group">
                        <label class="form-label">Capacity</label>
                        <input v-model="form.capacity" type="text" class="form-input"
                            placeholder="Enter capacity (e.g., 16 oz, 500ml)" />
                    </div>

                    <div class="form-group">
                        <label class="form-label">Care Instructions</label>
                        <textarea v-model="form.care_instructions" class="form-textarea"
                            placeholder="Enter care instructions (e.g., Dishwasher safe, Hand wash only)"
                            rows="3"></textarea>
                    </div>
                </div>

                <!-- Form Actions -->
                <div class="form-actions">
                    <button type="button" @click="handleCancel" class="btn btn-cancel">
                        Cancel
                    </button>
                    <button type="submit" class="btn btn-save" :disabled="isSubmitting">
                        {{ isSubmitting ? 'Saving...' : 'Save' }}
                    </button>
                </div>
            </form>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ProductAPI, type CreateProductRequest } from '../services/product'
import { handleAPIError, HTTP_STATUS } from '../services/auth'
import { notification } from '../utils/notification'

const router = useRouter()

// Form data
const form = reactive({
    name: '',
    category: '',
    price: '',
    stock: '',
    pic_info: [] as string[], // 改为数组支持多图片
    desc: '',
    dimensions: '',
    material: '',
    weight: '',
    capacity: '',
    care_instructions: ''
})

// Image upload related state
const fileInput = ref<HTMLInputElement>()
const previewUrls = ref<string[]>([]) // 改为数组支持多图片预览
const uploadProgress = ref<number>(0)
const isDragOver = ref<boolean>(false)
const selectedFiles = ref<File[]>([]) // 改为数组支持多文件

// Form validation errors
const errors = reactive({
    name: '',
    category: '',
    price: '',
    stock: '',
    desc: '',
    image: ''
})

// Form state
const isSubmitting = ref(false)

// AI generation state
const isAiGenerating = ref(false)
const aiResult = ref<any>(null)
const aiPromotion = ref<any>(null)
const AI_API_URL = import.meta.env.VITE_API_URL + '/product-agent/product'

const handleAiGenerate = async () => {
    if (!form.name.trim()) {
        notification.error('Please enter a Product Name first', 'Missing Info')
        return
    }

    isAiGenerating.value = true
    aiResult.value = null
    aiPromotion.value = null

    try {
        let response: Response

        if (selectedFiles.value.length > 0) {
            const formData = new FormData()
            formData.append('image', selectedFiles.value[0])
            formData.append('name', form.name)
            formData.append('desc', form.desc || '')
            formData.append('material', form.material || '')
            formData.append('dimensions', form.dimensions || '')
            formData.append('weight', form.weight || '')
            formData.append('capacity', form.capacity || '')
            formData.append('care_instructions', form.care_instructions || '')
            formData.append('price', form.price ? String(parseFloat(form.price) * 100) : '0')
            formData.append('stock', form.stock ? form.stock : '0')
            formData.append('promotion_type', 'new_arrival')

            response = await fetch(`${AI_API_URL}/process-with-image`, {
                method: 'POST',
                credentials: 'include',
                body: formData,
            })
        } else {
            const body = {
                name: form.name,
                category: form.category || '',
                price: form.price ? parseFloat(form.price) * 100 : 0,
                desc: form.desc || '',
                stock: form.stock ? parseInt(form.stock) : 0,
                material: form.material || '',
                dimensions: form.dimensions || '',
                weight: form.weight || '',
                capacity: form.capacity || '',
                care_instructions: form.care_instructions || '',
                status: 0,
                promotion_type: 'new_arrival',
            }

            response = await fetch(`${AI_API_URL}/process`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(body),
            })
        }

        if (!response.ok) {
            throw new Error(`AI API returned ${response.status}`)
        }

        const data = await response.json()
        aiResult.value = data

        // Auto-fill form fields from AI response
        if (data.commodity_payload) {
            const p = data.commodity_payload
            if (p.category) form.category = p.category
            if (p.desc) form.desc = p.desc
            if (p.material && !form.material) form.material = p.material
            if (p.dimensions && !form.dimensions) form.dimensions = p.dimensions
            if (p.weight && !form.weight) form.weight = p.weight
            if (p.capacity && !form.capacity) form.capacity = p.capacity
            if (p.care_instructions && !form.care_instructions) form.care_instructions = p.care_instructions
        }

        // Show promotion content
        if (data.promotion) {
            aiPromotion.value = data.promotion
        }

        notification.success('AI content generated! Description and fields auto-filled.', 'AI Generated')
    } catch (error) {
        console.error('AI generation failed:', error)
        notification.error('AI generation failed. Please try again.', 'Error')
    } finally {
        isAiGenerating.value = false
    }
}

// Image upload functions
const triggerFileInput = () => {
    fileInput.value?.click()
}

const handleFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement
  if (target.files && target.files.length > 0) {
    const newFiles = Array.from(target.files)
    selectedFiles.value = [...selectedFiles.value, ...newFiles]
    
    // 为每个新文件生成预览URL
    newFiles.forEach(file => {
      processFile(file)
    })
  }
}

const handleDragEnter = (event: DragEvent) => {
    event.preventDefault()
    isDragOver.value = true
}

const handleDragOver = (event: DragEvent) => {
    event.preventDefault()
    isDragOver.value = true
}

const handleDragLeave = (event: DragEvent) => {
    event.preventDefault()
    isDragOver.value = false
}

const handleDrop = (event: DragEvent) => {
    event.preventDefault()
    isDragOver.value = false

    if (event.dataTransfer?.files && event.dataTransfer.files.length > 0) {
        const newFiles = Array.from(event.dataTransfer.files)
        selectedFiles.value = [...selectedFiles.value, ...newFiles]
        
        // 为每个文件生成预览并上传
        newFiles.forEach(file => {
            processFile(file)
        })
    }
}

const processFile = (file: File) => {
    // Reset previous errors
    errors.image = ''

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png']
    if (!allowedTypes.includes(file.type)) {
        errors.image = 'Only JPG, JPEG, and PNG files are allowed'
        return
    }

    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
        errors.image = 'File size must be less than 10MB'
        return
    }

    // 生成预览URL并添加到数组
    const previewUrl = URL.createObjectURL(file)
    previewUrls.value.push(previewUrl)

    // Upload the image immediately
    uploadImage(file)
}

const uploadImage = async (file: File) => {
    try {
        uploadProgress.value = 10

        // Upload image and get image_id
        const imageId = await ProductAPI.uploadImage(file)

        uploadProgress.value = 100

        // Add the image_id to the form array
        form.pic_info.push(imageId)

        notification.success('Image uploaded successfully!', 'Success')

        // Reset progress after a short delay
        setTimeout(() => {
            uploadProgress.value = 0
        }, 1000)

    } catch (error) {
        console.error('Image upload failed:', error)
        errors.image = error instanceof Error ? error.message : 'Failed to upload image'
        notification.error('Failed to upload image', 'Upload Error')
    }
}

const removeImage = (index: number) => {
    // 清理预览URL
    if (previewUrls.value[index]) {
        URL.revokeObjectURL(previewUrls.value[index])
    }
    
    // 从数组中移除对应的项目
    previewUrls.value.splice(index, 1)
    selectedFiles.value.splice(index, 1)
    form.pic_info.splice(index, 1)
    
    errors.image = ''
}

// Form validation
const validateForm = () => {
    let isValid = true

    // Reset errors
    Object.keys(errors).forEach(key => {
        errors[key as keyof typeof errors] = ''
    })

    // Product name validation
    if (!form.name.trim()) {
        errors.name = 'Product name is required'
        isValid = false
    }

    // Category validation
    if (!form.category) {
        errors.category = 'Category is required'
        isValid = false
    }

    // Price validation
    if (!form.price || parseFloat(form.price) <= 0) {
        errors.price = 'Valid price is required'
        isValid = false
    }

    // Stock validation
    if (!form.stock || parseInt(form.stock) < 0) {
        errors.stock = 'Valid stock quantity is required'
        isValid = false
    }

    // Description validation
    if (!form.desc.trim()) {
        errors.desc = 'Product description is required'
        isValid = false
    }

    return isValid
}

// Form handlers
const handleSubmit = async () => {
    if (!validateForm()) {
        return
    }

    isSubmitting.value = true

    try {
        // 准备产品数据 - 根据新API文档格式
        const productData: CreateProductRequest = {
            name: form.name,
            category: form.category,
            price: parseFloat(form.price) * 100, 
            stock: parseInt(form.stock),
            desc: form.desc,
            pic_info: form.pic_info.length > 0 ? JSON.stringify(form.pic_info) : undefined,
            dimensions: form.dimensions || undefined,
            material: form.material || undefined,
            weight: form.weight || undefined,
            capacity: form.capacity || undefined,
            care_instructions: form.care_instructions || undefined
        }

        // 调用API创建产品
        const response = await ProductAPI.addProduct(productData)

        if (response.code === HTTP_STATUS.OK) {
            notification.success('Product created successfully!', 'Success')
            // 延迟跳转，让用户看到成功消息
            setTimeout(() => {
                router.push('/products')
            }, 1500)
        } else {
            notification.error(handleAPIError(response, 'Failed to create product'), 'Error')
        }

    } catch (error) {
        console.error('Error creating product:', error)
        notification.error('Network error, please try again later', 'Connection Error')
    } finally {
        isSubmitting.value = false
    }
}

const handleCancel = () => {
    router.back()
}
</script>

<style scoped>
.add-product-container {
    width: 100%;
    max-width: 900px;
    margin: 0 auto;
    padding: 24px;
    background: #f8f9fb;
    min-height: 100vh;
    box-sizing: border-box;
}

.header {
    margin-bottom: 32px;
}

.breadcrumb {
    font-size: 14px;
    color: #64748b;
    margin-bottom: 8px;
}

.breadcrumb .divider {
    margin: 0 8px;
}

.breadcrumb .current {
    color: #334155;
    font-weight: 500;
}

.header h1 {
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

.form-container {
    background: white;
    border-radius: 12px;
    padding: 32px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.product-form {
    display: flex;
    flex-direction: column;
    gap: 24px;
}

.form-group {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.form-row {
    display: flex;
    gap: 16px;
}

.half-width {
    flex: 1;
}

.form-label {
    font-size: 14px;
    font-weight: 500;
    color: #374151;
}

.form-label.required::after {
    content: ' *';
    color: #ef4444;
}

.form-input,
.form-select,
.form-textarea {
    padding: 12px 16px;
    border: 1px solid #d1d5db;
    border-radius: 8px;
    font-size: 14px;
    transition: border-color 0.2s, box-shadow 0.2s;
}

.form-input:focus,
.form-select:focus,
.form-textarea:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.form-input.error,
.form-select.error,
.form-textarea.error {
    border-color: #ef4444;
}

.price-input-container {
    position: relative;
    display: flex;
    align-items: center;
}

.currency-symbol {
    position: absolute;
    left: 16px;
    color: #6b7280;
    font-weight: 500;
    z-index: 1;
}

.price-input {
    padding-left: 40px;
}

.stock-input {
    max-width: 200px;
}

.upload-container {
    width: 100%;
}

.upload-area {
    border: 2px dashed #d1d5db;
    border-radius: 12px;
    padding: 48px 24px;
    text-align: center;
    cursor: pointer;
    transition: all 0.2s;
    background: #f9fafb;
}

.upload-area:hover {
    border-color: #3b82f6;
    background: #eff6ff;
}

.upload-area.dragover {
    border-color: #3b82f6;
    background: #eff6ff;
}

.upload-area.has-image {
    padding: 0;
    border: none;
    background: transparent;
}

.upload-placeholder {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
}

.upload-icon {
    color: #9ca3af;
}

.upload-text {
    color: #6b7280;
    font-size: 14px;
    margin: 0;
}

.select-file-btn {
    background: #3b82f6;
    color: white;
    border: none;
    padding: 8px 16px;
    border-radius: 6px;
    font-size: 14px;
    cursor: pointer;
    transition: background-color 0.2s;
}

.select-file-btn:hover {
    background: #2563eb;
}

.image-preview {
    position: relative;
    display: inline-block;
    border-radius: 12px;
    overflow: hidden;
}

.preview-img {
    max-width: 100%;
    max-height: 300px;
    width: auto;
    height: auto;
    display: block;
}

.remove-image-btn {
    position: absolute;
    top: 8px;
    right: 8px;
    background: rgba(0, 0, 0, 0.7);
    color: white;
    border: none;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    font-size: 18px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background-color 0.2s;
}

.remove-image-btn:hover {
    background: rgba(0, 0, 0, 0.9);
}

.file-input {
    display: none;
}

.upload-progress {
    margin-top: 16px;
    text-align: center;
}

.progress-bar {
    width: 100%;
    height: 8px;
    background-color: #e5e7eb;
    border-radius: 4px;
    overflow: hidden;
    margin-bottom: 8px;
}

.progress-fill {
    height: 100%;
    background-color: #3b82f6;
    transition: width 0.3s ease;
}

.progress-text {
    font-size: 14px;
    color: #6b7280;
}

.image-preview-small {
    margin-top: 12px;
    max-width: 200px;
    border-radius: 8px;
    overflow: hidden;
    border: 1px solid #e5e7eb;
}

.image-preview-small img {
    width: 100%;
    height: auto;
    display: block;
}

/* AI Generate Section */
.ai-section {
    background: linear-gradient(135deg, #f0f7ff, #e8f4f8);
    border: 1px solid #bdd8f1;
    border-radius: 12px;
    padding: 20px;
}

.ai-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
}

.btn-ai {
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
    color: white;
    padding: 10px 20px;
    border: none;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
}

.btn-ai:hover:not(:disabled) {
    background: linear-gradient(135deg, #4f46e5, #7c3aed);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4);
}

.btn-ai:disabled {
    opacity: 0.6;
    cursor: not-allowed;
}

.ai-hint {
    font-size: 13px;
    color: #64748b;
    margin: 0;
}

.ai-result {
    margin-top: 12px;
    padding: 12px;
    background: white;
    border-radius: 8px;
    border: 1px solid #e2e8f0;
}

.ai-result-block {
    margin-bottom: 12px;
    padding-bottom: 12px;
    border-bottom: 1px solid #e2e8f0;
}

.ai-result-block:last-child {
    margin-bottom: 0;
    padding-bottom: 0;
    border-bottom: none;
}

.ai-result-label {
    font-size: 12px;
    font-weight: 600;
    color: #6366f1;
    text-transform: uppercase;
    margin-bottom: 6px;
}

.ai-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
}

.ai-tag {
    display: inline-block;
    padding: 3px 10px;
    border-radius: 12px;
    font-size: 12px;
    font-weight: 500;
    background: #f0f0ff;
    color: #4f46e5;
}

.ai-tag.category { background: #dbeafe; color: #1e40af; }
.ai-tag.style { background: #fef3c7; color: #92400e; }
.ai-tag.confidence { background: #d1fae5; color: #065f46; }
.ai-tag.seo { background: #fce7f3; color: #9d174d; }
.ai-tag.hashtag { background: #e0e7ff; color: #3730a3; }

.ai-result-item {
    font-size: 13px;
    color: #334155;
    margin-bottom: 6px;
}

.ai-result-item:last-child {
    margin-bottom: 0;
}

.specifications-section {
    border-top: 1px solid #e5e7eb;
    padding-top: 24px;
}

.section-title {
    font-size: 18px;
    font-weight: 600;
    color: #1e293b;
    margin: 0 0 24px 0;
}

.form-actions {
    display: flex;
    gap: 16px;
    justify-content: flex-end;
    border-top: 1px solid #e5e7eb;
    padding-top: 24px;
    margin-top: 32px;
}

.btn {
    padding: 12px 24px;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
    border: none;
}

.btn-cancel {
    background: #f3f4f6;
    color: #374151;
}

.btn-cancel:hover {
    background: #e5e7eb;
}

.btn-save {
    background: #dc6643;
    color: white;
}

.btn-save:hover:not(:disabled) {
    background: #c55a3a;
}

.btn-save:disabled {
    background: #9ca3af;
    cursor: not-allowed;
}

.error-message {
    color: #ef4444;
    font-size: 12px;
    margin-top: 4px;
}

/* 多图片预览样式 */
.image-previews {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 16px;
    margin-top: 16px;
}

.image-preview-item {
    position: relative;
    border-radius: 8px;
    overflow: hidden;
    background: #f8f9fa;
    aspect-ratio: 1;
}

.image-preview-item img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.image-preview-item .remove-btn {
    position: absolute;
    top: 8px;
    right: 8px;
    background: rgba(0, 0, 0, 0.7);
    color: white;
    border: none;
    border-radius: 50%;
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    font-size: 14px;
    transition: background-color 0.2s;
}

.image-preview-item .remove-btn:hover {
    background: rgba(0, 0, 0, 0.9);
}

@media (max-width: 768px) {
    .add-product-container {
        padding: 16px;
        max-width: none;
    }

    .form-container {
        padding: 20px 16px;
    }

    .form-row {
        flex-direction: column;
        gap: 20px;
    }

    .form-actions {
        flex-direction: column-reverse;
        gap: 12px;
    }

    .btn {
        width: 100%;
    }
}

@media (min-width: 769px) and (max-width: 1024px) {
    .add-product-container {
        padding: 20px;
        max-width: 800px;
    }
}

@media (min-width: 1025px) {
    .add-product-container {
        padding: 32px 24px;
        max-width: 900px;
    }
}
</style>