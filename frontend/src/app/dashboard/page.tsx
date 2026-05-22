'use client'
import { useEffect, useState } from 'react'
import { MessageSquare, Clock, CheckCircle, TrendingUp } from 'lucide-react'

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
    <div className="p-6 flex items-center justify-center h-64">
      <div className="animate-spin w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full" />
    </div>
  )

  const cards = [
    { label: 'Aguardando IA',     value: data.pending,      icon: Clock,        color: 'text-amber-500',  bg: 'bg-amber-50'  },
    { label: 'Em atendimento',    value: data.open,         icon: MessageSquare,color: 'text-indigo-500', bg: 'bg-indigo-50' },
    { label: 'Encerrados hoje',   value: data.closedToday,  icon: CheckCircle,  color: 'text-green-500',  bg: 'bg-green-50'  },
    { label: 'Encerrados no mês', value: data.closedMonth,  icon: TrendingUp,   color: 'text-purple-500', bg: 'bg-purple-50' },
  ]

  // Calcular o valor máximo para normalizar as barras
  const maxVal = Math.max(
    1,
    ...data.monthlyData.flatMap(m =>
      Object.keys(CATEGORY_COLORS).map(k => (m[k] as number) || 0)
    )
  )

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
        <p className="text-slate-500 text-sm mt-1">Visão geral dos atendimentos em tempo real</p>
      </div>

      {/* Cards resumo */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-white rounded-2xl border border-slate-200 p-5">
            <div className={`inline-flex p-2 rounded-xl ${bg} mb-3`}>
              <Icon size={20} className={color} />
            </div>
            <div className="text-3xl font-bold text-slate-800">{value}</div>
            <div className="text-slate-500 text-sm mt-1">{label}</div>
          </div>
        ))}
      </div>

      {/* Gráfico mensal por categoria */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="font-semibold text-slate-800">Atendimentos por categoria — últimos 6 meses</h2>
            <p className="text-xs text-slate-400 mt-0.5">Suporte · Vendas · Assistência Técnica · Financeiro</p>
          </div>
          {/* Legenda */}
          <div className="hidden sm:flex flex-wrap gap-3">
            {Object.entries(CATEGORY_COLORS).map(([cat, color]) => (
              <div key={cat} className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
                <span className="text-xs text-slate-500">{cat}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Barras agrupadas */}
        <div className="flex items-end gap-3 h-48 overflow-x-auto pb-2">
          {data.monthlyData.map((month) => (
            <div key={month.label} className="flex-1 min-w-[60px]">
              <div className="flex items-end gap-0.5 h-40 mb-2">
                {Object.entries(CATEGORY_COLORS).map(([cat, color]) => {
                  const val = (month as Record<string, unknown>)[cat] as number || 0
                  const height = maxVal > 0 ? Math.max(val > 0 ? 4 : 0, (val / maxVal) * 100) : 0
                  return (
                    <div key={cat} className="flex-1 flex flex-col justify-end group relative">
                      {val > 0 && (
                        <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-xs px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                          {cat}: {val}
                        </div>
                      )}
                      <div
                        className="w-full rounded-t transition-all duration-500"
                        style={{ height: `${height}%`, backgroundColor: color, opacity: val > 0 ? 1 : 0.15 }}
                      />
                    </div>
                  )
                })}
              </div>
              <div className="text-xs text-slate-400 text-center capitalize">{month.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Mês atual por categoria + Departamentos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Mês atual */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <h2 className="font-semibold text-slate-800 mb-4">Este mês por categoria</h2>
          <div className="space-y-3">
            {data.currentMonthByCategory.map(({ category, count }) => {
              const color = CATEGORY_COLORS[category] || '#94a3b8'
              const total = data.currentMonthByCategory.reduce((s, c) => s + c.count, 0)
              const pct = total > 0 ? Math.round((count / total) * 100) : 0
              return (
                <div key={category}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-700 font-medium">{category}</span>
                    <span className="text-slate-500">{count} <span className="text-xs">({pct}%)</span></span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, backgroundColor: color }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Em aberto por departamento */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <h2 className="font-semibold text-slate-800 mb-4">Em aberto por departamento</h2>
          <div className="space-y-2">
            {data.byQueue.map(q => (
              <div key={q.id} className="flex items-center gap-3 py-1">
                <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: q.color }} />
                <span className="flex-1 text-sm text-slate-700 truncate">{q.name}</span>
                <span className="text-sm font-semibold text-slate-800 bg-slate-100 px-2.5 py-0.5 rounded-lg min-w-[32px] text-center">
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
