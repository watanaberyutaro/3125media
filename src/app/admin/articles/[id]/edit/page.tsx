import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ArticleForm } from '@/components/articles/article-form'

type CategoryOption = {
  id: string
  name: string
  slug: string
}

type TagOption = {
  id: string
  name: string
  slug: string
}

type ArticleData = {
  id: string
  title: string
  slug: string
  content: Record<string, unknown>
  excerpt: string | null
  thumbnail_url: string | null
  category_id: string | null
  status: string
  meta_title: string | null
  meta_description: string | null
}

async function getArticle(id: string) {
  const supabase = await createClient()

  const { data: article, error } = await supabase
    .from('articles')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !article) return null

  const articleData = article as ArticleData

  // Get selected tags
  const { data: articleTags } = await supabase
    .from('article_tags')
    .select('tag_id')
    .eq('article_id', id)

  const selectedTagIds = (articleTags as Array<{ tag_id: string }> | null)?.map((at) => at.tag_id) || []

  return {
    ...articleData,
    selectedTagIds,
  }
}

async function getCategories(): Promise<CategoryOption[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('categories')
    .select('id, name, slug')
    .order('order')

  if (error || !data) return []
  return data as CategoryOption[]
}

async function getTags(): Promise<TagOption[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('tags')
    .select('id, name, slug')
    .order('name')

  if (error || !data) return []
  return data as TagOption[]
}

export default async function EditArticlePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [article, categories, tags] = await Promise.all([
    getArticle(id),
    getCategories(),
    getTags(),
  ])

  if (!article) {
    notFound()
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">記事編集</h1>
      <ArticleForm
        categories={categories}
        tags={tags}
        initialData={{
          id: article.id,
          title: article.title,
          slug: article.slug,
          content: article.content,
          excerpt: article.excerpt,
          thumbnail_url: article.thumbnail_url,
          category_id: article.category_id,
          status: article.status,
          meta_title: article.meta_title,
          meta_description: article.meta_description,
          selectedTagIds: article.selectedTagIds,
        }}
      />
    </div>
  )
}
