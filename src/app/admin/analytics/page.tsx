import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Eye, Clock, ExternalLink, TrendingUp } from 'lucide-react'

type ArticleStats = {
  id: string
  title: string
  slug: string
  impressions: number
  avg_duration: number
}

type ReferrerStats = {
  referrer: string
  count: number
}

type DailyStats = {
  date: string
  count: number
}

async function getOverviewStats() {
  const supabase = await createClient()

  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const weekStart = new Date(todayStart.getTime() - 7 * 24 * 60 * 60 * 1000)
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

  const [totalResult, todayResult, weekResult, monthResult] = await Promise.all([
    supabase.from('impressions').select('id', { count: 'exact', head: true }),
    supabase
      .from('impressions')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', todayStart.toISOString()),
    supabase
      .from('impressions')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', weekStart.toISOString()),
    supabase
      .from('impressions')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', monthStart.toISOString()),
  ])

  return {
    total: totalResult.count || 0,
    today: todayResult.count || 0,
    week: weekResult.count || 0,
    month: monthResult.count || 0,
  }
}

async function getTopArticles(): Promise<ArticleStats[]> {
  const supabase = await createClient()

  // Get impressions grouped by article
  const { data: impressions, error } = await supabase
    .from('impressions')
    .select('article_id, duration')

  if (error || !impressions) return []

  // Group by article
  const articleMap = new Map<string, { count: number; totalDuration: number }>()

  ;(impressions as Array<{ article_id: string; duration: number | null }>).forEach((imp) => {
    const existing = articleMap.get(imp.article_id) || { count: 0, totalDuration: 0 }
    articleMap.set(imp.article_id, {
      count: existing.count + 1,
      totalDuration: existing.totalDuration + (imp.duration || 0),
    })
  })

  // Get article details
  const articleIds = Array.from(articleMap.keys())
  if (articleIds.length === 0) return []

  const { data: articles } = await supabase
    .from('articles')
    .select('id, title, slug')
    .in('id', articleIds)

  if (!articles) return []

  const result: ArticleStats[] = (articles as Array<{ id: string; title: string; slug: string }>).map((article) => {
    const stats = articleMap.get(article.id) || { count: 0, totalDuration: 0 }
    return {
      id: article.id,
      title: article.title,
      slug: article.slug,
      impressions: stats.count,
      avg_duration: stats.count > 0 ? Math.round(stats.totalDuration / stats.count) : 0,
    }
  })

  return result.sort((a, b) => b.impressions - a.impressions).slice(0, 10)
}

async function getReferrerStats(): Promise<ReferrerStats[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('impressions')
    .select('referrer')

  if (error || !data) return []

  const referrerMap = new Map<string, number>()

  ;(data as Array<{ referrer: string | null }>).forEach((imp) => {
    const referrer = imp.referrer || '直接アクセス'
    let displayReferrer = referrer

    // Extract domain from URL
    if (referrer !== '直接アクセス') {
      try {
        const url = new URL(referrer)
        displayReferrer = url.hostname
      } catch {
        displayReferrer = referrer
      }
    }

    referrerMap.set(displayReferrer, (referrerMap.get(displayReferrer) || 0) + 1)
  })

  return Array.from(referrerMap.entries())
    .map(([referrer, count]) => ({ referrer, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)
}

function formatDuration(seconds: number): string {
  if (seconds < 60) {
    return `${seconds}秒`
  }
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${minutes}分${remainingSeconds}秒`
}

export default async function AnalyticsPage() {
  const [overview, topArticles, referrers] = await Promise.all([
    getOverviewStats(),
    getTopArticles(),
    getReferrerStats(),
  ])

  const overviewCards = [
    { title: '総PV', value: overview.total, icon: Eye, color: 'text-blue-500' },
    { title: '今日', value: overview.today, icon: TrendingUp, color: 'text-green-500' },
    { title: '今週', value: overview.week, icon: TrendingUp, color: 'text-yellow-500' },
    { title: '今月', value: overview.month, icon: TrendingUp, color: 'text-purple-500' },
  ]

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">アナリティクス</h1>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {overviewCards.map((card) => (
          <Card key={card.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {card.title}
              </CardTitle>
              <card.icon className={`h-4 w-4 ${card.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value.toLocaleString()}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Articles */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              人気記事
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topArticles.length > 0 ? (
              <div className="space-y-4">
                {topArticles.map((article, index) => (
                  <div
                    key={article.id}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-bold text-muted-foreground w-6">
                        {index + 1}
                      </span>
                      <div>
                        <p className="font-medium line-clamp-1">{article.title}</p>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Eye className="h-3 w-3" />
                            {article.impressions.toLocaleString()} PV
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDuration(article.avg_duration)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">
                データがありません
              </p>
            )}
          </CardContent>
        </Card>

        {/* Referrers */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ExternalLink className="h-5 w-5" />
              流入元
            </CardTitle>
          </CardHeader>
          <CardContent>
            {referrers.length > 0 ? (
              <div className="space-y-4">
                {referrers.map((referrer, index) => (
                  <div
                    key={referrer.referrer}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-bold text-muted-foreground w-6">
                        {index + 1}
                      </span>
                      <p className="font-medium">{referrer.referrer}</p>
                    </div>
                    <span className="text-muted-foreground">
                      {referrer.count.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">
                データがありません
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
