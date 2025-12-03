'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArticleCard } from './article-card'
import { TrendingUp } from 'lucide-react'
import type { ArticleWithRelations } from '@/types/database'

type RankingSidebarProps = {
  rankingData: {
    daily: ArticleWithRelations[]
    weekly: ArticleWithRelations[]
    monthly: ArticleWithRelations[]
  }
}

export function RankingSidebar({ rankingData }: RankingSidebarProps) {
  const [activeTab, setActiveTab] = useState('daily')

  const dailyArticles = rankingData.daily.slice(0, 5)
  const weeklyArticles = rankingData.weekly.slice(0, 5)
  const monthlyArticles = rankingData.monthly.slice(0, 5)

  return (
    <Card className="sticky top-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          ランキング
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="daily" className="text-xs">デイリー</TabsTrigger>
            <TabsTrigger value="weekly" className="text-xs">週間</TabsTrigger>
            <TabsTrigger value="monthly" className="text-xs">月間</TabsTrigger>
          </TabsList>

          <TabsContent value="daily" className="space-y-2 mt-4">
            {dailyArticles.map((article, index) => (
              <div key={article.id} className="relative">
                <div className="absolute -left-2 top-2 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold z-10">
                  {index + 1}
                </div>
                <ArticleCard article={article} variant="compact" />
              </div>
            ))}
          </TabsContent>

          <TabsContent value="weekly" className="space-y-2 mt-4">
            {weeklyArticles.map((article, index) => (
              <div key={article.id} className="relative">
                <div className="absolute -left-2 top-2 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold z-10">
                  {index + 1}
                </div>
                <ArticleCard article={article} variant="compact" />
              </div>
            ))}
          </TabsContent>

          <TabsContent value="monthly" className="space-y-2 mt-4">
            {monthlyArticles.map((article, index) => (
              <div key={article.id} className="relative">
                <div className="absolute -left-2 top-2 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold z-10">
                  {index + 1}
                </div>
                <ArticleCard article={article} variant="compact" />
              </div>
            ))}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
