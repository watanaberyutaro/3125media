import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'

export const metadata = {
  title: 'タグ一覧',
}

type Tag = {
  id: string
  name: string
  slug: string
}

async function getTags(): Promise<Tag[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('tags')
    .select('*')
    .order('name')

  if (error || !data) return []

  return data as Tag[]
}

export default async function TagsPage() {
  const tags = await getTags()

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">タグ一覧</h1>

      {tags.length > 0 ? (
        <div className="flex flex-wrap gap-3">
          {tags.map((tag) => (
            <Link key={tag.id} href={`/tags/${tag.slug}`}>
              <Badge
                variant="secondary"
                className="px-4 py-2 text-base hover:bg-primary hover:text-primary-foreground transition-colors cursor-pointer"
              >
                #{tag.name}
              </Badge>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-muted-foreground">
          <p>タグがありません。</p>
        </div>
      )}
    </div>
  )
}
