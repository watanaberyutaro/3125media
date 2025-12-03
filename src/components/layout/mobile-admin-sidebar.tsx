'use client'

import { useState } from 'react'
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
  Menu,
  X,
  Sparkles,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'

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
    title: 'AI使用量',
    href: '/admin/ai-usage',
    icon: Sparkles,
  },
  {
    title: '設定',
    href: '/admin/settings',
    icon: Settings,
  },
]

export function MobileAdminSidebar() {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="p-6 border-b">
        <Link href="/admin" className="text-xl font-bold" onClick={() => setOpen(false)}>
          3125 Media
        </Link>
        <p className="text-xs text-muted-foreground mt-1">管理画面</p>
      </div>

      <nav className="flex-1 p-4 overflow-y-auto">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href ||
              (item.href !== '/admin' && pathname.startsWith(item.href))

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    'flex items-center gap-3 px-3 py-3 rounded-md text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  )}
                >
                  <item.icon className="h-5 w-5" />
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
          onClick={() => setOpen(false)}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors px-3 py-2"
        >
          <ArrowLeft className="h-4 w-4" />
          サイトに戻る
        </Link>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 min-h-screen bg-background border-r flex-col">
        <SidebarContent />
      </aside>

      {/* Mobile Header with Hamburger */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-background border-b">
        <div className="flex items-center justify-between p-4">
          <Link href="/admin" className="text-lg font-bold">
            3125 Media
          </Link>
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-[280px]">
              <SidebarContent />
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </>
  )
}
