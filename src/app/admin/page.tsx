import { FileText, Eye, Heart, MessageSquare } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

type RecentArticle = {
  id: string
  title: string
  slug: string
  status: string
  created_at: string
}

async function getStats() {
  const supabase = await createClient()

  const [articlesResult, impressionsResult, likesResult, commentsResult] = await Promise.all([
    supabase.from('articles').select('id', { count: 'exact', head: true }),
    supabase.from('impressions').select('id', { count: 'exact', head: true }),
    supabase.from('likes').select('id', { count: 'exact', head: true }),
    supabase.from('comments').select('id', { count: 'exact', head: true }),
  ])

  return {
    articles: articlesResult.count || 0,
    impressions: impressionsResult.count || 0,
    likes: likesResult.count || 0,
    comments: commentsResult.count || 0,
  }
}

async function getRecentArticles(): Promise<RecentArticle[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('articles')
    .select('id, title, slug, status, created_at')
    .order('created_at', { ascending: false })
    .limit(5)

  if (error || !data) return []

  return data as unknown as RecentArticle[]
}

export default async function AdminDashboard() {
  const [stats, recentArticles] = await Promise.all([
    getStats(),
    getRecentArticles(),
  ])

  const statCards = [
    {
      title: '記事数',
      value: stats.articles,
      icon: FileText,
      color: 'text-blue-500',
    },
    {
      title: 'インプレッション',
      value: stats.impressions,
      icon: Eye,
      color: 'text-green-500',
    },
    {
      title: 'いいね数',
      value: stats.likes,
      icon: Heart,
      color: 'text-red-500',
    },
    {
      title: 'コメント数',
      value: stats.comments,
      icon: MessageSquare,
      color: 'text-yellow-500',
    },
  ]

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">ダッシュボード</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value.toLocaleString()}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Articles */}
      <Card>
        <CardHeader>
          <CardTitle>最近の記事</CardTitle>
        </CardHeader>
        <CardContent>
          {recentArticles.length > 0 ? (
            <div className="space-y-4">
              {recentArticles.map((article) => (
                <div
                  key={article.id}
                  className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0"
                >
                  <div>
                    <p className="font-medium">{article.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(article.created_at).toLocaleDateString('ja-JP')}
                    </p>
                  </div>
                  <span
                    className={`px-2 py-1 text-xs rounded ${
                      article.status === 'published'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}
                  >
                    {article.status === 'published' ? '公開中' : '下書き'}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">まだ記事がありません。</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
