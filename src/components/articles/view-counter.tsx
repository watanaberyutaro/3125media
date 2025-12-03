'use client'

import { useEffect, useState } from 'react'
import { Eye } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface ViewCounterProps {
  articleId: string
  initialViews: number
}

export function ViewCounter({ articleId, initialViews }: ViewCounterProps) {
  const [views, setViews] = useState(initialViews)
  const [hasIncremented, setHasIncremented] = useState(false)

  useEffect(() => {
    if (hasIncremented) return

    const incrementView = async () => {
      const supabase = createClient()

      // Check if already viewed in this session
      const viewedKey = `viewed_${articleId}`
      const alreadyViewed = sessionStorage.getItem(viewedKey)

      if (alreadyViewed) {
        return
      }

      // Increment view count
      const { error } = await supabase.rpc('increment_article_views', {
        article_id: articleId,
      })

      if (!error) {
        setViews((prev) => prev + 1)
        sessionStorage.setItem(viewedKey, 'true')
        setHasIncremented(true)
      } else {
        console.error('Failed to increment views:', error)
      }
    }

    // Delay to avoid counting bots/quick bounces
    const timer = setTimeout(incrementView, 2000)

    return () => clearTimeout(timer)
  }, [articleId, hasIncremented])

  return (
    <div className="flex items-center gap-1 text-muted-foreground">
      <Eye className="h-4 w-4" />
      <span>{views.toLocaleString()}</span>
    </div>
  )
}
