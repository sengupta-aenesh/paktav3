import React from 'react'

interface ErrorMessageProps {
  title?: string
  message: string
  type?: 'error' | 'warning' | 'info'
  onRetry?: () => void
  className?: string
}

export function ErrorMessage({ 
  title = "Error", 
  message, 
  type = 'error', 
  onRetry,
  className = ''
}: ErrorMessageProps) {
  const typeStyles = {
    error: {
      containerClass: 'alert alert-error',
      iconColor: '',
      titleColor: '',
      messageColor: '',
      buttonClass: 'btn btn-primary btn-sm'
    },
    warning: {
      containerClass: 'alert alert-warning',
      iconColor: '',
      titleColor: '',
      messageColor: '',
      buttonClass: 'btn btn-primary btn-sm'
    },
    info: {
      containerClass: 'alert',
      iconColor: '',
      titleColor: '',
      messageColor: '',
      buttonClass: 'btn btn-primary btn-sm'
    }
  }

  const styles = typeStyles[type]

  const getIcon = () => {
    switch (type) {
      case 'error':
        return (
          <svg style={{ width: '20px', height: '20px' }} viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
          </svg>
        )
      case 'warning':
        return (
          <svg style={{ width: '20px', height: '20px' }} viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
          </svg>
        )
      case 'info':
        return (
          <svg style={{ width: '20px', height: '20px' }} viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clipRule="evenodd" />
          </svg>
        )
    }
  }

  return (
    <div className={`${styles.containerClass} ${className}`}>
      <div style={{ display: 'flex', alignItems: 'flex-start' }}>
        <div style={{ flexShrink: 0 }}>
          {getIcon()}
        </div>
        <div style={{ marginLeft: '12px', flex: 1 }}>
          <h3 style={{ fontSize: '14px', fontWeight: 500, margin: '0 0 8px 0' }}>
            {title}
          </h3>
          <div style={{ fontSize: '14px', marginBottom: onRetry ? '16px' : '0' }}>
            <p style={{ margin: 0 }}>{message}</p>
          </div>
          {onRetry && (
            <button
              onClick={onRetry}
              className={styles.buttonClass}
            >
              Try Again
            </button>
          )}
        </div>
      </div>
    </div>
  )
}