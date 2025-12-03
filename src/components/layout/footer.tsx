import Link from 'next/link'
import { ExternalLink } from 'lucide-react'

export function Footer() {
  const categories = [
    {
      name: 'ガジェット',
      slug: 'gadget',
      items: [
        { name: 'PC・スマホ', slug: 'pc-smartphone' },
        { name: 'カメラ', slug: 'camera' },
        { name: '周辺機器', slug: 'peripherals' },
        { name: 'アクセサリー', slug: 'accessories' },
      ],
    },
    {
      name: 'テクノロジー',
      slug: 'technology',
      items: [
        { name: 'AI', slug: 'ai' },
        { name: 'クラウド', slug: 'cloud' },
        { name: 'ロボット', slug: 'robot' },
        { name: 'アプリ・ツール', slug: 'apps-tools' },
      ],
    },
    {
      name: 'ライフスタイル',
      slug: 'lifestyle',
      items: [
        { name: '日記', slug: 'diary' },
        { name: 'ワークスペース', slug: 'workspace' },
        { name: 'ミニマリズム', slug: 'minimalism' },
      ],
    },
    {
      name: '便利・暮らし改善',
      slug: 'life-improvement',
      items: [
        { name: '家具', slug: 'furniture' },
        { name: '家電', slug: 'appliances' },
        { name: 'サービス', slug: 'services' },
        { name: 'ライフハック', slug: 'lifehack' },
      ],
    },
    {
      name: 'クリエイティブ',
      slug: 'creative',
      items: [
        { name: '映像', slug: 'video' },
        { name: '写真', slug: 'photo' },
        { name: 'ゲーム', slug: 'game' },
        { name: 'コンテンツ制作', slug: 'content-creation' },
      ],
    },
    {
      name: '仕事・キャリア',
      slug: 'work-career',
      items: [
        { name: '副業', slug: 'side-business' },
        { name: 'フリーランス', slug: 'freelance' },
        { name: '働き方', slug: 'workstyle' },
        { name: 'ビジネスツール', slug: 'business-tools' },
      ],
    },
  ]

  return (
    <footer className="border-t bg-muted/30">
      <div className="container mx-auto px-4 py-12">
        {/* Categories Section */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 mb-12">
          {categories.map((category) => (
            <div key={category.slug}>
              <h3 className="font-semibold text-sm mb-4">
                <Link
                  href={`/categories/${category.slug}`}
                  className="hover:text-primary transition-colors"
                >
                  {category.name}
                </Link>
              </h3>
              <ul className="space-y-2">
                {category.items.map((item) => (
                  <li key={item.slug}>
                    <Link
                      href={`/categories/${item.slug}`}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Section */}
        <div className="pt-8 border-t">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            {/* Logo */}
            <div className="flex items-center gap-8">
              <Link href="/" className="inline-block">
                <img src="/logo.png" alt="3125 Media" className="h-6 w-auto" />
              </Link>
              <div className="flex gap-4 text-sm">
                <Link href="/privacy" className="text-muted-foreground hover:text-foreground transition-colors">
                  プライバシーポリシー
                </Link>
                <Link href="/terms" className="text-muted-foreground hover:text-foreground transition-colors">
                  利用規約
                </Link>
                <Link href="/contact" className="text-muted-foreground hover:text-foreground transition-colors">
                  お問い合わせ
                </Link>
              </div>
            </div>

            {/* Related Sites & Copyright */}
            <div className="flex flex-col md:flex-row items-center gap-4 text-sm">
              <div className="flex gap-4">
                <a
                  href="https://3125.jp"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1"
                >
                  3125HP
                  <ExternalLink className="h-3 w-3" />
                </a>
                <a
                  href="https://3125lab.jp"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1"
                >
                  3125LABHP
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
              <p className="text-muted-foreground">
                &copy; {new Date().getFullYear()} 3125 Media
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
