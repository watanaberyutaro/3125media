import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

dotenv.config({ path: join(__dirname, '..', '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function checkArticles() {
  console.log('Checking articles in database...\n')

  const { data: articles, error } = await supabase
    .from('articles')
    .select('id, title, slug, status, published_at, created_at')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching articles:', error)
    return
  }

  if (!articles || articles.length === 0) {
    console.log('No articles found in database.')
    return
  }

  console.log(`Found ${articles.length} article(s):\n`)

  articles.forEach((article, index) => {
    console.log(`${index + 1}. ${article.title}`)
    console.log(`   ID: ${article.id}`)
    console.log(`   Slug: ${article.slug}`)
    console.log(`   URL: http://localhost:3000/articles/${article.slug}`)
    console.log(`   Status: ${article.status}`)
    console.log(`   Published: ${article.published_at || 'Not published'}`)
    console.log(`   Created: ${article.created_at}`)
    console.log('')
  })

  // Check if any published articles exist
  const publishedArticles = articles.filter(a => a.status === 'published')
  console.log(`\nPublished articles: ${publishedArticles.length}`)
  console.log(`Draft articles: ${articles.length - publishedArticles.length}`)
}

checkArticles()
