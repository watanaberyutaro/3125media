'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Edit, Trash2, Tag } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { toast } from 'sonner'

interface TagType {
  id: string
  name: string
  slug: string
  created_at: string
}

interface TagManagerProps {
  initialTags: TagType[]
}

export function TagManager({ initialTags }: TagManagerProps) {
  const [tags, setTags] = useState(initialTags)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingTag, setEditingTag] = useState<TagType | null>(null)

  // Form state
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const router = useRouter()
  const supabase = createClient()

  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9\u3040-\u309f\u30a0-\u30ff\u4e00-\u9faf]+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
  }

  const openCreateDialog = () => {
    setEditingTag(null)
    setName('')
    setSlug('')
    setIsDialogOpen(true)
  }

  const openEditDialog = (tag: TagType) => {
    setEditingTag(tag)
    setName(tag.name)
    setSlug(tag.slug)
    setIsDialogOpen(true)
  }

  const handleSubmit = async () => {
    if (!name.trim() || !slug.trim()) {
      toast.error('名前とスラッグは必須です')
      return
    }

    setIsLoading(true)

    try {
      const tagData = {
        name: name.trim(),
        slug: slug.trim(),
      }

      if (editingTag) {
        const { error } = await supabase
          .from('tags')
          .update(tagData)
          .eq('id', editingTag.id)

        if (error) throw error
        toast.success('タグを更新しました')
      } else {
        const { error } = await supabase
          .from('tags')
          .insert(tagData)

        if (error) throw error
        toast.success('タグを作成しました')
      }

      setIsDialogOpen(false)
      router.refresh()
    } catch (error) {
      console.error(error)
      toast.error('保存に失敗しました')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (tag: TagType) => {
    if (!confirm(`「${tag.name}」を削除しますか？`)) {
      return
    }

    try {
      const { error } = await supabase
        .from('tags')
        .delete()
        .eq('id', tag.id)

      if (error) throw error

      toast.success('タグを削除しました')
      router.refresh()
    } catch (error) {
      console.error(error)
      toast.error('削除に失敗しました')
    }
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>タグ一覧</CardTitle>
          <Button onClick={openCreateDialog}>
            <Plus className="h-4 w-4 mr-2" />
            新規作成
          </Button>
        </CardHeader>
        <CardContent>
          {tags.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <div
                  key={tag.id}
                  className="flex items-center gap-1 group"
                >
                  <Badge variant="secondary" className="px-3 py-1">
                    <Tag className="h-3 w-3 mr-1" />
                    {tag.name}
                  </Badge>
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => openEditDialog(tag)}
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-destructive"
                      onClick={() => handleDelete(tag)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              タグがありません
            </p>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingTag ? 'タグを編集' : '新規タグ'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">名前</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => {
                  setName(e.target.value)
                  if (!editingTag) {
                    setSlug(generateSlug(e.target.value))
                  }
                }}
                placeholder="タグ名"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug">スラッグ</Label>
              <Input
                id="slug"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="tag-slug"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              キャンセル
            </Button>
            <Button onClick={handleSubmit} disabled={isLoading}>
              {isLoading ? '保存中...' : '保存'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
