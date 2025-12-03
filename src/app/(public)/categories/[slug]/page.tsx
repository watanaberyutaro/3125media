import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { ArticleCard } from '@/components/articles/article-card'
import type { ArticleWithRelations, Category } from '@/types/database'

async function getCategory(slug: string): Promise<Category | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('slug', slug)
    .single()

  if (error || !data) return null

  return data as Category
}

async function getAllParentCategories(): Promise<Category[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .is('parent_id', null)
    .order('order')

  if (error || !data) return []

  return data as Category[]
}

async function getArticlesByCategory(categoryId: string): Promise<ArticleWithRelations[]> {
  const supabase = await createClient()

  const { data: articles, error } = await supabase
    .from('articles')
    .select(`
      *,
      category:categories(*),
      author:users(*)
    `)
    .eq('category_id', categoryId)
    .eq('status', 'published')
    .order('published_at', { ascending: false })

  if (error || !articles) return []

  const articlesWithCounts = await Promise.all(
    articles.map(async (article: Record<string, unknown>) => {
      const articleId = article.id as string
      const [likesResult, commentsResult] = await Promise.all([
        supabase
          .from('likes')
          .select('id', { count: 'exact', head: true })
          .eq('article_id', articleId),
        supabase
          .from('comments')
          .select('id', { count: 'exact', head: true })
          .eq('article_id', articleId),
      ])

      return {
        ...article,
        tags: [],
        _count: {
          likes: likesResult.count || 0,
          comments: commentsResult.count || 0,
        },
      } as unknown as ArticleWithRelations
    })
  )

  return articlesWithCounts
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const category = await getCategory(slug)

  if (!category) {
    return {
      title: 'カテゴリが見つかりません',
    }
  }

  return {
    title: category.name,
    description: category.description || `${category.name}の記事一覧`,
  }
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const [category, allCategories] = await Promise.all([
    getCategory(slug),
    getAllParentCategories(),
  ])

  if (!category) {
    notFound()
  }

  const articles = await getArticlesByCategory(category.id)

  return (
    <div className="min-h-screen">
      {/* Category Navigation Bar */}
      <section className="border-b bg-muted/30">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-2 overflow-x-auto pb-2 hide-scrollbar">
            <Link
              href="/categories"
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap flex-shrink-0 transition-colors ${
                !slug
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-background hover:bg-primary hover:text-primary-foreground'
              }`}
            >
              すべて
            </Link>
            {allCategories.map((cat) => (
              <Link
                key={cat.id}
                href={`/categories/${cat.slug}`}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap flex-shrink-0 transition-colors ${
                  category.id === cat.id
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-background hover:bg-primary hover:text-primary-foreground'
                }`}
              >
                {cat.name}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Category Content */}
      <div className="container mx-auto px-4 py-8 md:py-12">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-3">{category.name}</h1>
          {category.description && (
            <p className="text-muted-foreground text-lg">{category.description}</p>
          )}
        </div>

        {articles.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {articles.map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 text-muted-foreground">
            <p className="text-lg">このカテゴリにはまだ記事がありません。</p>
          </div>
        )}
      </div>
    </div>
  )
}
