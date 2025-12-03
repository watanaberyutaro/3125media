import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { DollarSign, Zap, TrendingUp, Calendar } from 'lucide-react'

type UsageData = {
  id: string
  user_id: string
  model: string
  prompt_tokens: number
  completion_tokens: number
  total_tokens: number
  estimated_cost: number
  request_type: string
  created_at: string
  users?: {
    email?: string
  }
}

type UsageStats = {
  totalCost: number
  totalTokens: number
  totalRequests: number
  todayCost: number
  monthCost: number
}

async function getUsageStats(): Promise<UsageStats> {
  const supabase = await createClient()

  const { data: allUsage } = await (supabase as any)
    .from('ai_usage')
    .select('estimated_cost, total_tokens, created_at')

  if (!allUsage) {
    return {
      totalCost: 0,
      totalTokens: 0,
      totalRequests: 0,
      todayCost: 0,
      monthCost: 0,
    }
  }

  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

  const totalCost = allUsage.reduce((sum: number, u: any) => sum + Number(u.estimated_cost), 0)
  const totalTokens = allUsage.reduce((sum: number, u: any) => sum + u.total_tokens, 0)
  const totalRequests = allUsage.length

  const todayCost = allUsage
    .filter((u: any) => new Date(u.created_at) >= todayStart)
    .reduce((sum: number, u: any) => sum + Number(u.estimated_cost), 0)

  const monthCost = allUsage
    .filter((u: any) => new Date(u.created_at) >= monthStart)
    .reduce((sum: number, u: any) => sum + Number(u.estimated_cost), 0)

  return {
    totalCost,
    totalTokens,
    totalRequests,
    todayCost,
    monthCost,
  }
}

async function getRecentUsage(): Promise<UsageData[]> {
  const supabase = await createClient()

  const { data } = await (supabase as any)
    .from('ai_usage')
    .select(`
      *,
      users:user_id (
        email
      )
    `)
    .order('created_at', { ascending: false })
    .limit(50)

  return (data || []) as unknown as UsageData[]
}

export default async function AIUsagePage() {
  const [stats, recentUsage] = await Promise.all([
    getUsageStats(),
    getRecentUsage(),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">AI API使用量</h1>
        <p className="text-muted-foreground">
          OpenAI APIの使用状況と推定コストを確認できます
        </p>
      </div>

      {/* 統計カード */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">今月の利用金額</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${stats.monthCost.toFixed(4)}
            </div>
            <p className="text-xs text-muted-foreground">
              約¥{(stats.monthCost * 150).toFixed(2)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">本日の利用金額</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${stats.todayCost.toFixed(4)}
            </div>
            <p className="text-xs text-muted-foreground">
              約¥{(stats.todayCost * 150).toFixed(2)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">総トークン数</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.totalTokens.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.totalRequests}件のリクエスト
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">総利用金額</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${stats.totalCost.toFixed(4)}
            </div>
            <p className="text-xs text-muted-foreground">
              約¥{(stats.totalCost * 150).toFixed(2)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 最近の使用履歴 */}
      <Card>
        <CardHeader>
          <CardTitle>使用履歴</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>日時</TableHead>
                <TableHead>ユーザー</TableHead>
                <TableHead>種類</TableHead>
                <TableHead>モデル</TableHead>
                <TableHead className="text-right">トークン数</TableHead>
                <TableHead className="text-right">推定金額</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentUsage.length > 0 ? (
                recentUsage.map((usage) => (
                  <TableRow key={usage.id}>
                    <TableCell className="text-sm">
                      {new Date(usage.created_at).toLocaleString('ja-JP')}
                    </TableCell>
                    <TableCell className="text-sm">
                      {usage.users?.email || '不明'}
                    </TableCell>
                    <TableCell className="text-sm">
                      {usage.request_type === 'article_generation'
                        ? '記事生成'
                        : usage.request_type}
                    </TableCell>
                    <TableCell className="text-sm font-mono">
                      {usage.model}
                    </TableCell>
                    <TableCell className="text-right text-sm">
                      <div>
                        <div className="font-medium">
                          {usage.total_tokens.toLocaleString()}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          入力: {usage.prompt_tokens} / 出力: {usage.completion_tokens}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right text-sm">
                      <div>
                        <div className="font-medium">
                          ${Number(usage.estimated_cost).toFixed(4)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          ¥{(Number(usage.estimated_cost) * 150).toFixed(2)}
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    まだ使用履歴がありません
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* 料金情報 */}
      <Card>
        <CardHeader>
          <CardTitle>料金体系（GPT-4o-mini）</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">入力トークン:</span>
            <span className="font-mono">$0.150 / 1M tokens</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">出力トークン:</span>
            <span className="font-mono">$0.600 / 1M tokens</span>
          </div>
          <div className="pt-2 border-t text-xs text-muted-foreground">
            ※ 推定金額はOpenAIの公式料金に基づいて計算されています
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
