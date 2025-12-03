'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { toast } from 'sonner'
import { formatDistanceToNow } from 'date-fns'
import { ja } from 'date-fns/locale'
import { MessageCircle, Reply, Trash2 } from 'lucide-react'

interface Comment {
  id: string
  content: string
  created_at: string
  user_id: string
  parent_id: string | null
  user: {
    id: string
    name: string
    avatar_url: string | null
  }
  replies?: Comment[]
}

interface CommentSectionProps {
  articleId: string
}

export function CommentSection({ articleId }: CommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>([])
  const [content, setContent] = useState('')
  const [replyTo, setReplyTo] = useState<string | null>(null)
  const [replyContent, setReplyContent] = useState('')
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
    fetchComments()
  }, [supabase, articleId])

  const fetchComments = async () => {
    const { data, error } = await supabase
      .from('comments')
      .select(`
        id,
        content,
        created_at,
        user_id,
        parent_id,
        user:users(id, name, avatar_url)
      `)
      .eq('article_id', articleId)
      .order('created_at', { ascending: true })

    if (error) {
      console.error(error)
      return
    }

    // Organize comments into tree structure
    const commentMap = new Map<string, Comment>()
    const rootComments: Comment[] = []

    ;(data as unknown as Comment[]).forEach((comment) => {
      comment.replies = []
      commentMap.set(comment.id, comment)
    })

    ;(data as unknown as Comment[]).forEach((comment) => {
      if (comment.parent_id) {
        const parent = commentMap.get(comment.parent_id)
        if (parent) {
          parent.replies?.push(comment)
        }
      } else {
        rootComments.push(comment)
      }
    })

    setComments(rootComments)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!userId) {
      toast.error('コメントするにはログインが必要です')
      router.push('/login')
      return
    }

    if (!content.trim()) return

    setIsLoading(true)

    try {
      const { error } = await supabase.from('comments').insert({
        article_id: articleId,
        user_id: userId,
        content: content.trim(),
      })

      if (error) throw error

      setContent('')
      fetchComments()
      toast.success('コメントを投稿しました')
    } catch (error) {
      console.error(error)
      toast.error('コメントの投稿に失敗しました')
    } finally {
      setIsLoading(false)
    }
  }

  const handleReply = async (parentId: string) => {
    if (!userId) {
      toast.error('返信するにはログインが必要です')
      router.push('/login')
      return
    }

    if (!replyContent.trim()) return

    setIsLoading(true)

    try {
      const { error } = await supabase.from('comments').insert({
        article_id: articleId,
        user_id: userId,
        parent_id: parentId,
        content: replyContent.trim(),
      })

      if (error) throw error

      setReplyTo(null)
      setReplyContent('')
      fetchComments()
      toast.success('返信を投稿しました')
    } catch (error) {
      console.error(error)
      toast.error('返信の投稿に失敗しました')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (commentId: string) => {
    if (!confirm('このコメントを削除しますか？')) return

    try {
      const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', commentId)

      if (error) throw error

      fetchComments()
      toast.success('コメントを削除しました')
    } catch (error) {
      console.error(error)
      toast.error('削除に失敗しました')
    }
  }

  const CommentItem = ({ comment, isReply = false }: { comment: Comment; isReply?: boolean }) => (
    <div className={`${isReply ? 'ml-8 mt-4' : ''}`}>
      <div className="flex gap-3">
        <Avatar className="h-8 w-8">
          <AvatarImage src={comment.user.avatar_url || undefined} />
          <AvatarFallback>
            {comment.user.name.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-sm">{comment.user.name}</span>
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(comment.created_at), {
                addSuffix: true,
                locale: ja,
              })}
            </span>
          </div>
          <p className="text-sm whitespace-pre-wrap">{comment.content}</p>
          <div className="flex items-center gap-2 mt-2">
            {!isReply && (
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground"
                onClick={() => setReplyTo(replyTo === comment.id ? null : comment.id)}
              >
                <Reply className="h-4 w-4 mr-1" />
                返信
              </Button>
            )}
            {userId === comment.user_id && (
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive"
                onClick={() => handleDelete(comment.id)}
              >
                <Trash2 className="h-4 w-4 mr-1" />
                削除
              </Button>
            )}
          </div>

          {/* Reply Form */}
          {replyTo === comment.id && (
            <div className="mt-3">
              <Textarea
                placeholder="返信を入力..."
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                rows={2}
                className="mb-2"
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => handleReply(comment.id)}
                  disabled={isLoading}
                >
                  返信
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setReplyTo(null)
                    setReplyContent('')
                  }}
                >
                  キャンセル
                </Button>
              </div>
            </div>
          )}

          {/* Replies */}
          {comment.replies && comment.replies.length > 0 && (
            <div className="border-l-2 border-muted pl-4 mt-4 space-y-4">
              {comment.replies.map((reply) => (
                <CommentItem key={reply.id} comment={reply} isReply />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )

  return (
    <section>
      <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
        <MessageCircle className="h-5 w-5" />
        コメント
      </h2>

      {/* Comment Form */}
      <form onSubmit={handleSubmit} className="mb-8">
        <Textarea
          placeholder={userId ? 'コメントを入力...' : 'コメントするにはログインが必要です'}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={3}
          className="mb-2"
          disabled={!userId}
        />
        <div className="flex justify-end">
          <Button type="submit" disabled={isLoading || !content.trim() || !userId}>
            {isLoading ? '投稿中...' : 'コメントする'}
          </Button>
        </div>
      </form>

      {/* Comments List */}
      <div className="space-y-6">
        {comments.length > 0 ? (
          comments.map((comment) => (
            <CommentItem key={comment.id} comment={comment} />
          ))
        ) : (
          <p className="text-center text-muted-foreground py-8">
            まだコメントはありません
          </p>
        )}
      </div>
    </section>
  )
}
