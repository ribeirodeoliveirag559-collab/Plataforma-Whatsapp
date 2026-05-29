'use client'
import Link from 'next/link'
import { Users, Building2, Shield, Zap } from 'lucide-react'
import s from '../dashboard.module.css'

const cards = [
  { href: '/dashboard/admin/usuarios',         label: 'Usuários',          desc: 'Criar e gerenciar logins dos colaboradores',      icon: Users,     accent: '#6366f1' },
  { href: '/dashboard/admin/departamentos',    label: 'Departamentos',     desc: 'Adicionar e editar departamentos e filas',         icon: Building2, accent: '#22c55e' },
  { href: '/dashboard/admin/respostas-rapidas', label: 'Respostas Rápidas', desc: 'Mensagens pré-editadas acionadas com / no chat',   icon: Zap,       accent: '#7c3aed' },
]

export default function AdminPage() {
  return (
    <div className={s.container}>
      <div className={s.pageHeader}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 14,
            background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.25) 0%, rgba(245, 158, 11, 0.25) 100%)',
            border: '1px solid rgba(251, 191, 36, 0.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#d97706',
            boxShadow: '0 4px 14px rgba(245, 158, 11, 0.25)',
          }}>
            <Shield size={22} />
          </div>
          <div>
            <h1 className={s.pageTitle}>Painel Administrador</h1>
            <p className={s.pageSubtitle}>Acesso restrito a gestores</p>
          </div>
        </div>
      </div>

      <div className={s.grid2}>
        {cards.map(({ href, label, desc, icon: Icon, accent }) => (
          <Link key={href} href={href} className={`${s.card} ${s.cardHover}`} style={{ textDecoration: 'none', display: 'block' }}>
            <div style={{
              width: 52, height: 52, borderRadius: 16, marginBottom: 18,
              background: `linear-gradient(135deg, ${accent}28 0%, ${accent}15 100%)`,
              border: `1px solid ${accent}50`,
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              color: accent,
              boxShadow: `0 6px 16px ${accent}30`,
            }}>
              <Icon size={24} />
            </div>
            <h2 style={{
              fontWeight: 700, color: '#1e293b', fontSize: '1.125rem', margin: '0 0 6px 0',
              transition: 'color 0.2s ease',
            }}>{label}</h2>
            <p style={{ color: '#64748b', fontSize: '0.875rem', margin: 0 }}>{desc}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
