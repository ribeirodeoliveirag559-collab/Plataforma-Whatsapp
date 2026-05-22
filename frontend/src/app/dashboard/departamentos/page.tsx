'use client'
import { useEffect, useState } from 'react'
import { Building2, MessageSquare } from 'lucide-react'

interface Queue {
  id: number; name: string; color: string; order: number
  greetingMessage: string | null
  _count: { tickets: number }
}

export default function DepartamentosPage() {
  const [queues, setQueues] = useState<Queue[]>([])

  useEffect(() => {
    const token = localStorage.getItem('token')
    fetch('/api/queues', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(setQueues)
  }, [])

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Departamentos</h1>
        <p className="text-slate-500 text-sm mt-1">{queues.length} departamentos ativos</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {queues.map(q => (
          <div key={q.id} className="bg-white rounded-2xl border border-slate-200 p-5">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: q.color + '20' }}>
                  <Building2 size={18} style={{ color: q.color }} />
                </div>
                <div>
                  <div className="font-semibold text-slate-800">{q.name}</div>
                  <div className="text-xs text-slate-400">Ordem #{q.order}</div>
                </div>
              </div>
              <div className="flex items-center gap-1.5 bg-slate-100 px-3 py-1 rounded-full">
                <MessageSquare size={13} className="text-slate-500" />
                <span className="text-sm font-semibold text-slate-700">{q._count.tickets}</span>
              </div>
            </div>
            {q.greetingMessage && (
              <p className="text-xs text-slate-500 line-clamp-2 bg-slate-50 rounded-lg p-2">
                {q.greetingMessage}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
