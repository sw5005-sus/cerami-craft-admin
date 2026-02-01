/**
 * @file 产品API服务
 * @description 管理产品相关的API调用
 */

import type {BaseResponse} from './auth'

// 产品状态枚举
export enum ProductStatus {
  UNPUBLISHED = 0,  // 未上架
  PUBLISHED = 1     // 已上架
}

// 产品信息类型 - 根据API文档定义
export interface ProductInfo {
  id?: number
  name: string
  category: string
  price: number
  stock: number
  desc: string
  pic_info?: string | string[] // 支持单张图片(string)或多张图片(string[])
  dimensions?: string
  material?: string
  weight?: string
  capacity?: string
  care_instructions?: string
  status?: ProductStatus
}

// 创建产品请求类型
export interface CreateProductRequest {
  name: string
  category: string
  price: number
  stock: number
  desc: string
  pic_info?: string | string[] // 支持单张图片(string)或多张图片(string[])
  dimensions?: string
  material?: string
  weight?: string
  capacity?: string
  care_instructions?: string
}

// 更新产品状态请求
export interface UpdateProductStatusRequest {
  id: number
}

// 更新产品库存请求
export interface UpdateProductStockRequest {
  id: number
  stock: number
}

// 更新产品信息请求
export interface UpdateProductRequest {
  id: number
  name?: string
  category?: string
  price?: number
  desc?: string
  dimensions?: string
  material?: string
  weight?: string
  capacity?: string
  care_instructions?: string
  pic_info?: string
}

// 图片上传请求
export interface ImgUploadRequest {
  image_type: 'jpg' | 'png' | 'jpeg'
}

// 图片上传响应
export interface ImgUploadResponse {
  image_id: string
  upload_url: string
}

// 商品列表查询参数
export interface ProductListParams {
  keyword?: string      // 搜索关键词
  category?: string     // 商品分类
  offset?: number       // 偏移量，默认0
  order_by?: number     // 排序方式：0-按更新时间降序，1-按更新时间升序，默认0
}

// 商品列表响应类型
export interface ProductListResponse {
  list: ProductInfo[]
  total: number
  offset?: number
  has_more?: boolean
}

// 产品API服务类
export class ProductAPI {
  private static readonly BASE_URL = '/api/product-ms/v1/merchant'

      /**
       * 添加商品
       * @param productData 商品数据
       * @returns Promise<BaseResponse>
       */
      static async addProduct(productData: CreateProductRequest):
          Promise<BaseResponse> {
    const response = await fetch(`${this.BASE_URL}/products`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(productData),
      credentials: 'include'  // 包含cookies进行认证
    })

