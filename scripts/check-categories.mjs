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

async function checkCategories() {
  console.log('Checking categories...\n')

  const { data: categories, error } = await supabase
    .from('categories')
    .select('*')
    .is('parent_id', null)
    .order('order')

  if (error) {
    console.error('Error fetching categories:', error)
    return
  }

  console.log('Parent Categories:')
  console.log('==================')
  categories.forEach((cat, index) => {
    console.log(`${index + 1}. ID: ${cat.id}`)
    console.log(`   Name: ${cat.name}`)
    console.log(`   Slug: ${cat.slug}`)
    console.log(`   Order: ${cat.order}`)
    console.log('')
  })

  // Check for duplicates by slug
  const slugs = categories.map(c => c.slug)
  const duplicates = slugs.filter((slug, index) => slugs.indexOf(slug) !== index)

  if (duplicates.length > 0) {
    console.log('⚠️  Duplicate slugs found:', duplicates)
  } else {
    console.log('✅ No duplicate slugs found')
  }

  // Check for similar names (potential duplicates)
  const names = categories.map(c => c.name)
  console.log('\n📋 All category names:')
  names.forEach((name, i) => console.log(`  ${i + 1}. ${name}`))
}

checkCategories()
