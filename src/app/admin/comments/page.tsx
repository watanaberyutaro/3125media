import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CommentModeration } from '@/components/comments/comment-moderation'

type CommentWithDetails = {
  id: string
  content: string
  created_at: string
  article: {
    id: string
    title: string
    slug: string
  }
  user: {
    id: string
    name: string
    email: string
  }
}

async function getComments(): Promise<CommentWithDetails[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('comments')
    .select(`
      id,
      content,
      created_at,
      article:articles(id, title, slug),
      user:users(id, name, email)
    `)
    .order('created_at', { ascending: false })
    .limit(50)

  if (error || !data) return []

  return data as unknown as CommentWithDetails[]
}

export default async function CommentsPage() {
  const comments = await getComments()

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">コメント管理</h1>
      <Card>
        <CardHeader>
          <CardTitle>最近のコメント</CardTitle>
        </CardHeader>
        <CardContent>
          <CommentModeration initialComments={comments} />
        </CardContent>
      </Card>
    </div>
  )
}
