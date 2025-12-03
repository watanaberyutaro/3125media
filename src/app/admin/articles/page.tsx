import Link from 'next/link'
import { Plus, Edit, Trash2, Eye } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { DeleteArticleButton } from '@/components/articles/delete-article-button'

type ArticleListItem = {
  id: string
  title: string
  slug: string
  status: string
  published_at: string | null
  created_at: string
  category: { name: string } | null
  author: { name: string } | null
}

async function getArticles(): Promise<ArticleListItem[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('articles')
    .select(`
      id,
      title,
      slug,
      status,
      published_at,
      created_at,
      category:categories(name),
      author:users(name)
    `)
    .order('created_at', { ascending: false })

  if (error || !data) return []

  return data as unknown as ArticleListItem[]
}

export default async function ArticlesPage() {
  const articles = await getArticles()

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">記事管理</h1>
        <Button asChild>
          <Link href="/admin/articles/new">
            <Plus className="h-4 w-4 mr-2" />
            新規作成
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>記事一覧</CardTitle>
        </CardHeader>
        <CardContent>
          {articles.length > 0 ? (
            <div className="divide-y">
              {articles.map((article) => (
                <div
                  key={article.id}
                  className="flex items-center justify-between py-4"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium">{article.title}</h3>
                      <Badge
                        variant={
                          article.status === 'published' ? 'default' : 'secondary'
                        }
                      >
                        {article.status === 'published' ? '公開中' : '下書き'}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      {article.category && (
                        <span>{article.category.name}</span>
                      )}
                      {article.author && (
                        <span>{article.author.name}</span>
                      )}
                      <span>
                        {new Date(article.created_at).toLocaleDateString('ja-JP')}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" asChild>
                      <Link href={`/articles/${article.slug}`} target="_blank">
                        <Eye className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button variant="ghost" size="icon" asChild>
                      <Link href={`/admin/articles/${article.id}/edit`}>
                        <Edit className="h-4 w-4" />
                      </Link>
                    </Button>
                    <DeleteArticleButton articleId={article.id} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">
              まだ記事がありません。
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
