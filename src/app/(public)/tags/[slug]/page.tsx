import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { ArticleCard } from '@/components/articles/article-card'
import { Badge } from '@/components/ui/badge'
import type { ArticleWithRelations, Tag } from '@/types/database'

async function getTag(slug: string): Promise<Tag | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('tags')
    .select('*')
    .eq('slug', slug)
    .single()

  if (error || !data) return null

  return data as Tag
}

async function getArticlesByTag(tagId: string): Promise<ArticleWithRelations[]> {
  const supabase = await createClient()

  // Get article IDs with this tag
  const { data: articleTags, error: tagError } = await supabase
    .from('article_tags')
    .select('article_id')
    .eq('tag_id', tagId)

  if (tagError || !articleTags || articleTags.length === 0) return []

  const articleIds = articleTags.map((at: Record<string, unknown>) => at.article_id as string)

  const { data: articles, error } = await supabase
    .from('articles')
    .select(`
      *,
      category:categories(*),
      author:users(*)
    `)
    .in('id', articleIds)
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
  const tag = await getTag(slug)

  if (!tag) {
    return {
      title: 'タグが見つかりません',
    }
  }

  return {
    title: `#${tag.name}`,
    description: `#${tag.name}タグの記事一覧`,
  }
}

export default async function TagPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const tag = await getTag(slug)

  if (!tag) {
    notFound()
  }

  const articles = await getArticlesByTag(tag.id)

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-8">
        <h1 className="text-3xl font-bold">タグ:</h1>
        <Badge variant="secondary" className="text-xl px-4 py-1">
          #{tag.name}
        </Badge>
      </div>

      {articles.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {articles.map((article) => (
            <ArticleCard key={article.id} article={article} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-muted-foreground">
          <p>このタグにはまだ記事がありません。</p>
        </div>
      )}
    </div>
  )
}
