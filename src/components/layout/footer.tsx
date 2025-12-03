import Link from 'next/link'
import { ExternalLink } from 'lucide-react'

export function Footer() {
  return (
    <footer className="border-t bg-background/50 backdrop-blur">
      <div className="container mx-auto px-4 py-12">
        {/* Top Section: Logo and Description */}
        <div className="mb-12">
          <Link href="/" className="inline-block mb-4">
            <img src="/logo.png" alt="3125 Media" className="h-8 w-auto" />
          </Link>
          <p className="text-sm text-muted-foreground max-w-md">
            最新のニュースと情報をお届けするWEBメディアです。
          </p>
        </div>

        {/* Middle Section: Links */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          {/* Navigation */}
          <div>
            <h3 className="font-medium text-sm mb-3">サイト</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/" className="text-muted-foreground hover:text-foreground transition-colors">
                  ホーム
                </Link>
              </li>
              <li>
                <Link href="/articles" className="text-muted-foreground hover:text-foreground transition-colors">
                  記事一覧
                </Link>
              </li>
              <li>
                <Link href="/categories" className="text-muted-foreground hover:text-foreground transition-colors">
                  カテゴリ
                </Link>
              </li>
            </ul>
          </div>

          {/* Related Sites */}
          <div>
            <h3 className="font-medium text-sm mb-3">関連サイト</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a
                  href="https://3125.jp"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1"
                >
                  3125HP
                  <ExternalLink className="h-3 w-3" />
                </a>
              </li>
              <li>
                <a
                  href="https://3125lab.jp"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1"
                >
                  3125LABHP
                  <ExternalLink className="h-3 w-3" />
                </a>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div className="col-span-2 md:col-span-2">
            <h3 className="font-medium text-sm mb-3">法的情報</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/privacy" className="text-muted-foreground hover:text-foreground transition-colors">
                  プライバシーポリシー
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-muted-foreground hover:text-foreground transition-colors">
                  利用規約
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-muted-foreground hover:text-foreground transition-colors">
                  お問い合わせ
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Section: Copyright */}
        <div className="pt-8 border-t">
          <p className="text-sm text-muted-foreground text-center">
            &copy; {new Date().getFullYear()} 3125 Media. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
