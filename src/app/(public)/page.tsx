import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { FeaturedArticle } from '@/components/articles/featured-article'
import { ArticleCard } from '@/components/articles/article-card'
import { RankingSidebar } from '@/components/articles/ranking-sidebar'
import type { ArticleWithRelations, Category } from '@/types/database'

export const revalidate = 60 // Revalidate every 60 seconds for ISR

async function getLatestArticles(): Promise<ArticleWithRelations[]> {
  const supabase = await createClient()

  const { data: articles, error } = await supabase
    .from('articles')
    .select(`
      *,
      category:categories(*),
      author:users(*)
    `)
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(15)

  if (error || !articles) return []

  // Get likes and comments count for each article
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

async function getCategories(): Promise<Category[]> {
  const supabase = await createClient()

  const { data: categories, error } = await supabase
    .from('categories')
    .select('*')
    .is('parent_id', null)
    .order('order')
    .limit(8)

  if (error || !categories) return []

  return categories as Category[]
}

export default async function HomePage() {
  const [articles, categories] = await Promise.all([
    getLatestArticles(),
    getCategories(),
  ])

  const heroArticle = articles[0]
  const featuredArticles = articles.slice(1, 5)
  const mainArticles = articles.slice(5, 11)
  const sidebarArticles = articles.slice(0, 15)

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-6 md:py-8">
        {/* Categories Bar */}
        {categories.length > 0 && (
          <section className="mb-6 md:mb-8">
            <div className="flex items-center gap-2 overflow-x-auto pb-2 hide-scrollbar">
              <Link
                href="/categories"
                className="px-4 py-2 bg-muted rounded-full text-sm font-medium hover:bg-primary hover:text-primary-foreground transition-colors whitespace-nowrap flex-shrink-0"
              >
                すべて
              </Link>
              {categories.map((category) => (
                <Link
                  key={category.id}
                  href={`/categories/${category.slug}`}
                  className="px-4 py-2 bg-muted rounded-full text-sm font-medium hover:bg-primary hover:text-primary-foreground transition-colors whitespace-nowrap flex-shrink-0"
                >
                  {category.name}
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Hero Section */}
        {heroArticle && (
          <section className="mb-8 md:mb-12">
            <FeaturedArticle article={heroArticle} />
          </section>
        )}

        {/* Featured Articles Grid */}
        {featuredArticles.length > 0 && (
          <section className="mb-8 md:mb-12">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl md:text-2xl font-bold">注目の記事</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              {featuredArticles.map((article) => (
                <ArticleCard key={article.id} article={article} variant="featured" />
              ))}
            </div>
          </section>
        )}

        {/* Main Content with Sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
          {/* Main Article List */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl md:text-2xl font-bold">最新の記事</h2>
              <Link
                href="/articles"
                className="text-primary hover:underline flex items-center text-sm"
              >
                すべて見る
                <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </div>

            {mainArticles.length > 0 ? (
              <div className="space-y-4">
                {mainArticles.map((article) => (
                  <ArticleCard key={article.id} article={article} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <p>まだ記事がありません。</p>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <aside className="lg:col-span-1">
            {sidebarArticles.length > 0 && (
              <RankingSidebar articles={sidebarArticles} />
            )}
          </aside>
        </div>
      </div>
    </div>
  )
}
