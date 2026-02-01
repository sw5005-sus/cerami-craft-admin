/**
 * @file 通知工具
 * @description 提供用户友好的通知功能
 */

export interface NotificationOptions {
  title?: string
  message: string
  type?: 'success' | 'error' | 'warning' | 'info'
  duration?: number
}

class NotificationManager {
  private container: HTMLElement | null = null

  constructor() {
    this.createContainer()
  }

  private createContainer() {
    if (this.container) return

    this.container = document.createElement('div')
    this.container.id = 'notification-container'
    this.container.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 9999;
      pointer-events: none;
    `
    document.body.appendChild(this.container)
  }

  show(options: NotificationOptions) {
    if (!this.container) this.createContainer()

    const notification = document.createElement('div')
    notification.style.cssText = `
      background: white;
      border-radius: 8px;
      padding: 16px;
      margin-bottom: 12px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      border-left: 4px solid ${this.getTypeColor(options.type || 'info')};
      max-width: 300px;
      opacity: 0;
      transform: translateX(100%);
      transition: all 0.3s ease;
      pointer-events: auto;
    `

    const title = options.title ? `<div style="font-weight: 600; margin-bottom: 4px; color: #1e293b;">${options.title}</div>` : ''
    const message = `<div style="color: #64748b; font-size: 14px;">${options.message}</div>`
    
    notification.innerHTML = title + message

    this.container!.appendChild(notification)

    // 触发动画
    setTimeout(() => {
      notification.style.opacity = '1'
      notification.style.transform = 'translateX(0)'
    }, 10)

    // 自动移除
    const duration = options.duration || 3000
    setTimeout(() => {
      notification.style.opacity = '0'
      notification.style.transform = 'translateX(100%)'
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification)
        }
      }, 300)
    }, duration)
  }

  private getTypeColor(type: string): string {
    switch (type) {
      case 'success': return '#10b981'
      case 'error': return '#ef4444'
      case 'warning': return '#f59e0b'
      default: return '#3b82f6'
    }
  }

  success(message: string, title?: string) {
    this.show({ message, title, type: 'success' })
  }

  error(message: string, title?: string) {
    this.show({ message, title, type: 'error' })
  }

  warning(message: string, title?: string) {
    this.show({ message, title, type: 'warning' })
  }

  info(message: string, title?: string) {
    this.show({ message, title, type: 'info' })
  }
}

export const notification = new NotificationManager()

// Convenience functions for easier usage
export const showSuccessNotification = (message: string, title?: string) => {
  notification.success(message, title)
}

export const showErrorNotification = (message: string, title?: string) => {
  notification.error(message, title)
}

export const showWarningNotification = (message: string, title?: string) => {
  notification.warning(message, title)
}

export const showInfoNotification = (message: string, title?: string) => {
  notification.info(message, title)
}