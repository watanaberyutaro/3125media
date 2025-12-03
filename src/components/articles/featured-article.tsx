import Link from 'next/link'
import Image from 'next/image'
import { formatDistanceToNow } from 'date-fns'
import { ja } from 'date-fns/locale'
import { Calendar } from 'lucide-react'
import type { ArticleWithRelations } from '@/types/database'

type FeaturedArticleProps = {
  article: ArticleWithRelations
}

export function FeaturedArticle({ article }: FeaturedArticleProps) {
  return (
    <Link href={`/articles/${article.slug}`} className="block group">
      <div className="relative aspect-[16/9] overflow-hidden rounded-lg bg-muted">
        {article.thumbnail_url ? (
          <Image
            src={article.thumbnail_url}
            alt={article.title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            priority
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
            No Image
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8 text-white">
          {article.category && (
            <span className="inline-block px-3 py-1 text-xs font-bold bg-primary rounded mb-3">
              {article.category.name}
            </span>
          )}

          <h2 className="text-2xl md:text-4xl lg:text-5xl font-bold mb-3 leading-tight group-hover:text-primary transition-colors">
            {article.title}
          </h2>

          {article.excerpt && (
            <p className="text-sm md:text-base text-white/90 mb-3 line-clamp-2 max-w-3xl">
              {article.excerpt}
            </p>
          )}

          <div className="flex items-center gap-4 text-xs md:text-sm text-white/80">
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3 md:h-4 md:w-4" />
              {formatDistanceToNow(new Date(article.published_at || article.created_at), {
                addSuffix: true,
                locale: ja,
              })}
            </span>
          </div>
        </div>
      </div>
    </Link>
  )
}
