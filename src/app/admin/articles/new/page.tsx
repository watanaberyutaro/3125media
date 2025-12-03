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

export default async function NewArticlePage() {
  const [categories, tags] = await Promise.all([
    getCategories(),
    getTags(),
  ])

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">新規記事作成</h1>
      <ArticleForm categories={categories} tags={tags} />
    </div>
  )
}
