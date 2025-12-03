'use client'

import { useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

interface ImpressionTrackerProps {
  articleId: string
}

function getSessionId(): string {
  const key = '3125media_session_id'
  let sessionId = sessionStorage.getItem(key)

  if (!sessionId) {
    sessionId = `${Date.now()}-${Math.random().toString(36).substring(7)}`
    sessionStorage.setItem(key, sessionId)
  }

  return sessionId
}

export function ImpressionTracker({ articleId }: ImpressionTrackerProps) {
  const startTime = useRef<number>(Date.now())
  const impressionId = useRef<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    const recordImpression = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        const sessionId = getSessionId()
        const referrer = document.referrer || null

        const { data, error } = await supabase
          .from('impressions')
          .insert({
            article_id: articleId,
            user_id: user?.id || null,
            session_id: sessionId,
            referrer,
            duration: 0,
          })
          .select('id')
          .single()

        if (error) throw error
        impressionId.current = data.id
      } catch (error) {
        console.error('Failed to record impression:', error)
      }
    }

    recordImpression()

    // Update duration on page leave
    const updateDuration = async () => {
      if (!impressionId.current) return

      const duration = Math.floor((Date.now() - startTime.current) / 1000)

      try {
        await supabase
          .from('impressions')
          .update({ duration })
          .eq('id', impressionId.current)
      } catch (error) {
        console.error('Failed to update duration:', error)
      }
    }

    // Update on visibility change
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        updateDuration()
      }
    }

    // Update before unload
    const handleBeforeUnload = () => {
      updateDuration()
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => {
      updateDuration()
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [articleId, supabase])

  return null
}
