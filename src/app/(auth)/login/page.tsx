'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const { error, data } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        toast.error(error.message)
        return
      }

      if (!data.session) {
        toast.error('セッションの作成に失敗しました')
        return
      }

      toast.success('ログインしました')

      // Retry session verification up to 5 times with increasing delays
      let sessionVerified = false
      for (let attempt = 0; attempt < 5; attempt++) {
        // Wait with exponential backoff: 300ms, 600ms, 900ms, 1200ms, 1500ms
        await new Promise((resolve) => setTimeout(resolve, 300 * (attempt + 1)))

        const { data: { session } } = await supabase.auth.getSession()

        if (session) {
          sessionVerified = true
          break
        }
      }

      if (sessionVerified) {
        // Force a hard navigation to ensure middleware picks up the new session
        window.location.href = '/'
      } else {
        toast.error('セッションの確認に失敗しました。もう一度お試しください。')
        setIsLoading(false)
      }
    } catch {
      toast.error('ログインに失敗しました')
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">ログイン</CardTitle>
        <CardDescription>
          アカウントにログインしてください
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleLogin}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">メールアドレス</Label>
            <Input
              id="email"
              type="email"
              placeholder="email@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">パスワード</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'ログイン中...' : 'ログイン'}
          </Button>
          <p className="text-sm text-muted-foreground text-center">
            アカウントをお持ちでない方は{' '}
            <Link href="/register" className="text-primary hover:underline">
              新規登録
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  )
}
