import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, Calendar } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { ja } from 'date-fns/locale'
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
    .limit(20)

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

async function getRankingArticles(period: 'daily' | 'weekly' | 'monthly'): Promise<ArticleWithRelations[]> {
  const supabase = await createClient()

  // Calculate date range
  const now = new Date()
  let startDate: Date

  switch (period) {
    case 'daily':
      startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000) // Last 24 hours
      break
    case 'weekly':
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      break
    case 'monthly':
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
      break
  }

  // Try to get articles by views first
  let { data: articles, error } = await supabase
    .from('articles')
    .select(`
      *,
      category:categories(*),
      author:users(*)
    `)
    .eq('status', 'published')
    .gte('created_at', startDate.toISOString())
    .order('views', { ascending: false, nullsFirst: false })
    .limit(10)

  // If no articles found with date filter, get the latest articles instead
  if (!articles || articles.length === 0) {
    const fallback = await supabase
      .from('articles')
      .select(`
        *,
        category:categories(*),
        author:users(*)
      `)
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .limit(10)

    articles = fallback.data || []
  }

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

async function getRandomFeaturedArticles(limit: number = 4): Promise<ArticleWithRelations[]> {
  const supabase = await createClient()

  // Get total count first
  const { count } = await supabase
    .from('articles')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'published')

  if (!count || count === 0) return []

  // Get random articles by ordering randomly
  const { data: articles, error } = await supabase
    .from('articles')
    .select(`
      *,
      category:categories(*),
      author:users(*)
    `)
    .eq('status', 'published')
    .limit(limit)

  if (error || !articles) return []

  // Shuffle the results
  const shuffled = [...articles].sort(() => Math.random() - 0.5)

  // Get likes and comments count for each article
  const articlesWithCounts = await Promise.all(
    shuffled.map(async (article: Record<string, unknown>) => {
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

  if (error || !categories) return []

  // Filter out categories with Japanese slugs (only keep English slugs)
  const validCategories = (categories as Category[]).filter((cat) => {
    // Check if slug contains only ASCII characters (English)
    return /^[a-z0-9-]+$/.test(cat.slug)
  })

  return validCategories.slice(0, 8)
}

async function getArticlesByCategory(categorySlug: string, limit: number = 4): Promise<ArticleWithRelations[]> {
  const supabase = await createClient()

  // Get category
  const { data: category } = await supabase
    .from('categories')
    .select('id')
    .eq('slug', categorySlug)
    .single()

  if (!category) return []

  const { data: articles, error } = await supabase
    .from('articles')
    .select(`
      *,
      category:categories(*),
      author:users(*)
    `)
    .eq('category_id', category.id)
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(limit)

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

export default async function HomePage() {
  const [
    articles,
    featuredArticles,
    popularArticles,
    dailyRanking,
    weeklyRanking,
    monthlyRanking,
    categories,
    gadgetArticles,
    techArticles,
    lifestyleArticles,
    creativeArticles,
  ] = await Promise.all([
    getLatestArticles(),
    getRandomFeaturedArticles(4),
    getRandomFeaturedArticles(6),
    getRankingArticles('daily'),
    getRankingArticles('weekly'),
    getRankingArticles('monthly'),
    getCategories(),
    getArticlesByCategory('gadget', 4),
    getArticlesByCategory('technology', 4),
    getArticlesByCategory('lifestyle', 4),
    getArticlesByCategory('creative', 4),
  ])

  const heroArticle = articles[0]
  const mainArticles = articles.slice(1, 10)
  const moreArticles = articles.slice(10, 20)

  const rankingData = {
    daily: dailyRanking,
    weekly: weeklyRanking,
    monthly: monthlyRanking,
  }

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-6 md:py-8">
        {/* Categories Bar */}
        {categories.length > 0 && (
          <section className="mb-6 md:mb-8">
            <div className="flex items-center gap-2 overflow-x-auto pb-2 hide-scrollbar">
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

        {/* Hero Section with Ranking */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8 mb-8 md:mb-12">
          {/* Hero Article */}
          {heroArticle && (
            <section className="lg:col-span-2">
              <FeaturedArticle article={heroArticle} />
            </section>
          )}

          {/* Ranking Sidebar (Desktop) */}
          <aside className="lg:col-span-1 hidden lg:block">
            <RankingSidebar rankingData={rankingData} />
          </aside>
        </div>

        {/* Ranking Sidebar (Mobile Only) - Right after Hero */}
        <aside className="lg:hidden mb-8 md:mb-12">
          <RankingSidebar rankingData={rankingData} />
        </aside>

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

        {/* Popular Articles Section - Reversed Hero Layout */}
        {popularArticles.length > 0 && (
          <section className="mb-8 md:mb-12">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl md:text-2xl font-bold">人気の記事</h2>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
              {/* Ranking List (Left Side) */}
              <aside className="lg:col-span-1 space-y-3">
                {popularArticles.slice(1, 6).map((article, index) => (
                  <Link
                    key={article.id}
                    href={`/articles/${article.slug}`}
                    className="flex gap-3 p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors group"
                  >
                    <div className="relative flex-shrink-0 w-10 h-10">
                      <div className="absolute inset-0 flex items-center justify-center bg-primary/10 rounded-lg text-lg font-bold text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors z-10">
                        {index + 2}
                      </div>
                    </div>
                    {article.thumbnail_url && (
                      <div className="relative w-20 h-16 flex-shrink-0 rounded overflow-hidden bg-muted">
                        <Image
                          src={article.thumbnail_url}
                          alt={article.title}
                          fill
                          className="object-cover"
                        />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm mb-1 line-clamp-2 group-hover:text-primary transition-colors">
                        {article.title}
                      </h3>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{article.views?.toLocaleString() || 0} views</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </aside>

              {/* #1 Featured Article (Right Side) */}
              {popularArticles[0] && (
                <div className="lg:col-span-2">
                  <Link
                    href={`/articles/${popularArticles[0].slug}`}
                    className="block group relative"
                  >
                    <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-muted">
                      {/* Ranking Badge */}
                      <div className="absolute top-4 left-4 z-10 w-16 h-16 flex items-center justify-center bg-primary rounded-lg text-3xl font-bold text-primary-foreground shadow-lg">
                        1
                      </div>

                      {/* Image */}
                      {popularArticles[0].thumbnail_url ? (
                        <Image
                          src={popularArticles[0].thumbnail_url}
                          alt={popularArticles[0].title}
                          fill
                          className="object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                          No Image
                        </div>
                      )}

                      {/* Gradient Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

                      {/* Content */}
                      <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8 text-white">
                        {popularArticles[0].category && (
                          <span className="inline-block px-3 py-1 text-xs font-bold bg-primary rounded mb-3">
                            {popularArticles[0].category.name}
                          </span>
                        )}

                        <h2 className="text-white/80 text-2xl md:text-4xl lg:text-5xl font-bold mb-3 leading-tight group-hover:text-white transition-colors">
                          {popularArticles[0].title}
                        </h2>

                        {popularArticles[0].excerpt && (
                          <p className="text-sm md:text-base text-white/90 mb-3 line-clamp-2 max-w-3xl">
                            {popularArticles[0].excerpt}
                          </p>
                        )}

                        <div className="flex items-center gap-4 text-xs md:text-sm text-white/80">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3 md:h-4 md:w-4" />
                            {formatDistanceToNow(new Date(popularArticles[0].published_at || popularArticles[0].created_at), {
                              addSuffix: true,
                              locale: ja,
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8 mb-8 md:mb-12">
          {/* Main Article List */}
          <div className="lg:col-span-3">
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
        </div>

        {/* Gadget Section */}
        {gadgetArticles.length > 0 && (
          <section className="mb-8 md:mb-12">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl md:text-2xl font-bold">ガジェット</h2>
              <Link
                href="/categories/gadget"
                className="text-primary hover:underline flex items-center text-sm"
              >
                もっと見る
                <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              {gadgetArticles.map((article) => (
                <ArticleCard key={article.id} article={article} />
              ))}
            </div>
          </section>
        )}

        {/* Technology Section - 2 Column Large Cards */}
        {techArticles.length > 0 && (
          <section className="mb-8 md:mb-12">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl md:text-2xl font-bold">テクノロジー</h2>
              <Link
                href="/categories/technology"
                className="text-primary hover:underline flex items-center text-sm"
              >
                もっと見る
                <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {techArticles.map((article) => (
                <ArticleCard key={article.id} article={article} />
              ))}
            </div>
          </section>
        )}

        {/* Lifestyle Section - Horizontal Cards */}
        {lifestyleArticles.length > 0 && (
          <section className="mb-8 md:mb-12">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl md:text-2xl font-bold">ライフスタイル</h2>
              <Link
                href="/categories/lifestyle"
                className="text-primary hover:underline flex items-center text-sm"
              >
                もっと見る
                <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </div>
            <div className="space-y-4">
              {lifestyleArticles.map((article) => (
                <Link
                  key={article.id}
                  href={`/articles/${article.slug}`}
                  className="flex flex-col sm:flex-row gap-4 p-4 bg-muted/30 rounded-lg hover:bg-muted/50 transition-all group"
                >
                  {article.thumbnail_url && (
                    <div className="w-full sm:w-48 h-32 flex-shrink-0 rounded-lg overflow-hidden bg-muted">
                      <img
                        src={article.thumbnail_url}
                        alt={article.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-primary mb-2">{article.category?.name}</div>
                    <h3 className="font-semibold text-lg mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                      {article.title}
                    </h3>
                    {article.excerpt && (
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                        {article.excerpt}
                      </p>
                    )}
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>{new Date(article.published_at || '').toLocaleDateString('ja-JP')}</span>
                      <span>{article.views?.toLocaleString() || 0} views</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Creative Section - 3 Column Grid */}
        {creativeArticles.length > 0 && (
          <section className="mb-8 md:mb-12">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl md:text-2xl font-bold">クリエイティブ</h2>
              <Link
                href="/categories/creative"
                className="text-primary hover:underline flex items-center text-sm"
              >
                もっと見る
                <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {creativeArticles.slice(0, 3).map((article) => (
                <ArticleCard key={article.id} article={article} />
              ))}
            </div>
          </section>
        )}

        {/* More Articles */}
        {moreArticles.length > 0 && (
          <section className="mb-8 md:mb-12">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl md:text-2xl font-bold">もっと読む</h2>
              <Link
                href="/articles"
                className="text-primary hover:underline flex items-center text-sm"
              >
                すべて見る
                <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {moreArticles.map((article) => (
                <ArticleCard key={article.id} article={article} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
