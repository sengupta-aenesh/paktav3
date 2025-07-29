'use client'

import { useState } from 'react'
import { Button } from '@/components/ui'
import styles from './access-request-modal.module.css'

interface AccessRequestModalProps {
  resourceType: 'contract' | 'template' | 'folder' | 'template_folder'
  resourceId: string
  resourceTitle: string
  onClose: () => void
  onRequestSent: () => void
}

export default function AccessRequestModal({
  resourceType,
  resourceId,
  resourceTitle,
  onClose,
  onRequestSent
}: AccessRequestModalProps) {
  const [message, setMessage] = useState('')
  const [requestedPermission, setRequestedPermission] = useState<'view' | 'edit'>('view')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/collaboration/request-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resource_type: resourceType,
          resource_id: resourceId,
          requested_permission: requestedPermission,
          message: message.trim()
        })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to send request')
      }

      onRequestSent()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send request')
    } finally {
      setLoading(false)
    }
  }

  const getResourceTypeLabel = () => {
    switch (resourceType) {
      case 'contract':
        return 'contract'
      case 'template':
        return 'template'
      case 'folder':
        return 'folder'
      case 'template_folder':
        return 'template folder'
    }
  }

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <div className={styles.blurredBackground} />
        
        <div className={styles.requestForm}>
          <div className={styles.lockIcon}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="5" y="11" width="14" height="10" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0110 0v4"/>
            </svg>
          </div>

          <h2 className={styles.title}>Request Access</h2>
          <p className={styles.subtitle}>
            This {getResourceTypeLabel()} is private. Request access from {resourceTitle}.
          </p>

          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Permission Level</label>
              <div className={styles.radioGroup}>
                <label className={styles.radioLabel}>
                  <input
                    type="radio"
                    name="permission"
                    value="view"
                    checked={requestedPermission === 'view'}
                    onChange={(e) => setRequestedPermission(e.target.value as 'view')}
                    className={styles.radioInput}
                  />
                  <span className={styles.radioText}>
                    <strong>View Only</strong>
                    <span>Can view the {getResourceTypeLabel()} but cannot make changes</span>
                  </span>
                </label>
                <label className={styles.radioLabel}>
                  <input
                    type="radio"
                    name="permission"
                    value="edit"
                    checked={requestedPermission === 'edit'}
                    onChange={(e) => setRequestedPermission(e.target.value as 'edit')}
                    className={styles.radioInput}
                  />
                  <span className={styles.radioText}>
                    <strong>Can Edit</strong>
                    <span>Can view and make changes to the {getResourceTypeLabel()}</span>
                  </span>
                </label>
              </div>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="message" className={styles.label}>
                Message (optional)
              </label>
              <textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Add a message to explain why you need access..."
                className={styles.textarea}
                rows={4}
              />
            </div>

            {error && (
              <div className={styles.error}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="8" x2="12" y2="12"/>
                  <line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                {error}
              </div>
            )}

            <div className={styles.actions}>
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="default"
                disabled={loading}
              >
                {loading ? 'Sending...' : 'Send Request'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}