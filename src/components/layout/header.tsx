'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, User, LogOut, Home, FileText, FolderTree } from 'lucide-react'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import type { User as UserType } from '@/types/database'

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [user, setUser] = useState<UserType | null>(null)
  const [mounted, setMounted] = useState(false)
  const pathname = usePathname()
  const supabase = createClient()

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    let isMounted = true

    const getUser = async () => {
      try {
        // First, try to get the session from cookies
        const { data: { session } } = await supabase.auth.getSession()

        if (!isMounted) return

        if (session?.user) {
          const { data } = await supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .single()

          if (isMounted) {
            setUser(data)
          }
        } else {
          if (isMounted) {
            setUser(null)
          }
        }
      } catch (error) {
        console.error('Failed to get user:', error)
        if (isMounted) {
          setUser(null)
        }
      }
    }

    getUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return

      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        if (session?.user) {
          const { data } = await supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .single()

          if (isMounted) {
            setUser(data)
          }
        }
      } else if (event === 'SIGNED_OUT') {
        if (isMounted) {
          setUser(null)
        }
      }
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [supabase])

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
      setUser(null)
      // Force a hard navigation to clear all state
      window.location.href = '/'
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  const navLinks = [
    { href: '/', label: 'ホーム', icon: Home },
    { href: '/articles', label: '記事一覧', icon: FileText },
  ]

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
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <img src="/logo.png" alt="3125 Media" className="h-8 w-auto" />
          </Link>

          {/* Desktop Navigation - Hidden, using hamburger menu instead */}

          {/* Hamburger Menu Button - Always visible */}
          <div className="flex items-center">
            {mounted ? (
              <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
                <SheetTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                  >
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-full sm:w-[90%] md:w-[50%] lg:w-[40%] p-0 flex flex-col h-full overflow-hidden">
                <SheetTitle className="sr-only">ナビゲーションメニュー</SheetTitle>
                {/* Header with Logo and User Info */}
                <div className="px-6 py-4 border-b bg-muted/30">
                  <Link href="/" onClick={() => setIsMenuOpen(false)} className="flex items-center mb-4">
                    <img src="/logo.png" alt="3125 Media" className="h-10 w-auto" />
                  </Link>

                  {/* User Info at Top */}
                  {user ? (
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-background border">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={user.avatar_url || undefined} alt={user.name} />
                        <AvatarFallback className="text-lg">{user.name.charAt(0).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold truncate">{user.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                        {user.role === 'admin' && (
                          <span className="inline-block mt-1 px-2 py-0.5 text-xs bg-primary text-primary-foreground rounded">
                            管理者
                          </span>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2">
                      <Button className="w-full" asChild>
                        <Link href="/login" onClick={() => setIsMenuOpen(false)}>
                          ログイン
                        </Link>
                      </Button>
                      <Button variant="outline" className="w-full" asChild>
                        <Link href="/register" onClick={() => setIsMenuOpen(false)}>
                          新規登録
                        </Link>
                      </Button>
                    </div>
                  )}
                </div>

                <nav className="flex-1 overflow-y-auto px-6 py-6 flex flex-col gap-6">
                  {navLinks.map((link) => {
                    const Icon = link.icon
                    return (
                      <Link
                        key={link.href}
                        href={link.href}
                        className={`flex items-center gap-3 px-3 py-3 rounded-md text-sm font-medium transition-colors ${
                          pathname === link.href
                            ? 'bg-primary text-primary-foreground'
                            : 'hover:bg-muted'
                        }`}
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <Icon className="h-5 w-5" />
                        {link.label}
                      </Link>
                    )
                  })}

                  {/* Categories Section */}
                  <div className="border-t pt-6">
                    <div className="px-3 py-2 text-sm font-semibold text-muted-foreground mb-3">
                      カテゴリ
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      {categories.map((category) => (
                        <div key={category.slug}>
                          <Link
                            href={`/categories/${category.slug}`}
                            className="block px-3 py-2 rounded-md text-sm font-medium hover:bg-muted"
                            onClick={() => setIsMenuOpen(false)}
                          >
                            {category.name}
                          </Link>
                          <div className="mt-1 space-y-1 pl-3">
                            {category.items.map((item) => (
                              <Link
                                key={item.slug}
                                href={`/categories/${item.slug}`}
                                className="block px-2 py-1 text-xs text-muted-foreground hover:text-foreground"
                                onClick={() => setIsMenuOpen(false)}
                              >
                                {item.name}
                              </Link>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Admin Section */}
                  {user?.role === 'admin' && (
                    <div className="border-t pt-6">
                      <div className="flex items-center gap-2 mb-3">
                        <User className="h-5 w-5 text-primary" />
                        <h3 className="text-base font-bold">管理者メニュー</h3>
                      </div>
                      <Link
                        href="/admin"
                        className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors border ${
                          pathname.startsWith('/admin')
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'hover:bg-muted border-border'
                        }`}
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <User className="h-5 w-5" />
                        管理画面
                      </Link>
                    </div>
                  )}
                </nav>

                {/* User Actions Footer */}
                {user && (
                  <div className="border-t px-6 py-4 bg-muted/30">
                    <div className="flex flex-col gap-2">
                      <Link
                        href="/profile"
                        className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium hover:bg-background border border-transparent hover:border-border transition-all"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <User className="h-5 w-5" />
                        プロフィール設定
                      </Link>
                      <Button
                        variant="ghost"
                        className="w-full justify-start gap-3 h-auto py-3 hover:bg-background border border-transparent hover:border-border"
                        onClick={() => {
                          handleLogout()
                          setIsMenuOpen(false)
                        }}
                      >
                        <LogOut className="h-5 w-5" />
                        ログアウト
                      </Button>
                    </div>
                  </div>
                )}
              </SheetContent>
              </Sheet>
            ) : (
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                disabled
              >
                <Menu className="h-5 w-5" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
