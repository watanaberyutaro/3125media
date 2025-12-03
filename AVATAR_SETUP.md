# アバターアップロード機能のセットアップ

プロフィール画像のアップロード機能を使用するには、Supabase Storageの設定が必要です。

## セットアップ手順

### 1. Supabaseダッシュボードにアクセス

[Supabaseダッシュボード](https://supabase.com/dashboard)にログインしてプロジェクトを開きます。

### 2. SQLエディタでストレージバケットを作成

1. 左側のメニューから「SQL Editor」を選択
2. 「New query」をクリック
3. `scripts/setup-storage.sql` の内容をコピー&ペースト
4. 「Run」をクリックして実行

または、以下のSQLを直接実行してください:

```sql
-- Create a public storage bucket for user avatars and other public files
INSERT INTO storage.buckets (id, name, public)
VALUES ('public', 'public', true)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policies for the public bucket

-- Allow anyone to read files from the public bucket
CREATE POLICY IF NOT EXISTS "Public bucket is readable by everyone"
ON storage.objects FOR SELECT
USING (bucket_id = 'public');

-- Allow authenticated users to upload files to their own folder
CREATE POLICY IF NOT EXISTS "Authenticated users can upload to public bucket"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'public');

-- Allow users to update their own files
CREATE POLICY IF NOT EXISTS "Users can update their own files"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'public');

-- Allow users to delete their own files
CREATE POLICY IF NOT EXISTS "Users can delete their own files"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'public');
```

### 3. ストレージバケットを確認

1. 左側のメニューから「Storage」を選択
2. 「public」というバケットが作成されていることを確認

## 機能の使い方

### 一般ユーザー

1. ログイン後、右上のアバターアイコンをクリック
2. 「プロフィール」をクリック
3. `/profile` ページでアバター画像をアップロード

### 管理者

1. 管理画面のサイドバーから「設定」をクリック
2. `/admin/settings` ページでアバター画像をアップロード

## 対応している画像形式

- JPG / JPEG
- PNG
- GIF

推奨: 正方形の画像（例: 512x512px）

## トラブルシューティング

### アップロードエラーが発生する場合

1. Supabaseダッシュボードで「Storage」→「public」バケットが存在することを確認
2. RLSポリシーが正しく設定されていることを確認
3. ブラウザのコンソールでエラーメッセージを確認

### 画像が表示されない場合

1. アップロードが成功していることを確認
2. ブラウザのキャッシュをクリア
3. Supabaseの「Storage」でファイルが存在することを確認
