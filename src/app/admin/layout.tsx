import { MobileAdminSidebar } from '@/components/layout/mobile-admin-sidebar'

export const metadata = {
  title: '管理画面',
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen">
      <MobileAdminSidebar />
      <main className="flex-1 p-4 md:p-8 bg-muted/30 pt-20 md:pt-8">
        {children}
      </main>
    </div>
  )
}
