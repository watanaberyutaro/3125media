import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase credentials in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function setupAdmin() {
  const email = 'r.watanabe@3125.jp'
  const password = 'Pw31253125'
  const name = '渡辺'

  console.log('Signing up admin user...')

  // Sign up the user
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name,
      }
    }
  })

  if (signUpError) {
    if (signUpError.message.includes('already registered')) {
      console.log('User already exists, attempting to sign in...')

      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (signInError) {
        console.error('Sign in error:', signInError.message)
        return
      }

      console.log('✓ Signed in successfully')
      console.log('User ID:', signInData.user.id)
    } else {
      console.error('Sign up error:', signUpError.message)
      return
    }
  } else {
    console.log('✓ User created successfully')
    console.log('User ID:', signUpData.user?.id)
  }

  // Insert user profile (if it doesn't exist)
  const userId = signUpData?.user?.id
  if (userId) {
    const { error: profileError } = await supabase
      .from('users')
      .upsert({
        id: userId,
        email,
        name,
        role: 'user', // Start as user, will update to admin via SQL
      }, {
        onConflict: 'id'
      })

    if (profileError && !profileError.message.includes('duplicate')) {
      console.error('Profile error:', profileError.message)
    }
  }

  console.log('\n✓ Setup complete!')
  console.log('\nNow run this SQL in Supabase SQL Editor to grant admin access:')
  console.log('----------------------------------------')
  console.log(`UPDATE users SET role = 'admin' WHERE email = '${email}';`)
  console.log('----------------------------------------')
  console.log('\nLogin credentials:')
  console.log('Email:', email)
  console.log('Password:', password)
}

setupAdmin()
