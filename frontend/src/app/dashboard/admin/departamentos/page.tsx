'use client'
import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, X, Building2 } from 'lucide-react'
import s from '../../dashboard.module.css'

interface Queue { id: number; name: string; color: string; order: number; greetingMessage: string | null; _count: { tickets: number } }

const EMPTY = { name: '', greetingMessage: '', color: '#6366f1', order: 0 }

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
        <div
          onClick={() => setModal(null)}
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(8px)',
            zIndex: 9999, display: 'flex', alignItems: 'flex-start',
            justifyContent: 'center', paddingTop: 100, paddingBottom: 32,
            paddingLeft: 16, paddingRight: 16, overflowY: 'auto',
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: '#fff', borderRadius: 20, width: '100%', maxWidth: 480,
              boxShadow: '0 24px 64px rgba(0,0,0,0.2)', overflow: 'hidden', flexShrink: 0,
            }}
          >
            {/* Cabeçalho */}
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h2 style={{ margin: 0, fontWeight: 700, fontSize: '1rem', color: '#1e293b' }}>
                {modal === 'create' ? 'Novo departamento' : 'Editar departamento'}
              </h2>
              <button onClick={() => setModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 4, borderRadius: 8 }}>
                <X size={20} />
              </button>
            </div>

            {/* Corpo */}
            <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
              {error && <div className={s.errorBox}>{error}</div>}
              <div>
                <label className={s.label}>Nome do departamento</label>
                <input
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className={s.input}
                  placeholder="Ex: Vendas, Suporte, Financeiro..."
                  autoFocus
                />
              </div>
              <div>
                <label className={s.label}>Descrição</label>
                <textarea
                  value={form.greetingMessage}
                  onChange={e => setForm(f => ({ ...f, greetingMessage: e.target.value }))}
                  rows={3}
                  className={s.textarea}
                  placeholder="Descreva a função deste departamento..."
                />
              </div>
            </div>

            {/* Rodapé */}
            <div style={{ padding: '16px 24px', borderTop: '1px solid #f1f5f9', display: 'flex', gap: 10 }}>
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
