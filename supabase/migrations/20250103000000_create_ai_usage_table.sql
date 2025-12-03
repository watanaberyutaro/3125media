-- AI API使用量追跡テーブル
CREATE TABLE ai_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  model TEXT NOT NULL,
  prompt_tokens INTEGER NOT NULL,
  completion_tokens INTEGER NOT NULL,
  total_tokens INTEGER NOT NULL,
  estimated_cost DECIMAL(10, 6) NOT NULL,
  request_type TEXT NOT NULL, -- 'article_generation' など
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- インデックス
CREATE INDEX idx_ai_usage_user_id ON ai_usage(user_id);
CREATE INDEX idx_ai_usage_created_at ON ai_usage(created_at DESC);
CREATE INDEX idx_ai_usage_request_type ON ai_usage(request_type);

-- RLS有効化
ALTER TABLE ai_usage ENABLE ROW LEVEL SECURITY;

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
