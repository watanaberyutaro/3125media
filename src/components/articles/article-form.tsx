'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { X, ImageIcon, Sparkles, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import type { JSONContent } from '@tiptap/core'

// Dynamically import NovelEditor to avoid SSR issues
const NovelEditor = dynamic(
  () => import('@/components/editor/novel-editor').then((mod) => mod.NovelEditor),
  {
    ssr: false,
    loading: () => (
      <div className="border rounded-lg p-4 min-h-[500px] flex items-center justify-center text-muted-foreground">
        エディタを読み込み中...
      </div>
    ),
  }
)

interface CategoryOption {
  id: string
  name: string
  slug: string
}

interface TagOption {
  id: string
  name: string
  slug: string
}

interface ArticleFormProps {
  categories: CategoryOption[]
  tags: TagOption[]
  initialData?: {
    id: string
    title: string
    slug: string
    content: JSONContent
    excerpt: string | null
    thumbnail_url: string | null
    category_id: string | null
    status: string
    meta_title: string | null
    meta_description: string | null
    selectedTagIds: string[]
  }
}

export function ArticleForm({ categories, tags, initialData }: ArticleFormProps) {
  const router = useRouter()
  const supabase = createClient()
  const isEditing = !!initialData

  const [title, setTitle] = useState(initialData?.title || '')
  const [slug, setSlug] = useState(initialData?.slug || '')
  const [content, setContent] = useState<JSONContent>(initialData?.content || {})
  const [excerpt, setExcerpt] = useState(initialData?.excerpt || '')
  const [thumbnailUrl, setThumbnailUrl] = useState(initialData?.thumbnail_url || '')
  const [categoryId, setCategoryId] = useState(initialData?.category_id || '')
  const [selectedTags, setSelectedTags] = useState<string[]>(
    initialData?.selectedTagIds || []
  )
  const [metaTitle, setMetaTitle] = useState(initialData?.meta_title || '')
  const [metaDescription, setMetaDescription] = useState(
    initialData?.meta_description || ''
  )
  const [isSaving, setIsSaving] = useState(false)
  const [isUploading, setIsUploading] = useState(false)

  // AI記事生成用のstate
  const [aiPrompt, setAiPrompt] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)

  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9\u3040-\u309f\u30a0-\u30ff\u4e00-\u9faf]+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
  }

  const handleTitleChange = (value: string) => {
    setTitle(value)
    if (!isEditing && !slug) {
      setSlug(generateSlug(value))
    }
  }

  const handleThumbnailUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)

    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
      const filePath = `thumbnails/${fileName}`

      const { error } = await supabase.storage
        .from('article-images')
        .upload(filePath, file)

      if (error) throw error

      const { data: { publicUrl } } = supabase.storage
        .from('article-images')
        .getPublicUrl(filePath)

      setThumbnailUrl(publicUrl)
      toast.success('サムネイルをアップロードしました')
    } catch {
      toast.error('アップロードに失敗しました')
    } finally {
      setIsUploading(false)
    }
  }

  const handleTagToggle = (tagId: string) => {
    setSelectedTags((prev) =>
      prev.includes(tagId)
        ? prev.filter((id) => id !== tagId)
        : [...prev, tagId]
    )
  }

  const handleAIGenerate = async () => {
    if (!title.trim()) {
      toast.error('タイトルを入力してください')
      return
    }

    if (!aiPrompt.trim()) {
      toast.error('伝えたいことを入力してください')
      return
    }

    setIsGenerating(true)

    try {
      const response = await fetch('/api/ai/generate-article', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          prompt: aiPrompt,
        }),
      })

      if (!response.ok) {
        throw new Error('生成に失敗しました')
      }

      const data = await response.json()

      // 生成されたコンテンツをエディタに設定
      setContent(data.content)

      // 抜粋を設定
      if (data.excerpt) {
        setExcerpt(data.excerpt)
      }

      // SEO設定を設定
      if (data.metaTitle) {
        setMetaTitle(data.metaTitle)
      }
      if (data.metaDescription) {
        setMetaDescription(data.metaDescription)
      }

      toast.success('記事を生成しました！本文、抜粋、SEO設定が自動入力されました。')
    } catch (error) {
      console.error(error)
      toast.error('記事の生成に失敗しました')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleSave = async (status: 'draft' | 'published') => {
    if (!title.trim()) {
      toast.error('タイトルを入力してください')
      return
    }

    if (!slug.trim()) {
      toast.error('スラッグを入力してください')
      return
    }

    setIsSaving(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast.error('ログインが必要です')
        return
      }

      const articleData = {
        title,
        slug,
        content,
        excerpt: excerpt || null,
        thumbnail_url: thumbnailUrl || null,
        category_id: categoryId || null,
        status,
        published_at: status === 'published' ? new Date().toISOString() : null,
        meta_title: metaTitle || null,
        meta_description: metaDescription || null,
        author_id: user.id,
      }

      let articleId: string | undefined = initialData?.id

      if (isEditing && articleId) {
        const { error } = await supabase
          .from('articles')
          .update(articleData)
          .eq('id', articleId)

        if (error) throw error
      } else {
        const { data, error } = await supabase
          .from('articles')
          .insert(articleData)
          .select('id')
          .single()

        if (error) throw error
        articleId = data.id
      }

      // Handle tags
      if (articleId) {
        // Delete existing tags
        await supabase
          .from('article_tags')
          .delete()
          .eq('article_id', articleId)

        // Insert new tags
        if (selectedTags.length > 0) {
          const tagInserts = selectedTags.map((tagId) => ({
            article_id: articleId,
            tag_id: tagId,
          }))

          await supabase.from('article_tags').insert(tagInserts)
        }
      }

      toast.success(
        status === 'published'
          ? '記事を公開しました'
          : '下書きを保存しました'
      )
      router.push('/admin/articles')
      router.refresh()
    } catch (error) {
      console.error(error)
      toast.error('保存に失敗しました')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* 基本情報 */}
      <Card>
        <CardHeader>
          <CardTitle>基本情報</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">タイトル</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="記事のタイトル"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="slug">スラッグ</Label>
            <Input
              id="slug"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="article-slug"
            />
          </div>

          <div className="space-y-2">
            <Label>サムネイル</Label>
            <div className="flex items-center gap-4">
              {thumbnailUrl ? (
                <div className="relative w-40 h-24">
                  <img
                    src={thumbnailUrl}
                    alt="Thumbnail"
                    className="w-full h-full object-cover rounded"
                  />
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute -top-2 -right-2 h-6 w-6"
                    onClick={() => setThumbnailUrl('')}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center w-40 h-24 border-2 border-dashed rounded cursor-pointer hover:bg-muted/50">
                  <ImageIcon className="h-8 w-8 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground mt-1">
                    {isUploading ? 'アップロード中...' : '画像を選択'}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleThumbnailUpload}
                    disabled={isUploading}
                  />
                </label>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">カテゴリ</Label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger>
                <SelectValue placeholder="カテゴリを選択" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>タグ</Label>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <Badge
                  key={tag.id}
                  variant={selectedTags.includes(tag.id) ? 'default' : 'outline'}
                  className="cursor-pointer"
                  onClick={() => handleTagToggle(tag.id)}
                >
                  {tag.name}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* AI記事生成セクション */}
      <Card className="border-primary">
        <CardHeader className="bg-primary/5">
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            AI記事生成
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-6">
          <div className="space-y-2">
            <Label htmlFor="aiPrompt">伝えたいこと</Label>
            <Textarea
              id="aiPrompt"
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              placeholder="記事で伝えたいこと、キーポイントなどを入力してください...&#10;例：新しいガジェットのレビュー、使用感、おすすめポイントなど"
              rows={6}
              disabled={isGenerating}
            />
            <p className="text-sm text-muted-foreground">
              タイトルと伝えたいことを元に、本文・抜粋・SEO設定を自動生成します（約3000文字）
            </p>
          </div>
          <Button
            onClick={handleAIGenerate}
            disabled={isGenerating || !title || !aiPrompt}
            className="w-full h-12 text-base"
            size="lg"
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                記事を生成中...（30秒ほどかかります）
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-5 w-5" />
                記事を生成（本文・抜粋・SEO設定）
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* 本文 */}
      <Card>
        <CardHeader>
          <CardTitle>本文</CardTitle>
        </CardHeader>
        <CardContent>
          <NovelEditor
            initialContent={content}
            onChange={setContent}
          />
        </CardContent>
      </Card>

      {/* 抜粋 */}
      <Card>
        <CardHeader>
          <CardTitle>抜粋</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            id="excerpt"
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
            placeholder="記事の概要..."
            rows={3}
          />
        </CardContent>
      </Card>

      {/* SEO設定 */}
      <Card>
        <CardHeader>
          <CardTitle>SEO設定</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="metaTitle">メタタイトル</Label>
            <Input
              id="metaTitle"
              value={metaTitle}
              onChange={(e) => setMetaTitle(e.target.value)}
              placeholder="SEO用タイトル（空の場合は記事タイトルを使用）"
            />
            <p className="text-sm text-muted-foreground">
              {metaTitle.length}/60文字
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="metaDescription">メタディスクリプション</Label>
            <Textarea
              id="metaDescription"
              value={metaDescription}
              onChange={(e) => setMetaDescription(e.target.value)}
              placeholder="検索結果に表示される説明文"
              rows={3}
            />
            <p className="text-sm text-muted-foreground">
              {metaDescription.length}/160文字
            </p>
          </div>
        </CardContent>
      </Card>

      {/* 保存ボタン */}
      <div className="flex justify-end gap-4">
        <Button
          variant="outline"
          onClick={() => handleSave('draft')}
          disabled={isSaving}
        >
          下書き保存
        </Button>
        <Button onClick={() => handleSave('published')} disabled={isSaving}>
          {isSaving ? '保存中...' : '公開'}
        </Button>
      </div>
    </div>
  )
}
