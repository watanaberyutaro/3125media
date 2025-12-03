'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Trash2, ExternalLink } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { toast } from 'sonner'
import { formatDistanceToNow } from 'date-fns'
import { ja } from 'date-fns/locale'

interface Comment {
  id: string
  content: string
  created_at: string
  article: {
    id: string
    title: string
    slug: string
  }
  user: {
    id: string
    name: string
    email: string
  }
}

interface CommentModerationProps {
  initialComments: Comment[]
}

export function CommentModeration({ initialComments }: CommentModerationProps) {
  const [comments, setComments] = useState(initialComments)
  const router = useRouter()
  const supabase = createClient()

  const handleDelete = async (commentId: string) => {
    if (!confirm('このコメントを削除しますか？')) return

    try {
      const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', commentId)

      if (error) throw error

      setComments((prev) => prev.filter((c) => c.id !== commentId))
      toast.success('コメントを削除しました')
    } catch (error) {
      console.error(error)
      toast.error('削除に失敗しました')
    }
  }

  if (comments.length === 0) {
    return (
      <p className="text-center text-muted-foreground py-8">
        コメントがありません
      </p>
    )
  }

  return (
    <div className="divide-y">
      {comments.map((comment) => (
        <div key={comment.id} className="py-4">
          <div className="flex items-start gap-3">
            <Avatar className="h-8 w-8">
              <AvatarFallback>
                {comment.user.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium text-sm">{comment.user.name}</span>
                <span className="text-xs text-muted-foreground">
                  {comment.user.email}
                </span>
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(comment.created_at), {
                    addSuffix: true,
                    locale: ja,
                  })}
                </span>
              </div>
              <p className="text-sm mb-2 whitespace-pre-wrap">{comment.content}</p>
              <div className="flex items-center gap-2">
                <Link
                  href={`/articles/${comment.article.slug}`}
                  target="_blank"
                  className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1"
                >
                  {comment.article.title}
                  <ExternalLink className="h-3 w-3" />
                </Link>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="text-destructive"
              onClick={() => handleDelete(comment.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  )
}
