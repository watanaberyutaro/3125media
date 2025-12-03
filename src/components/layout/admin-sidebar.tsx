'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  FileText,
  FolderTree,
  Tags,
  MessageSquare,
  BarChart3,
  Settings,
  ArrowLeft,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  {
    title: 'ダッシュボード',
    href: '/admin',
    icon: LayoutDashboard,
  },
  {
    title: '記事管理',
    href: '/admin/articles',
    icon: FileText,
  },
  {
    title: 'カテゴリ管理',
    href: '/admin/categories',
    icon: FolderTree,
  },
  {
    title: 'タグ管理',
    href: '/admin/tags',
    icon: Tags,
  },
  {
    title: 'コメント管理',
    href: '/admin/comments',
    icon: MessageSquare,
  },
  {
    title: 'アナリティクス',
    href: '/admin/analytics',
    icon: BarChart3,
  },
  {
    title: '設定',
    href: '/admin/settings',
    icon: Settings,
  },
]

export function AdminSidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-64 min-h-screen bg-background border-r flex flex-col">
      <div className="p-4 border-b">
        <Link href="/admin" className="text-xl font-bold">
          3125 Media
        </Link>
        <p className="text-xs text-muted-foreground mt-1">管理画面</p>
      </div>

      <nav className="flex-1 p-4">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href ||
              (item.href !== '/admin' && pathname.startsWith(item.href))

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.title}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      <div className="p-4 border-t">
        <Link
          href="/"
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          サイトに戻る
        </Link>
      </div>
    </aside>
  )
}
