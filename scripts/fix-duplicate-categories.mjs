import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load environment variables from .env.local
dotenv.config({ path: join(__dirname, '..', '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function fixDuplicateCategories() {
  console.log('Fixing duplicate categories...\n')

  // IDs of categories with Japanese slugs (incorrect ones)
  const incorrectCategoryIds = [
    '7f9be45e-7407-499e-9dae-205aa3d4d7cd', // ガジェット with slug ガジェット
    '8122355b-821c-4c8d-bb24-beb81ef69342', // テクノロジー with slug テクノロジー
  ]

  console.log('Categories to delete:')
  console.log('1. ガジェット (slug: ガジェット)')
  console.log('2. テクノロジー (slug: テクノロジー)')
  console.log('')

  // First, check if there are any articles using these categories
  for (const categoryId of incorrectCategoryIds) {
    const { data: articles, error } = await supabase
      .from('articles')
      .select('id, title')
      .eq('category_id', categoryId)

    if (error) {
      console.error(`Error checking articles for category ${categoryId}:`, error)
      continue
    }

    if (articles && articles.length > 0) {
      console.log(`⚠️  Category ${categoryId} has ${articles.length} articles. Need to migrate them first.`)
      console.log('Articles:', articles.map(a => a.title).join(', '))
      console.log('')
    } else {
      console.log(`✅ Category ${categoryId} has no articles.`)
    }
  }

  // Delete the incorrect categories
  console.log('\nDeleting incorrect categories...')

  const { error: deleteError } = await supabase
    .from('categories')
    .delete()
    .in('id', incorrectCategoryIds)

  if (deleteError) {
    console.error('Error deleting categories:', deleteError)
    return
  }

  console.log('✅ Successfully deleted incorrect categories!')

  // Verify the result
  const { data: remainingCategories, error: checkError } = await supabase
    .from('categories')
    .select('*')
    .is('parent_id', null)
    .order('order')

  if (checkError) {
    console.error('Error checking remaining categories:', checkError)
    return
  }

  console.log('\n📋 Remaining parent categories:')
  remainingCategories.forEach((cat, index) => {
    console.log(`${index + 1}. ${cat.name} (slug: ${cat.slug})`)
  })
}

fixDuplicateCategories()
