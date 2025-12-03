import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load .env.local from project root
dotenv.config({ path: join(__dirname, '..', '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase credentials in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function checkTable() {
  console.log('🔍 Checking ai_usage table...\n')

  // Try to query the table
  const { data, error } = await supabase
    .from('ai_usage')
    .select('id')
    .limit(1)

  if (error) {
    console.error('❌ ai_usage table does NOT exist or is not accessible')
    console.error('Error:', error.message)
    console.log('\n📋 Please run the following SQL in your Supabase SQL Editor:')
    console.log('   Dashboard → SQL Editor → New Query\n')
    console.log('--- COPY FROM HERE ---')
    console.log(`
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

-- 既存のポリシーを削除
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
`)
    console.log('--- COPY TO HERE ---\n')
    console.log('After running the SQL, refresh your app and try the AI generation again.')
    process.exit(1)
  }

  console.log('✅ ai_usage table exists and is accessible!')

  // Count records
  const { count } = await supabase
    .from('ai_usage')
    .select('*', { count: 'exact', head: true })

  console.log(`📊 Current records: ${count || 0}`)

  if (count === 0) {
    console.log('\n💡 The table is empty. Try using AI generation to create a record.')
  }
}

checkTable()
  .catch((error) => {
    console.error('❌ Error:', error)
    process.exit(1)
  })
