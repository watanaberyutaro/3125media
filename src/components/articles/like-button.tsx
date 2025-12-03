'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Heart } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface LikeButtonProps {
  articleId: string
  initialCount: number
  initialLiked: boolean
}

export function LikeButton({
  articleId,
  initialCount,
  initialLiked,
}: LikeButtonProps) {
  const [liked, setLiked] = useState(initialLiked)
  const [count, setCount] = useState(initialCount)
  const [isLoading, setIsLoading] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUserId(user?.id || null)
    }
    getUser()
  }, [supabase])

  const handleLike = async () => {
    if (!userId) {
      toast.error('いいねするにはログインが必要です')
      router.push('/login')
      return
    }

    setIsLoading(true)

    try {
      if (liked) {
        // Unlike
        const { error } = await supabase
          .from('likes')
          .delete()
          .eq('article_id', articleId)
          .eq('user_id', userId)

        if (error) throw error

        setLiked(false)
        setCount((prev) => prev - 1)
      } else {
        // Like
        const { error } = await supabase.from('likes').insert({
          article_id: articleId,
          user_id: userId,
        })

        if (error) throw error

        setLiked(true)
        setCount((prev) => prev + 1)
      }
    } catch (error) {
      console.error(error)
      toast.error('エラーが発生しました')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button
      variant="ghost"
      size="lg"
      className="flex flex-col items-center gap-1 h-auto py-4"
      onClick={handleLike}
      disabled={isLoading}
    >
      <Heart
        className={cn(
          'h-8 w-8 transition-colors',
          liked ? 'fill-red-500 text-red-500' : 'text-muted-foreground'
        )}
      />
      <span className="text-sm font-medium">{count}</span>
    </Button>
  )
}
