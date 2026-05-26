'use client'
import { useEffect, useState } from 'react'
import { Building2, MessageSquare } from 'lucide-react'
import s from '../dashboard.module.css'

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
    <div className={s.container}>
      <div className={s.pageHeader}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div className={s.pageIconBox}>
            <Building2 size={22} />
          </div>
          <div>
            <h1 className={s.pageTitle}>Departamentos</h1>
            <p className={s.pageSubtitle}>{queues.length} departamentos ativos</p>
          </div>
        </div>
      </div>

      <div className={s.grid2}>
        {queues.map(q => (
          <div key={q.id} className={`${s.card} ${s.cardHover}`}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 14,
                  background: `linear-gradient(135deg, ${q.color}28 0%, ${q.color}18 100%)`,
                  border: `1px solid ${q.color}40`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: `0 4px 12px ${q.color}25`,
                }}>
                  <Building2 size={20} style={{ color: q.color }} />
                </div>
                <div>
                  <div style={{ fontWeight: 700, color: '#1e293b', fontSize: '1.0625rem' }}>{q.name}</div>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 500 }}>Ordem #{q.order}</div>
                </div>
              </div>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 6,
                background: 'rgba(237, 233, 254, 0.7)',
                border: '1px solid rgba(196, 181, 253, 0.4)',
                padding: '5px 12px', borderRadius: 99,
              }}>
                <MessageSquare size={13} style={{ color: '#6366f1' }} />
                <span style={{ fontSize: '0.875rem', fontWeight: 700, color: '#4f46e5' }}>{q._count.tickets}</span>
              </div>
            </div>
            {q.greetingMessage && (
              <p style={{
                fontSize: '0.8125rem', color: '#64748b',
                background: 'rgba(244, 243, 255, 0.5)',
                border: '1px solid rgba(196, 181, 253, 0.25)',
                borderRadius: 10, padding: '8px 12px', margin: 0,
                display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}>
                {q.greetingMessage}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