    return response.json()
  }

  /**
   * 获取商品详情
   * @param productId 商品ID
   * @returns Promise<BaseResponse<ProductInfo>>
   */
  static async getProduct(productId: number):
      Promise<BaseResponse<ProductInfo>> {
    const response = await fetch(
        `${this.BASE_URL}/product/${productId}`,
        {method: 'GET', credentials: 'include'})

    return response.json()
  }

  /**
   * 上架商品
   * @param productId 商品ID
   * @returns Promise<BaseResponse>
   */
  static async publishProduct(productId: number): Promise<BaseResponse> {
    const response = await fetch(`${this.BASE_URL}/products/${productId}/status`, {
      method: 'PATCH',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({status: ProductStatus.PUBLISHED}),
      credentials: 'include'
    })

    return response.json()
  }

  /**
   * 下架商品
   * @param productId 商品ID
   * @returns Promise<BaseResponse>
   */
  static async unpublishProduct(productId: number): Promise<BaseResponse> {
    const response = await fetch(`${this.BASE_URL}/products/${productId}/status`, {
      method: 'PATCH',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({status: ProductStatus.UNPUBLISHED}),
      credentials: 'include'
    })

    return response.json()
  }

  /**
   * 更新商品库存
   * @param productId 商品ID
   * @param stock 新的库存数量
   * @returns Promise<BaseResponse>
   */
  static async updateStock(productId: number, stock: number):
      Promise<BaseResponse> {
    const response = await fetch(`${this.BASE_URL}/products/${productId}/stock`, {
      method: 'PATCH',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({stock: stock}),
      credentials: 'include'
    })

    return response.json()
  }

  /**
   * 编辑商品信息
   * @param productData 商品更新数据
   * @returns Promise<BaseResponse>
   */
  static async editProduct(productData: UpdateProductRequest):
      Promise<BaseResponse> {
    const { id, ...updateData } = productData
    const response = await fetch(`${this.BASE_URL}/products/${id}`, {
      method: 'PUT',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(updateData),
      credentials: 'include'
    })

    return response.json()
  }

  /**
   * 获取图片上传预签名URL
   * @param imageType 图片类型
   * @returns Promise<BaseResponse<ImgUploadResponse>>
   */
  static async getImageUploadUrl(imageType: 'jpg' | 'png' | 'jpeg'):
      Promise<BaseResponse<ImgUploadResponse>> {
    try {
      const response = await fetch(`${this.BASE_URL}/images/upload-urls`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({image_type: imageType}),
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Error getting upload URL:', error)
      throw error
    }
  }

  /**
   * 上传图片到预签名URL
   * @param uploadUrl 预签名URL
   * @param file 图片文件
   * @returns Promise<Response>
   */
  static async uploadImageToUrl(uploadUrl: string, file: File): Promise<Response> {
    try {
      const response = await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type
        }
      })

      if (!response.ok) {
        throw new Error(`Upload failed with status: ${response.status} ${response.statusText}`)
      }

      return response
    } catch (error) {
      console.error('Error uploading to S3:', error)
      throw error
    }
  }

  /**
   * 完整的图片上传流程
   * @param file 图片文件
   * @returns Promise<string> 返回image_id
   */
  static async uploadImage(file: File): Promise<string> {
    // 验证文件类型
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png']
    if (!allowedTypes.includes(file.type)) {
      throw new Error('Only JPG, JPEG, and PNG files are allowed')
    }

    // 获取文件扩展名
    const fileType = file.type.split('/')[1] as 'jpg' | 'png' | 'jpeg'
    const imageType = fileType === 'jpeg' ? 'jpg' : fileType

    try {
      console.log('Step 1: Getting upload URL for image type:', imageType)
      
      // 第一步：获取预签名URL
      const uploadUrlResponse = await this.getImageUploadUrl(imageType)
      
      console.log('Upload URL response:', uploadUrlResponse)
      
      // 检查API是否成功响应
      if (uploadUrlResponse.code && uploadUrlResponse.code !== 200) {
        throw new Error(uploadUrlResponse.err_msg || 'Failed to get upload URL')
      }
      
      // 获取数据 - 检查是否有data字段，如果没有则假定整个响应就是数据
      let responseData: ImgUploadResponse
      if (uploadUrlResponse.data) {
        responseData = uploadUrlResponse.data
      } else {
        // 如果没有data字段，假定整个响应包含image_id和upload_url
        responseData = uploadUrlResponse as unknown as ImgUploadResponse
      }
      
      const image_id = responseData.image_id
      const upload_url = responseData.upload_url

      console.log('Extracted data:', { image_id, upload_url })

      if (!upload_url || !image_id) {
        console.error('Missing data in response:', responseData)
        throw new Error('Incomplete upload data received')
      }

      console.log('Step 2: Uploading to S3 with image_id:', image_id)

      // 第二步：上传图片到预签名URL
      await this.uploadImageToUrl(upload_url, file)
      
      console.log('S3 upload completed successfully')

      return image_id
    } catch (error) {
      console.error('Image upload failed:', error)
      if (error instanceof Error) {
        throw new Error(`Image upload failed: ${error.message}`)
      }
      throw new Error('Image upload failed: Unknown error')
    }
  }

  /**
   * 批量上传多张图片
   * @param files 图片文件数组
   * @returns Promise<string[]> 返回图片URL数组
   */
  static async uploadMultipleImages(files: File[]): Promise<string[]> {
    const uploadPromises = files.map(file => this.uploadImage(file))
    
    try {
      const imageUrls = await Promise.all(uploadPromises)
      console.log('All images uploaded successfully:', imageUrls)
      return imageUrls
    } catch (error) {
      console.error('Failed to upload multiple images:', error)
      throw error
    }
  }

  /**
   * 格式化图片信息为字符串（用于存储到数据库）
   * @param imageUrls 图片URL数组
   * @returns string JSON字符串格式的图片信息
   */
  static formatPicInfo(imageUrls: string[]): string {
    return JSON.stringify(imageUrls)
  }

  /**
   * 解析图片信息字符串
   * @param picInfo 图片信息字符串
   * @returns string[] 图片URL数组
   */
  static parsePicInfo(picInfo?: string): string[] {
    if (!picInfo) return []
    
    try {
      const parsed = JSON.parse(picInfo)
      if (Array.isArray(parsed)) {
        return parsed
      } else if (typeof parsed === 'string') {
        return [parsed]
      } else {
        return []
      }
    } catch {
      // 如果不是JSON格式，假定是单张图片的URL
      return [picInfo]
    }
  }

  /**
   * 获取商家端商品列表
   * @param params 查询参数
   * @returns Promise<BaseResponse<ProductListResponse>>
   */
  static async getMerchantProductList(params: ProductListParams = {}): 
      Promise<BaseResponse<ProductListResponse>> {
    const queryParams = new URLSearchParams()
    
    if (params.keyword) queryParams.append('keyword', params.keyword)
    if (params.category) queryParams.append('category', params.category)
    if (params.offset !== undefined) queryParams.append('offset', params.offset.toString())
    if (params.order_by !== undefined) queryParams.append('order_by', params.order_by.toString())
    
    const queryString = queryParams.toString()
    const url = `${this.BASE_URL}/products${queryString ? `?${queryString}` : ''}`
    
    const response = await fetch(url, {
      method: 'GET',
      credentials: 'include'
    })

    return response.json()
  }
}