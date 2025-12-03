import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { FolderTree, FileText } from 'lucide-react'

export const metadata = {
  title: 'カテゴリ一覧',
}

type Category = {
  id: string
  name: string
  slug: string
  description: string | null
  parent_id: string | null
  article_count?: number
}

async function getParentCategories(): Promise<Category[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .is('parent_id', null)
    .order('order')

  if (error || !data) return []

  // Get article count for each category
  const categoriesWithCount = await Promise.all(
    (data as Category[]).map(async (category) => {
      const { count } = await supabase
        .from('articles')
        .select('id', { count: 'exact', head: true })
        .eq('category_id', category.id)
        .eq('status', 'published')

      return {
        ...category,
        article_count: count || 0,
      }
    })
  )

  return categoriesWithCount
}

export default async function CategoriesPage() {
  const categories = await getParentCategories()

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-8 md:py-12">
        <div className="mb-8 md:mb-12">
          <h1 className="text-3xl md:text-4xl font-bold mb-3">カテゴリ一覧</h1>
          <p className="text-muted-foreground">興味のあるカテゴリから記事を探す</p>
        </div>

        {categories.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {categories.map((category) => (
              <Link key={category.id} href={`/categories/${category.slug}`}>
                <Card className="h-full hover:shadow-lg transition-all duration-300 hover:scale-105 cursor-pointer">
                  <CardHeader>
                    <div className="flex items-center justify-between mb-2">
                      <div className="p-3 bg-primary/10 rounded-lg">
                        <FolderTree className="h-6 w-6 text-primary" />
                      </div>
                      <Badge variant="secondary" className="flex items-center gap-1">
                        <FileText className="h-3 w-3" />
                        {category.article_count}
                      </Badge>
                    </div>
                    <CardTitle className="text-xl">{category.name}</CardTitle>
                  </CardHeader>
                  {category.description && (
                    <CardContent>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {category.description}
                      </p>
                    </CardContent>
                  )}
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 text-muted-foreground">
            <FolderTree className="h-16 w-16 mx-auto mb-4 opacity-50" />
            <p>カテゴリがありません。</p>
          </div>
        )}
      </div>
    </div>
  )
}
