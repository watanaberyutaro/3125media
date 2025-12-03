import { createClient } from '@/lib/supabase/server'
import { ArticleCard } from '@/components/articles/article-card'
import type { ArticleWithRelations } from '@/types/database'

export const metadata = {
  title: '記事一覧',
}

export const revalidate = 60

async function getArticles(): Promise<ArticleWithRelations[]> {
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

export default async function ArticlesPage() {
  const articles = await getArticles()

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">記事一覧</h1>

      {articles.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {articles.map((article) => (
            <ArticleCard key={article.id} article={article} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-muted-foreground">
          <p>まだ記事がありません。</p>
        </div>
      )}
    </div>
  )
}
