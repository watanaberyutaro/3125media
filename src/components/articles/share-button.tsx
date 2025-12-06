'use client'

import { Share2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ShareButtonProps {
  title: string
  url: string
}

export function ShareButton({ title, url }: ShareButtonProps) {
  const handleShare = () => {
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`
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
