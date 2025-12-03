import Link from 'next/link'
import Image from 'next/image'
import { formatDistanceToNow } from 'date-fns'
import { ja } from 'date-fns/locale'
import { Heart, MessageCircle, Eye } from 'lucide-react'
import type { ArticleWithRelations } from '@/types/database'

type ArticleCardProps = {
  article: ArticleWithRelations
  variant?: 'default' | 'compact' | 'featured'
}

export function ArticleCard({ article, variant = 'default' }: ArticleCardProps) {
  // Compact variant for sidebars and rankings
  if (variant === 'compact') {
    return (
      <Link href={`/articles/${article.slug}`} className="block group">
        <article className="flex gap-3 hover:bg-muted/50 p-2 rounded-lg transition-colors">
          <div className="relative w-20 h-20 flex-shrink-0 rounded overflow-hidden bg-muted">
            {article.thumbnail_url ? (
              <Image
                src={article.thumbnail_url}
                alt={article.title}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-300"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">
                No Image
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-sm line-clamp-3 group-hover:text-primary transition-colors mb-1">
              {article.title}
            </h4>
            <time className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(article.published_at || article.created_at), {
                addSuffix: true,
                locale: ja,
              })}
            </time>
          </div>
        </article>
      </Link>
    )
  }

  // Featured variant for the featured articles grid
  if (variant === 'featured') {
    return (
      <Link href={`/articles/${article.slug}`} className="block group">
        <article className="h-full">
          <div className="relative aspect-video rounded-lg overflow-hidden bg-muted mb-3">
            {article.thumbnail_url ? (
              <Image
                src={article.thumbnail_url}
                alt={article.title}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-300"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                No Image
              </div>
            )}
          </div>
          {article.category && (
            <span className="inline-block px-2 py-1 text-xs font-bold bg-primary text-primary-foreground rounded mb-2">
              {article.category.name}
            </span>
          )}
          <h3 className="font-bold text-base md:text-lg line-clamp-2 group-hover:text-primary transition-colors">
            {article.title}
          </h3>
          <time className="text-xs text-muted-foreground mt-2 block">
            {formatDistanceToNow(new Date(article.published_at || article.created_at), {
              addSuffix: true,
              locale: ja,
            })}
          </time>
        </article>
      </Link>
    )
  }

  // Default variant for main article lists
  return (
    <Link href={`/articles/${article.slug}`} className="block group h-full">
      <article className="border rounded-lg overflow-hidden hover:shadow-lg transition-shadow bg-card flex flex-col h-full">
        <div className="relative aspect-video w-full bg-muted flex-shrink-0">
          {article.thumbnail_url ? (
            <Image
              src={article.thumbnail_url}
              alt={article.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
              No Image
            </div>
          )}
        </div>

        <div className="p-4 flex flex-col flex-1">
          <div className="flex-1">
            {article.category && (
              <span className="inline-block px-2 py-1 text-xs font-medium bg-primary/10 text-primary rounded mb-2">
                {article.category.name}
              </span>
            )}
            <h3 className="font-bold text-base md:text-lg line-clamp-2 group-hover:text-primary transition-colors mb-2 min-h-[3rem]">
              {article.title}
            </h3>
            {article.excerpt && (
              <p className="text-sm text-muted-foreground line-clamp-3 mb-3">
                {article.excerpt}
              </p>
            )}
          </div>

          <div className="flex items-center gap-4 text-xs text-muted-foreground pt-3 border-t mt-auto">
            <span className="flex items-center gap-1">
              <Heart className="h-3 w-3" />
              {article._count?.likes || 0}
            </span>
            <span className="flex items-center gap-1">
              <MessageCircle className="h-3 w-3" />
              {article._count?.comments || 0}
            </span>
            <span className="flex items-center gap-1">
              <Eye className="h-3 w-3" />
              {article.views || 0}
            </span>
            <time className="ml-auto truncate">
              {formatDistanceToNow(new Date(article.published_at || article.created_at), {
                addSuffix: true,
                locale: ja,
              })}
            </time>
          </div>
        </div>
      </article>
    </Link>
  )
}
