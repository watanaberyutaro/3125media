import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkRanking() {
  console.log('=== Checking Ranking Data ===\n')

  // Check if articles table has views column
  const { data: articles, error: articlesError } = await supabase
    .from('articles')
    .select('id, title, slug, status, views, created_at, published_at')
    .eq('status', 'published')
    .order('created_at', { ascending: false })
    .limit(10)

  if (articlesError) {
    console.error('Error fetching articles:', articlesError)
    return
  }

  console.log(`Found ${articles?.length || 0} published articles\n`)

  if (articles && articles.length > 0) {
    console.log('Sample articles:')
    articles.forEach((article, i) => {
      console.log(`${i + 1}. ${article.title}`)
      console.log(`   Views: ${article.views || 0}`)
      console.log(`   Created: ${article.created_at}`)
      console.log(`   Published: ${article.published_at || 'Not published'}`)
      console.log()
    })

    // Check daily ranking (last 24 hours)
    const now = new Date()
    const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)

    console.log('=== Daily Ranking Query ===')
    console.log(`Looking for articles created after: ${dayAgo.toISOString()}\n`)

    const { data: dailyArticles, error: dailyError } = await supabase
      .from('articles')
      .select('id, title, views, created_at')
      .eq('status', 'published')
      .gte('created_at', dayAgo.toISOString())
      .order('views', { ascending: false, nullsFirst: false })
      .limit(10)

    if (dailyError) {
      console.error('Daily ranking error:', dailyError)
    } else {
      console.log(`Daily ranking found: ${dailyArticles?.length || 0} articles`)
      if (dailyArticles && dailyArticles.length > 0) {
        dailyArticles.forEach((article, i) => {
          console.log(`${i + 1}. ${article.title} (Views: ${article.views || 0})`)
        })
      } else {
        console.log('No articles found in the last 24 hours')
        console.log('\nFalling back to latest articles...')

        const { data: fallback } = await supabase
          .from('articles')
          .select('id, title, views, published_at')
          .eq('status', 'published')
          .order('published_at', { ascending: false })
          .limit(10)

        console.log(`Fallback found: ${fallback?.length || 0} articles`)
      }
    }
  } else {
    console.log('No published articles found in the database')
  }
}

checkRanking()
