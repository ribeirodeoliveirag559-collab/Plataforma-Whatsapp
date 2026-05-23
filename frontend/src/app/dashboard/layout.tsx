'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { MessageSquare, Users, LayoutDashboard, Shield, LogOut } from 'lucide-react'
import { LOGO_BASE64 } from '@/lib/logo'

interface NavItem { href: string; label: string; icon: React.ElementType; exact?: boolean }

// Nav principal — sem Departamentos
const mainNav: NavItem[] = [
  { href: '/dashboard',              label: 'Dashboard',    icon: LayoutDashboard, exact: true },
  { href: '/dashboard/atendimentos', label: 'Atendimentos', icon: MessageSquare },
  { href: '/dashboard/contatos',     label: 'Contatos',     icon: Users },
]

const adminItem: NavItem = { href: '/dashboard/admin', label: 'Painel Admin', icon: Shield }

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

  const NavLink = ({ href, label, icon: Icon, exact }: NavItem) => {
    const active = exact ? pathname === href : pathname.startsWith(href)
    return (
      <Link
        href={href}
        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors ${
          active
            ? 'bg-indigo-600 text-white'
            : 'text-slate-400 hover:bg-slate-800 hover:text-white'
        }`}
      >
        <Icon size={20} className="shrink-0" />
        <span className="text-sm font-medium hidden lg:block">{label}</span>
      </Link>
    )
  }

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden">
      <aside className="w-16 lg:w-60 bg-slate-900 flex flex-col py-4 shrink-0">

        {/* Logo */}
        <div className="px-3 lg:px-4 mb-8">
          <div className="hidden lg:flex items-center justify-center">
            <div className="bg-white rounded-2xl px-3 py-2">
              <img src={LOGO_BASE64} alt="PH Informática" style={{ height: '52px', width: 'auto' }} />
            </div>
          </div>
          <div className="flex lg:hidden items-center justify-center">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center">
              <img src={LOGO_BASE64} alt="PH" style={{ height: '32px', width: '32px', objectFit: 'contain' }} />
            </div>
          </div>
        </div>

        {/* Nav principal */}
        <nav className="flex-1 px-2 space-y-1">
          {mainNav.map(item => <NavLink key={item.href} {...item} />)}
        </nav>

        {/* Rodapé: Painel Admin (gestores) + usuário + sair */}
        <div className="px-2 space-y-1 border-t border-slate-800 pt-3 mt-2">
          {isManager && <NavLink {...adminItem} />}

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
