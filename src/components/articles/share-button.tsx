'use client'

import { Share2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ShareButtonProps {
  title: string
  slug: string
}

export function ShareButton({ title, slug }: ShareButtonProps) {
  const handleShare = () => {
    // ブラウザの現在のURLを使用して正しいURLを生成
    const url = `${window.location.origin}/articles/${slug}`

    const shareText = `記事を更新しました！
本日のテーマはこちら👇
「${title}」

${url}

ぜひチェックしてみてください。`

    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`
    window.open(twitterUrl, '_blank', 'noopener,noreferrer,width=550,height=420')
  }

  return (
    <Button
      onClick={handleShare}
      variant="outline"
      size="lg"
      className="gap-2"
    >
      <Share2 className="h-5 w-5" />
      <span>Xでシェア</span>
    </Button>
  )
}
