'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { toast } from 'sonner'

interface DeleteArticleButtonProps {
  articleId: string
}

export function DeleteArticleButton({ articleId }: DeleteArticleButtonProps) {
  const [open, setOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleDelete = async () => {
    setIsDeleting(true)

    try {
      // First delete related records
      const { error: likesError } = await supabase
        .from('likes')
        .delete()
        .eq('article_id', articleId)

      if (likesError) {
        console.error('Failed to delete likes:', likesError)
      }

      const { error: commentsError } = await supabase
        .from('comments')
        .delete()
        .eq('article_id', articleId)

      if (commentsError) {
        console.error('Failed to delete comments:', commentsError)
      }

      const { error: impressionsError } = await supabase
        .from('impressions')
        .delete()
        .eq('article_id', articleId)

      if (impressionsError) {
        console.error('Failed to delete impressions:', impressionsError)
      }

      const { error: tagsError } = await supabase
        .from('article_tags')
        .delete()
        .eq('article_id', articleId)

      if (tagsError) {
        console.error('Failed to delete article_tags:', tagsError)
      }

      // Finally delete the article
      const { error } = await supabase
        .from('articles')
        .delete()
        .eq('id', articleId)

      if (error) {
        console.error('Failed to delete article:', error)
        throw error
      }

      toast.success('記事を削除しました')
      setOpen(false)
      router.refresh()
    } catch (error) {
      console.error('Delete error:', error)
      toast.error('削除に失敗しました')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="text-destructive">
          <Trash2 className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>記事を削除しますか？</DialogTitle>
          <DialogDescription>
            この操作は取り消せません。記事に関連するコメントやいいねも全て削除されます。
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            キャンセル
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? '削除中...' : '削除'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
