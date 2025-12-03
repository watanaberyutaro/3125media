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
  SheetHeader,
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
    await supabase.auth.signOut()
    setUser(null)
  }

  const navLinks = [
    { href: '/', label: 'ホーム', icon: Home },
    { href: '/articles', label: '記事一覧', icon: FileText },
    { href: '/categories', label: 'カテゴリ', icon: FolderTree },
  ]

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <img src="/logo.png" alt="3125 Media" className="h-8 w-auto" />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm font-medium transition-colors hover:text-primary ${
                  pathname === link.href ? 'text-primary' : 'text-muted-foreground'
                }`}
              >
                {link.label}
              </Link>
            ))}
            {user?.role === 'admin' && (
              <Link
                href="/admin"
                className={`text-sm font-medium transition-colors hover:text-primary ${
                  pathname.startsWith('/admin') ? 'text-primary' : 'text-muted-foreground'
                }`}
              >
                管理画面
              </Link>
            )}
          </nav>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.avatar_url || undefined} alt={user.name} />
                      <AvatarFallback>{user.name.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <div className="flex items-center justify-start gap-2 p-2">
                    <div className="flex flex-col space-y-1 leading-none">
                      <p className="font-medium">{user.name}</p>
                      <p className="w-[200px] truncate text-sm text-muted-foreground">
                        {user.email}
                      </p>
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  {user.role === 'admin' && (
                    <>
                      <DropdownMenuItem asChild>
                        <Link href="/admin">管理画面</Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                    </>
                  )}
                  <DropdownMenuItem asChild>
                    <Link href="/profile">
                      <User className="mr-2 h-4 w-4" />
                      プロフィール
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    ログアウト
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="hidden md:flex items-center space-x-2">
                <Button variant="ghost" asChild>
                  <Link href="/login">ログイン</Link>
                </Button>
                <Button asChild>
                  <Link href="/register">登録</Link>
                </Button>
              </div>
            )}

            {/* Mobile Menu Sheet */}
            {mounted ? (
              <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
                <SheetTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="md:hidden"
                  >
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[280px] sm:w-[320px]">
                <SheetHeader>
                  <SheetTitle className="text-left">
                    <Link href="/" onClick={() => setIsMenuOpen(false)} className="flex items-center">
                      <img src="/logo.png" alt="3125 Media" className="h-8 w-auto" />
                    </Link>
                  </SheetTitle>
                </SheetHeader>

                <nav className="flex flex-col gap-4 mt-8">
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

                  {user?.role === 'admin' && (
                    <Link
                      href="/admin"
                      className={`flex items-center gap-3 px-3 py-3 rounded-md text-sm font-medium transition-colors ${
                        pathname.startsWith('/admin')
                          ? 'bg-primary text-primary-foreground'
                          : 'hover:bg-muted'
                      }`}
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <User className="h-5 w-5" />
                      管理画面
                    </Link>
                  )}

                  <div className="border-t pt-4 mt-4">
                    {user ? (
                      <>
                        <div className="px-3 py-2 mb-2">
                          <p className="text-sm font-medium">{user.name}</p>
                          <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                        </div>
                        <Button
                          variant="ghost"
                          className="w-full justify-start gap-3"
                          onClick={() => {
                            handleLogout()
                            setIsMenuOpen(false)
                          }}
                        >
                          <LogOut className="h-5 w-5" />
                          ログアウト
                        </Button>
                      </>
                    ) : (
                      <div className="flex flex-col gap-2">
                        <Button variant="outline" className="w-full" asChild>
                          <Link href="/login" onClick={() => setIsMenuOpen(false)}>
                            ログイン
                          </Link>
                        </Button>
                        <Button className="w-full" asChild>
                          <Link href="/register" onClick={() => setIsMenuOpen(false)}>
                            登録
                          </Link>
                        </Button>
                      </div>
                    )}
                  </div>
                </nav>
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
