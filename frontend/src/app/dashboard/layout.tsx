'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { MessageSquare, Users, LayoutDashboard, Building2, Shield, LogOut } from 'lucide-react'

interface NavItem { href: string; label: string; icon: React.ElementType; managerOnly?: boolean; exact?: boolean }

const navItems: NavItem[] = [
  { href: '/dashboard',               label: 'Dashboard',     icon: LayoutDashboard, exact: true },
  { href: '/dashboard/atendimentos',  label: 'Atendimentos',  icon: MessageSquare },
  { href: '/dashboard/contatos',      label: 'Contatos',      icon: Users },
  { href: '/dashboard/departamentos', label: 'Departamentos', icon: Building2 },
  { href: '/dashboard/admin',         label: 'Painel Admin',  icon: Shield, managerOnly: true },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router   = useRouter()
  const [isManager, setIsManager] = useState(false)
  const [userName, setUserName]   = useState('')

  useEffect(() => {
    const stored = localStorage.getItem('user')
    if (!stored) { router.push('/auth/login'); return }
    const user = JSON.parse(stored)
    setIsManager(user.isManager || user.profileSlug === 'admin')
    setUserName(user.name?.split(' ')[0] || user.username)
  }, [router])

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    router.push('/auth/login')
  }

  const visible = navItems.filter(i => !i.managerOnly || isManager)

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-16 lg:w-60 bg-slate-900 flex flex-col py-4 shrink-0">
        {/* Logo */}
        <div className="px-3 lg:px-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center shrink-0">
              <span className="text-white font-bold text-sm">PH</span>
            </div>
            <div className="hidden lg:block">
              <div className="text-white font-semibold text-sm">PH Informática</div>
              <div className="text-slate-400 text-xs">Plataforma</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2 space-y-1">
          {visible.map(({ href, label, icon: Icon, managerOnly, exact }) => {
            const active = exact ? pathname === href : pathname.startsWith(href)
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors ${
                  active
                    ? managerOnly ? 'bg-amber-500/20 text-amber-400' : 'bg-indigo-600 text-white'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Icon size={20} className="shrink-0" />
                <span className="text-sm font-medium hidden lg:block">{label}</span>
                {managerOnly && (
                  <span className="hidden lg:block ml-auto text-xs bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded-full">
                    Admin
                  </span>
                )}
              </Link>
            )
          })}
        </nav>

        {/* Rodapé */}
        <div className="px-2 space-y-1 border-t border-slate-800 pt-3 mt-2">
          <div className="hidden lg:flex items-center gap-2 px-3 py-2">
            <div className="w-7 h-7 bg-indigo-600 rounded-full flex items-center justify-center shrink-0">
              <span className="text-white text-xs font-bold">{userName[0]?.toUpperCase()}</span>
            </div>
            <span className="text-slate-300 text-sm truncate">{userName}</span>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-colors"
          >
            <LogOut size={20} className="shrink-0" />
            <span className="text-sm font-medium hidden lg:block">Sair</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  )
}
