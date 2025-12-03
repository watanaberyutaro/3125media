import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent } from '@/components/ui/card'
import { FolderTree, ChevronRight } from 'lucide-react'

export const metadata = {
  title: 'カテゴリ一覧',
}

type Category = {
  id: string
  name: string
  slug: string
  description: string | null
  parent_id: string | null
  children?: Category[]
}

async function getCategories(): Promise<Category[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('order')

  if (error || !data) return []

  // Build tree structure
  const categoryMap = new Map<string, Category>()
  const rootCategories: Category[] = []

  ;(data as Category[]).forEach((category) => {
    category.children = []
    categoryMap.set(category.id, category)
  })

  ;(data as Category[]).forEach((category) => {
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

function CategoryCard({ category, level = 0 }: { category: Category; level?: number }) {
  return (
    <>
      <Link href={`/categories/${category.slug}`}>
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              {level > 0 && (
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              )}
              <FolderTree className="h-5 w-5 text-primary" />
              <div>
                <h3 className="font-semibold">{category.name}</h3>
                {category.description && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {category.description}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </Link>
      {category.children && category.children.length > 0 && (
        <div className="ml-6 space-y-3">
          {category.children.map((child) => (
            <CategoryCard key={child.id} category={child} level={level + 1} />
          ))}
        </div>
      )}
    </>
  )
}

export default async function CategoriesPage() {
  const categories = await getCategories()

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">カテゴリ一覧</h1>

      {categories.length > 0 ? (
        <div className="space-y-4">
          {categories.map((category) => (
            <CategoryCard key={category.id} category={category} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-muted-foreground">
          <p>カテゴリがありません。</p>
        </div>
      )}
    </div>
  )
}
