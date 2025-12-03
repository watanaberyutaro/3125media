import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { ArticleContent } from '@/components/articles/article-content'
import { LikeButton } from '@/components/articles/like-button'
import { CommentSection } from '@/components/comments/comment-section'
import { ImpressionTracker } from '@/components/analytics/impression-tracker'
import { ViewCounter } from '@/components/articles/view-counter'
import type { Article, Category, User, Tag } from '@/types/database'

type ArticleDetail = Article & {
  category: Category | null
  author: User
  tags: Tag[]
}

async function getArticle(slug: string): Promise<ArticleDetail | null> {
  const supabase = await createClient()

  // Decode URL-encoded slug
  const decodedSlug = decodeURIComponent(slug)
  console.log('[getArticle] Fetching article with slug:', decodedSlug)

  const { data: article, error } = await supabase
    .from('articles')
    .select(`
      *,
      category:categories(*),
      author:users(*)
    `)
    .eq('slug', decodedSlug)
    .eq('status', 'published')
    .single()

  if (error) {
    console.error('[getArticle] Error fetching article:', error)
    return null
  }

  if (!article) {
    console.log('[getArticle] No article found with slug:', slug)
    return null
  }

  console.log('[getArticle] Article found:', article.id, article.title)

  const articleData = article as Record<string, unknown>
  const articleId = articleData.id as string

  // Get tags
  const { data: articleTags } = await supabase
    .from('article_tags')
    .select('tag:tags(*)')
    .eq('article_id', articleId)

  const tags = articleTags?.map((at: Record<string, unknown>) => at.tag).filter(Boolean) || []

  return {
    ...articleData,
    tags,
  } as unknown as ArticleDetail
}

async function getLikeCount(articleId: string): Promise<number> {
  const supabase = await createClient()
  const { count } = await supabase
    .from('likes')
    .select('id', { count: 'exact', head: true })
    .eq('article_id', articleId)

  return count || 0
}

async function getUserLiked(articleId: string): Promise<boolean> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return false

  const { data } = await supabase
    .from('likes')
    .select('id')
    .eq('article_id', articleId)
    .eq('user_id', user.id)
    .single()

  return !!data
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const article = await getArticle(slug)

  if (!article) {
    return {
      title: '記事が見つかりません',
    }
  }

  return {
    title: article.meta_title || article.title,
    description: article.meta_description || article.excerpt,
    openGraph: {
      title: article.meta_title || article.title,
      description: article.meta_description || article.excerpt || '',
      images: article.thumbnail_url ? [article.thumbnail_url] : [],
    },
  }
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const article = await getArticle(slug)

  if (!article) {
    notFound()
  }

  const [likeCount, userLiked] = await Promise.all([
    getLikeCount(article.id),
    getUserLiked(article.id),
  ])

  return (
    <>
      <ImpressionTracker articleId={article.id} />
      <article className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <header className="mb-8">
          {article.category && (
            <Link href={`/categories/${article.category.slug}`}>
              <Badge variant="secondary" className="mb-4">
                {article.category.name}
              </Badge>
            </Link>
          )}
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            {article.title}
          </h1>
          <div className="flex items-center gap-4 text-muted-foreground flex-wrap">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                {article.author.name.charAt(0).toUpperCase()}
              </div>
              <span>{article.author.name}</span>
            </div>
            <time dateTime={article.published_at || article.created_at}>
              {new Date(article.published_at || article.created_at).toLocaleDateString('ja-JP', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </time>
            <ViewCounter articleId={article.id} initialViews={article.views} />
          </div>
        </header>

        {/* Thumbnail */}
        {article.thumbnail_url && (
          <div className="relative w-full mb-8 rounded-lg overflow-hidden">
            <Image
              src={article.thumbnail_url}
              alt={article.title}
              width={1200}
              height={800}
              className="w-full h-auto"
              priority
            />
          </div>
        )}

        {/* Content */}
        <div className="prose prose-lg dark:prose-invert max-w-none mb-8">
          <ArticleContent content={article.content} />
        </div>

        {/* Tags */}
        {article.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-8">
            {article.tags.map((tag) => (
              <Link key={tag.id} href={`/tags/${tag.slug}`}>
                <Badge variant="outline">#{tag.name}</Badge>
              </Link>
            ))}
          </div>
        )}

        {/* Like Button */}
        <div className="flex justify-center py-8 border-t border-b mb-8">
          <LikeButton
            articleId={article.id}
            initialCount={likeCount}
            initialLiked={userLiked}
          />
        </div>

        {/* Comments */}
        <CommentSection articleId={article.id} />
      </article>
    </>
  )
}
