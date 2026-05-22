'use client'
import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, X } from 'lucide-react'

interface Queue { id: number; name: string; color: string; order: number; greetingMessage: string | null; _count: { tickets: number } }

const COLORS = ['#6366f1','#f59e0b','#22c55e','#ef4444','#06b6d4','#f97316','#ec4899','#8b5cf6','#64748b']
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
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Departamentos</h1>
          <p className="text-slate-500 text-sm mt-1">{queues.length} departamentos cadastrados</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors">
          <Plus size={16} /> Novo departamento
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {queues.map(q => (
          <div key={q.id} className="bg-white rounded-2xl border border-slate-200 p-4 flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: q.color + '20' }}>
              <span className="text-lg font-bold" style={{ color: q.color }}>{q.order}</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-slate-800">{q.name}</div>
              {q.greetingMessage && <p className="text-xs text-slate-400 truncate mt-0.5">{q.greetingMessage}</p>}
              <div className="text-xs text-slate-400 mt-1">{q._count.tickets} tickets totais</div>
            </div>
            <div className="flex gap-1 shrink-0">
              <button onClick={() => openEdit(q)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors">
                <Pencil size={14} />
              </button>
              <button onClick={() => handleDelete(q.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors">
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {modal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h2 className="font-semibold text-slate-800">{modal === 'create' ? 'Novo departamento' : 'Editar departamento'}</h2>
              <button onClick={() => setModal(null)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400"><X size={18} /></button>
            </div>
            <div className="p-6 space-y-4">
              {error && <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-3 py-2">{error}</div>}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nome</label>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Cor</label>
                <div className="flex gap-2 flex-wrap">
                  {COLORS.map(c => (
                    <button key={c} onClick={() => setForm(f => ({ ...f, color: c }))}
                      className={`w-7 h-7 rounded-full transition-all ${form.color === c ? 'ring-2 ring-offset-2 ring-slate-400 scale-110' : ''}`}
                      style={{ backgroundColor: c }} />
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Ordem</label>
                <input type="number" value={form.order} onChange={e => setForm(f => ({ ...f, order: Number(e.target.value) }))}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Mensagem de saudação</label>
                <textarea value={form.greetingMessage} onChange={e => setForm(f => ({ ...f, greetingMessage: e.target.value }))} rows={3}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
              </div>
            </div>
            <div className="flex gap-3 p-6 border-t border-slate-100">
              <button onClick={() => setModal(null)} className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-600 hover:bg-slate-50">Cancelar</button>
              <button onClick={handleSave} disabled={loading} className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-sm font-medium">
                {loading ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
