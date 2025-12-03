import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env.local')
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function setupAIUsageTable() {
  console.log('🔍 Checking if ai_usage table exists...')

  // Check if table exists by trying to query it
  const { error: checkError } = await supabase
    .from('ai_usage')
    .select('id')
    .limit(1)

  if (!checkError) {
    console.log('✅ ai_usage table already exists!')
    return
  }

  console.log('📝 Creating ai_usage table...')

  // Create the table
  const { error: createError } = await supabase.rpc('exec_sql', {
    sql: `
      -- AI API使用量追跡テーブル
      CREATE TABLE IF NOT EXISTS ai_usage (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        model TEXT NOT NULL,
        prompt_tokens INTEGER NOT NULL,
        completion_tokens INTEGER NOT NULL,
        total_tokens INTEGER NOT NULL,
        estimated_cost DECIMAL(10, 6) NOT NULL,
        request_type TEXT NOT NULL,
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      -- インデックス
      CREATE INDEX IF NOT EXISTS idx_ai_usage_user_id ON ai_usage(user_id);
      CREATE INDEX IF NOT EXISTS idx_ai_usage_created_at ON ai_usage(created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_ai_usage_request_type ON ai_usage(request_type);

      -- RLS有効化
      ALTER TABLE ai_usage ENABLE ROW LEVEL SECURITY;

      -- Drop existing policies if they exist
      DROP POLICY IF EXISTS "Admins can view all ai_usage" ON ai_usage;
      DROP POLICY IF EXISTS "Users can view own ai_usage" ON ai_usage;

      -- 管理者のみ全てのレコードを閲覧可能
      CREATE POLICY "Admins can view all ai_usage"
        ON ai_usage
        FOR SELECT
        TO authenticated
        USING (
          EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'admin'
          )
        );

      -- 自分の使用量のみ閲覧可能
      CREATE POLICY "Users can view own ai_usage"
        ON ai_usage
        FOR SELECT
        TO authenticated
        USING (user_id = auth.uid());
    `
  })

  if (createError) {
    // If rpc doesn't work, try direct SQL execution
    console.log('⚠️  RPC method not available, trying direct SQL...')

    const { error: directError } = await supabase.from('ai_usage').insert({
      user_id: '00000000-0000-0000-0000-000000000000',
      model: 'test',
      prompt_tokens: 0,
      completion_tokens: 0,
      total_tokens: 0,
      estimated_cost: 0,
      request_type: 'test'
    })

    if (directError && directError.message.includes('does not exist')) {
      console.error('❌ Cannot create table automatically.')
      console.error('Please run the following SQL in your Supabase SQL Editor:')
      console.error('\n--- SQL START ---')
      console.error(`
CREATE TABLE IF NOT EXISTS ai_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  model TEXT NOT NULL,
  prompt_tokens INTEGER NOT NULL,
  completion_tokens INTEGER NOT NULL,
  total_tokens INTEGER NOT NULL,
  estimated_cost DECIMAL(10, 6) NOT NULL,
  request_type TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_usage_user_id ON ai_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_usage_created_at ON ai_usage(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_usage_request_type ON ai_usage(request_type);

ALTER TABLE ai_usage ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view all ai_usage" ON ai_usage;
DROP POLICY IF EXISTS "Users can view own ai_usage" ON ai_usage;

CREATE POLICY "Admins can view all ai_usage"
  ON ai_usage
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Users can view own ai_usage"
  ON ai_usage
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());
      `)
      console.error('--- SQL END ---\n')
      process.exit(1)
    }
  }

  console.log('✅ ai_usage table created successfully!')
}

setupAIUsageTable()
  .then(() => {
    console.log('\n✨ Setup complete!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Error:', error)
    process.exit(1)
  })
