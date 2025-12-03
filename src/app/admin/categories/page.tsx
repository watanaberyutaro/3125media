import { createClient } from '@/lib/supabase/server'
import { CategoryManager } from '@/components/categories/category-manager'

type CategoryWithChildren = {
  id: string
  name: string
  slug: string
  description: string | null
  parent_id: string | null
  order: number
  children?: CategoryWithChildren[]
}

async function getCategories(): Promise<CategoryWithChildren[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('order')

  if (error || !data) return []

  // Build tree structure
  const categoryMap = new Map<string, CategoryWithChildren>()
  const rootCategories: CategoryWithChildren[] = []

  ;(data as CategoryWithChildren[]).forEach((category) => {
    category.children = []
    categoryMap.set(category.id, category)
  })

  ;(data as CategoryWithChildren[]).forEach((category) => {
    if (category.parent_id) {
      const parent = categoryMap.get(category.parent_id)
      if (parent) {
        parent.children?.push(category)
      }
    } else {
      rootCategories.push(category)
    }
  })

  return rootCategories
}

export default async function CategoriesPage() {
  const categories = await getCategories()

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">カテゴリ管理</h1>
      <CategoryManager initialCategories={categories} />
    </div>
  )
}
