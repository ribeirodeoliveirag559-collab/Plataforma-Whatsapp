'use client'
import { useEffect, useState } from 'react'
import { MessageSquare, Clock, CheckCircle, TrendingUp } from 'lucide-react'

interface DashboardData {
  pending: number
  open: number
  closedToday: number
  closedMonth: number
  byQueue: { id: number; name: string; color: string; _count: { tickets: number } }[]
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)

  useEffect(() => {
    const token = localStorage.getItem('token')
    fetch('/api/dashboard', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(setData)
  }, [])

  if (!data) return <div className="p-6 flex items-center justify-center"><div className="animate-spin w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full" /></div>

  const cards = [
    { label: 'Aguardando', value: data.pending, icon: Clock, color: 'text-amber-500', bg: 'bg-amber-50' },
    { label: 'Em atendimento', value: data.open, icon: MessageSquare, color: 'text-indigo-500', bg: 'bg-indigo-50' },
    { label: 'Encerrados hoje', value: data.closedToday, icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-50' },
    { label: 'Encerrados no mês', value: data.closedMonth, icon: TrendingUp, color: 'text-purple-500', bg: 'bg-purple-50' },
  ]

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
        <p className="text-slate-500 text-sm mt-1">Visão geral dos atendimentos</p>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
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

      {/* Por departamento */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <h2 className="font-semibold text-slate-800 mb-4">Atendimentos em aberto por departamento</h2>
        <div className="space-y-3">
          {data.byQueue.map(q => (
            <div key={q.id} className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: q.color }} />
              <span className="flex-1 text-sm text-slate-700">{q.name}</span>
              <span className="text-sm font-semibold text-slate-800 bg-slate-100 px-2 py-0.5 rounded-lg">
                {q._count.tickets}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
