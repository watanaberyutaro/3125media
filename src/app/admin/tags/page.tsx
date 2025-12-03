import { createClient } from '@/lib/supabase/server'
import { TagManager } from '@/components/tags/tag-manager'

type Tag = {
  id: string
  name: string
  slug: string
  created_at: string
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
    <div>
      <h1 className="text-2xl font-bold mb-6">タグ管理</h1>
      <TagManager initialTags={tags} />
    </div>
  )
}
