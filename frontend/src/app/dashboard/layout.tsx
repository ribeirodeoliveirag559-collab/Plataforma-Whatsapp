'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  MessageSquare, Users, LayoutGrid, BarChart3,
  LogOut, Settings, Building2
} from 'lucide-react'

const navItems = [
  { href: '/dashboard/atendimentos', label: 'Atendimentos', icon: MessageSquare },
  { href: '/dashboard/contatos', label: 'Contatos', icon: Users },
  { href: '/dashboard/departamentos', label: 'Departamentos', icon: Building2 },
  { href: '/dashboard/relatorios', label: 'Relatórios', icon: BarChart3 },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    router.push('/auth/login')
  }

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-16 lg:w-60 bg-slate-900 flex flex-col py-4 shrink-0">
        {/* Logo */}
        <div className="px-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center shrink-0">
              <span className="text-white font-bold text-sm">PH</span>
            </div>
            <span className="text-white font-semibold hidden lg:block">PH Informática</span>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2 space-y-1">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = pathname.startsWith(href)
            return (
              <Link
                key={href}
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
          })}
        </nav>

        {/* Bottom */}
        <div className="px-2 space-y-1">
          <Link
            href="/dashboard/configuracoes"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <Settings size={20} className="shrink-0" />
            <span className="text-sm font-medium hidden lg:block">Configurações</span>
          </Link>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-colors"
          >
            <LogOut size={20} className="shrink-0" />
            <span className="text-sm font-medium hidden lg:block">Sair</span>
          </button>
        </div>
      </aside>

      {/* Conteúdo */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  )
}
