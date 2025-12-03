-- カテゴリを追加するSQL
-- 既存のカテゴリを削除して新しいカテゴリを追加する場合は、まず既存のカテゴリを確認してください

-- ① ガジェット（親カテゴリ）
INSERT INTO categories (name, slug, description, parent_id, "order")
VALUES
  ('ガジェット', 'gadget', 'PC・スマホ・カメラなど、最新ガジェット情報をお届けします', NULL, 1);

-- ガジェットのIDを取得するための一時変数（実行時に適宜調整）
-- 実際には、挿入後にIDを確認してから子カテゴリを追加してください

-- ガジェットの子カテゴリ
INSERT INTO categories (name, slug, description, parent_id, "order")
VALUES
  ('PC・スマホ', 'pc-smartphone', 'パソコンとスマートフォンの最新情報', (SELECT id FROM categories WHERE slug = 'gadget'), 1),
  ('カメラ', 'camera', 'カメラと撮影機材の情報', (SELECT id FROM categories WHERE slug = 'gadget'), 2),
  ('周辺機器', 'peripherals', 'PC・スマホの周辺機器', (SELECT id FROM categories WHERE slug = 'gadget'), 3),
  ('アクセサリー', 'accessories', 'ガジェット用アクセサリー', (SELECT id FROM categories WHERE slug = 'gadget'), 4);

-- ② テクノロジー（親カテゴリ）
INSERT INTO categories (name, slug, description, parent_id, "order")
VALUES
  ('テクノロジー', 'technology', 'AI・クラウドなど、最新テクノロジー情報', NULL, 2);

-- テクノロジーの子カテゴリ
INSERT INTO categories (name, slug, description, parent_id, "order")
VALUES
  ('AI', 'ai', '人工知能・機械学習の最新情報', (SELECT id FROM categories WHERE slug = 'technology'), 1),
  ('クラウド', 'cloud', 'クラウドサービスとツール', (SELECT id FROM categories WHERE slug = 'technology'), 2),
  ('ロボット', 'robot', 'ロボティクス・自動化技術', (SELECT id FROM categories WHERE slug = 'technology'), 3),
  ('アプリ・ツール', 'apps-tools', '便利なアプリとツール', (SELECT id FROM categories WHERE slug = 'technology'), 4);

-- ③ ライフスタイル（親カテゴリ）
INSERT INTO categories (name, slug, description, parent_id, "order")
VALUES
  ('ライフスタイル', 'lifestyle', '日々の暮らしをより良くする情報', NULL, 3);

-- ライフスタイルの子カテゴリ
INSERT INTO categories (name, slug, description, parent_id, "order")
VALUES
  ('日記', 'diary', '日常の記録と振り返り', (SELECT id FROM categories WHERE slug = 'lifestyle'), 1),
  ('ワークスペース', 'workspace', '仕事環境の整え方', (SELECT id FROM categories WHERE slug = 'lifestyle'), 2),
  ('ミニマリズム', 'minimalism', 'シンプルな暮らし方', (SELECT id FROM categories WHERE slug = 'lifestyle'), 3);

-- ④ 便利・暮らし改善（親カテゴリ）
INSERT INTO categories (name, slug, description, parent_id, "order")
VALUES
  ('便利・暮らし改善', 'life-improvement', '暮らしを便利にする情報', NULL, 4);

-- 便利・暮らし改善の子カテゴリ
INSERT INTO categories (name, slug, description, parent_id, "order")
VALUES
  ('家具', 'furniture', 'おすすめ家具とインテリア', (SELECT id FROM categories WHERE slug = 'life-improvement'), 1),
  ('家電', 'appliances', '便利な家電製品', (SELECT id FROM categories WHERE slug = 'life-improvement'), 2),
  ('サービス', 'services', '生活を豊かにするサービス', (SELECT id FROM categories WHERE slug = 'life-improvement'), 3),
  ('ライフハック', 'lifehack', '暮らしの工夫とテクニック', (SELECT id FROM categories WHERE slug = 'life-improvement'), 4);

-- ⑤ クリエイティブ（親カテゴリ）
INSERT INTO categories (name, slug, description, parent_id, "order")
VALUES
  ('クリエイティブ', 'creative', '映像・写真などクリエイティブな情報', NULL, 5);

-- クリエイティブの子カテゴリ
INSERT INTO categories (name, slug, description, parent_id, "order")
VALUES
  ('映像', 'video', '動画制作と編集', (SELECT id FROM categories WHERE slug = 'creative'), 1),
  ('写真', 'photo', '写真撮影とレタッチ', (SELECT id FROM categories WHERE slug = 'creative'), 2),
  ('ゲーム', 'game', 'ゲーム制作とプレイ', (SELECT id FROM categories WHERE slug = 'creative'), 3),
  ('コンテンツ制作', 'content-creation', 'コンテンツ制作全般', (SELECT id FROM categories WHERE slug = 'creative'), 4);

-- ⑥ 仕事・キャリア（親カテゴリ）
INSERT INTO categories (name, slug, description, parent_id, "order")
VALUES
  ('仕事・キャリア', 'work-career', '働き方とキャリア形成の情報', NULL, 6);

-- 仕事・キャリアの子カテゴリ
INSERT INTO categories (name, slug, description, parent_id, "order")
VALUES
  ('副業', 'side-business', '副業の始め方と稼ぎ方', (SELECT id FROM categories WHERE slug = 'work-career'), 1),
  ('フリーランス', 'freelance', 'フリーランスの働き方', (SELECT id FROM categories WHERE slug = 'work-career'), 2),
  ('働き方', 'workstyle', '効率的な働き方', (SELECT id FROM categories WHERE slug = 'work-career'), 3),
  ('ビジネスツール', 'business-tools', '仕事に役立つツール', (SELECT id FROM categories WHERE slug = 'work-career'), 4);
