'use client'
import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, X, Building2 } from 'lucide-react'
import s from '../../dashboard.module.css'

interface Queue { id: number; name: string; color: string; order: number; greetingMessage: string | null; _count: { tickets: number } }

const COLORS = ['#6366f1', '#a78bfa', '#f59e0b', '#22c55e', '#ef4444', '#06b6d4', '#f97316', '#ec4899', '#8b5cf6', '#64748b']
const EMPTY = { name: '', color: '#6366f1', greetingMessage: '', order: 0 }

export default function AdminDepartamentosPage() {
  const [queues, setQueues]   = useState<Queue[]>([])
  const [modal, setModal]     = useState<'create' | 'edit' | null>(null)
  const [editing, setEditing] = useState<Queue | null>(null)
  const [form, setForm]       = useState({ ...EMPTY })
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  const token = () => localStorage.getItem('token')
  const load  = async () => {
    const q = await fetch('/api/admin/queues', { headers: { Authorization: `Bearer ${token()}` } }).then(r => r.json())
    setQueues(Array.isArray(q) ? q : [])
  }

  useEffect(() => { load() }, [])

  const openCreate = () => { setEditing(null); setForm({ ...EMPTY, order: queues.length + 1 }); setError(''); setModal('create') }
  const openEdit = (q: Queue) => {
    setEditing(q)
    setForm({ name: q.name, color: q.color, greetingMessage: q.greetingMessage || '', order: q.order })
    setError(''); setModal('edit')
  }

  const handleSave = async () => {
    setLoading(true); setError('')
    try {
      const url    = modal === 'edit' ? `/api/admin/queues/${editing!.id}` : '/api/admin/queues'
      const method = modal === 'edit' ? 'PUT' : 'POST'
      const res    = await fetch(url, { method, headers: { Authorization: `Bearer ${token()}`, 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      const data   = await res.json()
      if (!res.ok) { setError(data.error || 'Erro'); return }
      setModal(null); await load()
    } finally { setLoading(false) }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Remover este departamento?')) return
    await fetch(`/api/admin/queues/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token()}` } })
    await load()
  }

  return (
    <div className={s.container}>
      <div className={s.pageHeader}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div className={s.pageIconBox}>
            <Building2 size={22} />
          </div>
          <div>
            <h1 className={s.pageTitle}>Departamentos</h1>
            <p className={s.pageSubtitle}>{queues.length} departamentos cadastrados</p>
          </div>
        </div>
        <button onClick={openCreate} className={`${s.btn} ${s.btnPrimary}`}>
          <Plus size={16} /> Novo departamento
        </button>
      </div>

      <div className={s.grid2}>
        {queues.map(q => (
          <div key={q.id} className={`${s.card} ${s.cardCompact}`} style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 14, flexShrink: 0,
              background: `linear-gradient(135deg, ${q.color}28 0%, ${q.color}15 100%)`,
              border: `1px solid ${q.color}45`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: `0 4px 12px ${q.color}25`,
            }}>
              <span style={{ fontSize: '1.125rem', fontWeight: 700, color: q.color }}>{q.order}</span>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, color: '#1e293b', fontSize: '0.9375rem' }}>{q.name}</div>
              {q.greetingMessage && (
                <p style={{
                  fontSize: '0.75rem', color: '#64748b', margin: '4px 0 0',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>{q.greetingMessage}</p>
              )}
              <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: 4, fontWeight: 500 }}>
                {q._count.tickets} tickets totais
              </div>
            </div>
            <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
              <button onClick={() => openEdit(q)} className={s.btnIcon}><Pencil size={14} /></button>
              <button onClick={() => handleDelete(q.id)} className={`${s.btnIcon} ${s.btnIconDanger}`}><Trash2 size={14} /></button>
            </div>
          </div>
        ))}
      </div>

      {modal && (
        <div className={s.modalOverlay} onClick={() => setModal(null)}>
          <div className={s.modal} onClick={e => e.stopPropagation()}>
            <div className={s.modalHeader}>
              <h2 className={s.modalTitle}>{modal === 'create' ? 'Novo departamento' : 'Editar departamento'}</h2>
              <button onClick={() => setModal(null)} className={s.btnIcon}><X size={18} /></button>
            </div>
            <div className={s.modalBody} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {error && <div className={s.errorBox}>{error}</div>}
              <div>
                <label className={s.label}>Nome</label>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className={s.input} />
              </div>
              <div>
                <label className={s.label}>Cor</label>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {COLORS.map(c => (
                    <button key={c} type="button" onClick={() => setForm(f => ({ ...f, color: c }))}
                      style={{
                        width: 32, height: 32, borderRadius: '50%', border: 'none', cursor: 'pointer',
                        background: c,
                        transform: form.color === c ? 'scale(1.15)' : 'scale(1)',
                        boxShadow: form.color === c ? `0 0 0 3px white, 0 0 0 5px ${c}` : `0 2px 8px ${c}66`,
                        transition: 'all 0.2s ease',
                      }}
                    />
                  ))}
                </div>
              </div>
              <div>
                <label className={s.label}>Ordem</label>
                <input type="number" value={form.order} onChange={e => setForm(f => ({ ...f, order: Number(e.target.value) }))} className={s.input} />
              </div>
              <div>
                <label className={s.label}>Mensagem de saudação</label>
                <textarea value={form.greetingMessage} onChange={e => setForm(f => ({ ...f, greetingMessage: e.target.value }))} rows={3} className={s.textarea} />
              </div>
            </div>
            <div className={s.modalFooter}>
              <button onClick={() => setModal(null)} className={`${s.btn} ${s.btnGhost}`} style={{ flex: 1, justifyContent: 'center' }}>Cancelar</button>
              <button onClick={handleSave} disabled={loading} className={`${s.btn} ${s.btnPrimary}`} style={{ flex: 1, justifyContent: 'center' }}>
                {loading ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
