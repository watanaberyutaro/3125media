import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

async function createAdmin() {
  // Use service role key to bypass RLS
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })

  const email = 'r.watanabe@3125.jp'
  const password = 'Pw31253125'
  const name = '渡辺'

  console.log('Creating admin user...')

  // Create auth user
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })

  if (authError) {
    console.error('Auth error:', authError)
    return
  }

  console.log('Auth user created:', authData.user.id)

  // Create user profile with admin role
  const { error: profileError } = await supabase
    .from('users')
    .insert({
      id: authData.user.id,
      email,
      name,
      role: 'admin',
    })

  if (profileError) {
    console.error('Profile error:', profileError)
    return
  }

  console.log('✓ Admin user created successfully!')
  console.log('Email:', email)
  console.log('Password:', password)
}

createAdmin()
