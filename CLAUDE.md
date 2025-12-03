# 3125 Media

投稿機能を持つWEBメディアサイト

## 技術スタック

- **フレームワーク**: Next.js 15 (App Router)
- **言語**: TypeScript
- **スタイリング**: Tailwind CSS v4
- **UI**: shadcn/ui
- **データベース**: Supabase (PostgreSQL)
- **認証**: Supabase Auth
- **エディタ**: Novel (Tiptapベース)

## 主要機能

- 記事投稿・編集（リッチテキストエディタ）
- カテゴリ管理（階層構造対応）
- タグ管理
- コメント機能（返信対応）
- いいね機能
- インプレッション分析（PV、滞在時間、流入元）
- SEO最適化（SSG/ISR対応）

## ディレクトリ構造

```
src/
├── app/
│   ├── (public)/        # 公開ページ
│   ├── (auth)/          # 認証ページ
│   ├── admin/           # 管理画面
│   └── api/             # APIルート
├── components/
│   ├── ui/              # shadcn/uiコンポーネント
│   ├── layout/          # レイアウトコンポーネント
│   ├── articles/        # 記事関連コンポーネント
│   ├── comments/        # コメント関連コンポーネント
│   ├── editor/          # エディタコンポーネント
│   └── analytics/       # 分析関連コンポーネント
├── lib/
│   ├── supabase/        # Supabaseクライアント
│   └── utils/           # ユーティリティ
├── hooks/               # カスタムフック
└── types/               # 型定義
```

## ユーザーロール

- **admin**: 全機能へのアクセス（記事管理、カテゴリ管理、分析等）
- **user**: 閲覧、いいね、コメント

## 開発コマンド

```bash
npm run dev      # 開発サーバー起動
npm run build    # ビルド
npm run start    # 本番サーバー起動
npm run lint     # Lint実行
```

## Supabase

- URL: https://zplbeuyedydodnrgkazl.supabase.co
- マイグレーションファイル: `supabase/migrations/`

## 注意事項

- 管理画面（/admin）は管理者のみアクセス可能
- SEOのためSSG/ISRを活用（revalidate設定）
- 画像はSupabase Storageに保存
