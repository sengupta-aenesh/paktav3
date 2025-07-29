'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth-client'
import { TopNavigation } from '@/components/ui'
import AccessRequestsManager from '@/components/collaboration/access-requests-manager'
import styles from './requests.module.css'

export default function AccessRequestsPage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    loadUser()
  }, [])

  async function loadUser() {
    try {
      const currentUser = await getCurrentUser()
      if (!currentUser) {
        router.push('/auth/login')
        return
      }
      setUser(currentUser)
    } catch (error) {
      console.error('Error loading user:', error)
      router.push('/auth/login')
    } finally {
      setLoading(false)
    }
  }

  async function handleSignOut() {
    const { signOut } = await import('@/lib/auth-client')
    await signOut()
    router.push('/auth/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner-lg"></div>
      </div>
    )
  }

  return (
    <div className={styles.requestsContainer}>
      <TopNavigation 
        currentPage="collaboration"
        user={user}
        onSignOut={handleSignOut}
      />

      <div className={styles.mainContent}>
        <div className={styles.header}>
          <button
            className={styles.backButton}
            onClick={() => router.push('/collaboration')}
            title="Back to collaboration"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
            <span>Back to Collaboration</span>
          </button>
        </div>

        <div className={styles.contentWrapper}>
          <AccessRequestsManager 
            userId={user.id}
            onRequestHandled={() => {
              // Optionally refresh or show notification
            }}
          />
        </div>
      </div>
    </div>
  )
}