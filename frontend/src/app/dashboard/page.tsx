'use client'
import { useEffect, useState } from 'react'
import { MessageSquare, Clock, CheckCircle, TrendingUp, LayoutDashboard } from 'lucide-react'
import s from './dashboard.module.css'

type MonthData = {
  label: string
  [key: string]: string | number
}

interface CategoryMonth { category: string; count: number }

interface DashboardData {
  pending: number
  open: number
  closedToday: number
  closedMonth: number
  monthlyData: MonthData[]
  currentMonthByCategory: CategoryMonth[]
  byQueue: { id: number; name: string; color: string; _count: { tickets: number } }[]
}

const CATEGORY_COLORS: Record<string, string> = {
  'Vendas':              '#f59e0b',
  'Suporte':             '#6366f1',
  'Assistência Técnica': '#22c55e',
  'Financeiro':          '#ef4444',
  'Outros':              '#94a3b8',
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)

  useEffect(() => {
    const token = localStorage.getItem('token')
    fetch('/api/dashboard', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(setData)
  }, [])

  if (!data) return (
    <div className={s.spinnerWrap}><div className={s.spinner} /></div>
  )

  const cards = [
    { label: 'Aguardando IA',     value: data.pending,     icon: Clock,         tint: '#f59e0b', bg: 'rgba(254, 215, 170, 0.4)' },
    { label: 'Em atendimento',    value: data.open,        icon: MessageSquare, tint: '#6366f1', bg: 'rgba(196, 181, 253, 0.35)' },
    { label: 'Encerrados hoje',   value: data.closedToday, icon: CheckCircle,   tint: '#22c55e', bg: 'rgba(187, 247, 208, 0.5)' },
    { label: 'Encerrados no mês', value: data.closedMonth, icon: TrendingUp,    tint: '#a78bfa', bg: 'rgba(237, 233, 254, 0.7)' },
  ]

  const maxVal = Math.max(
    1,
    ...data.monthlyData.flatMap(m =>
      Object.keys(CATEGORY_COLORS).map(k => (m[k] as number) || 0)
    )
  )

  return (
    <div className={s.container}>
      {/* Header */}
      <div className={s.pageHeader}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div className={s.pageIconBox}>
            <LayoutDashboard size={22} />
          </div>
          <div>
            <h1 className={s.pageTitle}>Dashboard</h1>
            <p className={s.pageSubtitle}>Visão geral dos atendimentos em tempo real</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className={s.grid4}>
        {cards.map(({ label, value, icon: Icon, tint, bg }) => (
          <div key={label} className={`${s.card} ${s.cardHover} ${s.cardCompact}`}>
            <div className={s.statIcon} style={{ background: bg, color: tint }}>
              <Icon size={20} />
            </div>
            <div className={s.statValue}>{value}</div>
            <div className={s.statLabel}>{label}</div>
          </div>
        ))}
      </div>

      {/* Gráfico mensal */}
      <div className={s.card}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h2 style={{ fontWeight: 700, color: '#1e293b', margin: 0, fontSize: '1rem' }}>Atendimentos por categoria — últimos 6 meses</h2>
            <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: 4 }}>Visualize a evolução por departamento</p>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
            {Object.entries(CATEGORY_COLORS).map(([cat, color]) => (
              <div key={cat} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: color }} />
                <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 500 }}>{cat}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, height: 200, overflowX: 'auto', paddingBottom: 8 }}>
          {data.monthlyData.map((month) => (
            <div key={month.label} style={{ flex: 1, minWidth: 60 }}>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 160, marginBottom: 8 }}>
                {Object.entries(CATEGORY_COLORS).map(([cat, color]) => {
                  const val = (month as Record<string, unknown>)[cat] as number || 0
                  const height = maxVal > 0 ? Math.max(val > 0 ? 4 : 0, (val / maxVal) * 100) : 0
                  return (
                    <div key={cat} style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', position: 'relative' }} title={`${cat}: ${val}`}>
                      <div
                        style={{
                          height: `${height}%`,
                          background: `linear-gradient(180deg, ${color} 0%, ${color}cc 100%)`,
                          opacity: val > 0 ? 1 : 0.12,
                          borderRadius: '4px 4px 0 0',
                          boxShadow: val > 0 ? `0 -1px 8px ${color}55` : 'none',
                          transition: 'all 0.5s',
                        }}
                      />
                    </div>
                  )
                })}
              </div>
              <div style={{ fontSize: '0.7rem', color: '#94a3b8', textAlign: 'center', textTransform: 'capitalize', fontWeight: 500 }}>{month.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Mês atual + por departamento */}
      <div className={s.grid2}>
        <div className={s.card}>
          <h2 style={{ fontWeight: 700, color: '#1e293b', margin: 0, marginBottom: 16, fontSize: '0.9375rem' }}>Este mês por categoria</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {data.currentMonthByCategory.map(({ category, count }) => {
              const color = CATEGORY_COLORS[category] || '#94a3b8'
              const total = data.currentMonthByCategory.reduce((s, c) => s + c.count, 0)
              const pct = total > 0 ? Math.round((count / total) * 100) : 0
              return (
                <div key={category}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginBottom: 6 }}>
                    <span style={{ color: '#334155', fontWeight: 600 }}>{category}</span>
                    <span style={{ color: '#64748b' }}>{count} <span style={{ fontSize: '0.75rem' }}>({pct}%)</span></span>
                  </div>
                  <div style={{ height: 8, background: 'rgba(226, 232, 240, 0.5)', borderRadius: 99, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: `linear-gradient(90deg, ${color} 0%, ${color}cc 100%)`, transition: 'width 0.7s', boxShadow: `0 0 12px ${color}55` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className={s.card}>
          <h2 style={{ fontWeight: 700, color: '#1e293b', margin: 0, marginBottom: 16, fontSize: '0.9375rem' }}>Em aberto por departamento</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {data.byQueue.map(q => (
              <div key={q.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '6px 0' }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: q.color, flexShrink: 0, boxShadow: `0 0 8px ${q.color}88` }} />
                <span style={{ flex: 1, fontSize: '0.875rem', color: '#334155', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{q.name}</span>
                <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#1e293b', background: 'rgba(237, 233, 254, 0.7)', border: '1px solid rgba(196, 181, 253, 0.4)', padding: '3px 12px', borderRadius: 99, minWidth: 36, textAlign: 'center' }}>
                  {q._count.tickets}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
