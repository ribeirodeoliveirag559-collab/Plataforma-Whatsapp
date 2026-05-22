'use client'
import Link from 'next/link'
import { Users, Building2, Shield } from 'lucide-react'

const cards = [
  { href: '/dashboard/admin/usuarios',     label: 'Usuários',      desc: 'Criar e gerenciar logins dos colaboradores', icon: Users,     color: 'bg-indigo-50 text-indigo-600' },
  { href: '/dashboard/admin/departamentos',label: 'Departamentos', desc: 'Adicionar e editar departamentos e filas',    icon: Building2, color: 'bg-green-50 text-green-600'   },
]

export default function AdminPage() {
  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
          <Shield size={20} className="text-amber-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Painel Administrador</h1>
          <p className="text-slate-500 text-sm">Acesso restrito a gestores</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {cards.map(({ href, label, desc, icon: Icon, color }) => (
          <Link key={href} href={href}
            className="bg-white rounded-2xl border border-slate-200 p-6 hover:shadow-md hover:border-indigo-200 transition-all group">
            <div className={`inline-flex p-3 rounded-xl ${color} mb-4`}>
              <Icon size={22} />
            </div>
            <h2 className="font-semibold text-slate-800 text-lg mb-1 group-hover:text-indigo-600 transition-colors">{label}</h2>
            <p className="text-slate-500 text-sm">{desc}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
