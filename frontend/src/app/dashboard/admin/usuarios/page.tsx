'use client'
import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, X, Check, ShieldCheck, User } from 'lucide-react'

interface Queue { id: number; name: string; color: string }
interface UserData {
  id: number; name: string; username: string; email: string | null
  profileSlug: string; active: boolean; isManager: boolean
  defaultQueueId: number | null
  defaultQueue: { id: number; name: string; color: string } | null
  createdAt: string
}

const EMPTY_FORM = { name: '', username: '', email: '', password: '', profileSlug: 'user', isManager: false, defaultQueueId: '' }

export default function UsuariosPage() {
  const [users, setUsers]   = useState<UserData[]>([])
  const [queues, setQueues] = useState<Queue[]>([])
  const [modal, setModal]   = useState<'create' | 'edit' | null>(null)
  const [editing, setEditing] = useState<UserData | null>(null)
  const [form, setForm]     = useState({ ...EMPTY_FORM })
  const [loading, setLoading] = useState(false)
  const [error, setError]   = useState('')

  const token = () => localStorage.getItem('token')

  const load = async () => {
    const [u, q] = await Promise.all([
      fetch('/api/admin/users',  { headers: { Authorization: `Bearer ${token()}` } }).then(r => r.json()),
      fetch('/api/admin/queues', { headers: { Authorization: `Bearer ${token()}` } }).then(r => r.json()),
    ])
    setUsers(u.users || [])
    setQueues(Array.isArray(q) ? q : [])
  }

  useEffect(() => { load() }, [])

  const openCreate = () => { setEditing(null); setForm({ ...EMPTY_FORM }); setError(''); setModal('create') }
  const openEdit = (u: UserData) => {
    setEditing(u)
    setForm({ name: u.name, username: u.username, email: u.email || '', password: '', profileSlug: u.profileSlug, isManager: u.isManager, defaultQueueId: u.defaultQueueId?.toString() || '' })
    setError(''); setModal('edit')
  }

  const handleSave = async () => {
    setLoading(true); setError('')
    try {
      const body = { ...form, defaultQueueId: form.defaultQueueId ? Number(form.defaultQueueId) : null }
      const url = modal === 'edit' ? `/api/admin/users/${editing!.id}` : '/api/admin/users'
      const method = modal === 'edit' ? 'PUT' : 'POST'
      const res = await fetch(url, { method, headers: { Authorization: `Bearer ${token()}`, 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Erro ao salvar'); return }
      setModal(null); await load()
    } finally { setLoading(false) }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Desativar este usuário?')) return
    await fetch(`/api/admin/users/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token()}` } })
    await load()
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Usuários</h1>
          <p className="text-slate-500 text-sm mt-1">{users.length} colaboradores cadastrados</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors">
          <Plus size={16} /> Novo usuário
        </button>
      </div>

      {/* Tabela */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50">
              <th className="text-left text-xs font-semibold text-slate-500 uppercase px-4 py-3">Colaborador</th>
              <th className="text-left text-xs font-semibold text-slate-500 uppercase px-4 py-3 hidden md:table-cell">Departamento</th>
              <th className="text-left text-xs font-semibold text-slate-500 uppercase px-4 py-3 hidden sm:table-cell">Perfil</th>
              <th className="text-left text-xs font-semibold text-slate-500 uppercase px-4 py-3">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {users.map((u, i) => (
              <tr key={u.id} className={`${i < users.length - 1 ? 'border-b border-slate-100' : ''} hover:bg-slate-50`}>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center shrink-0">
                      {u.isManager ? <ShieldCheck size={14} className="text-amber-500" /> : <User size={14} className="text-indigo-600" />}
                    </div>
                    <div>
                      <div className="font-medium text-slate-800 text-sm">{u.name}</div>
                      <div className="text-xs text-slate-400">@{u.username}</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 hidden md:table-cell">
                  {u.defaultQueue ? (
                    <span className="text-xs px-2 py-1 rounded-full" style={{ background: u.defaultQueue.color + '20', color: u.defaultQueue.color }}>
                      {u.defaultQueue.name}
                    </span>
                  ) : <span className="text-xs text-slate-400">—</span>}
                </td>
                <td className="px-4 py-3 hidden sm:table-cell">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${u.isManager ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>
                    {u.isManager ? 'Gestor' : u.profileSlug}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full font-medium ${u.active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                    {u.active ? <><Check size={10} /> Ativo</> : <><X size={10} /> Inativo</>}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1 justify-end">
                    <button onClick={() => openEdit(u)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors">
                      <Pencil size={14} />
                    </button>
                    <button onClick={() => handleDelete(u.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal criar/editar */}
      {modal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h2 className="font-semibold text-slate-800">{modal === 'create' ? 'Novo usuário' : 'Editar usuário'}</h2>
              <button onClick={() => setModal(null)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400">
                <X size={18} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {error && <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-3 py-2">{error}</div>}

              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Nome completo</label>
                  <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Usuário</label>
                  <input value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Senha {modal === 'edit' && <span className="text-slate-400">(deixe vazio para manter)</span>}</label>
                  <input type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">E-mail (opcional)</label>
                  <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Departamento padrão</label>
                  <select value={form.defaultQueueId} onChange={e => setForm(f => ({ ...f, defaultQueueId: e.target.value }))}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                    <option value="">Nenhum</option>
                    {queues.map(q => <option key={q.id} value={q.id}>{q.name}</option>)}
                  </select>
                </div>
                <div className="col-span-2 flex items-center gap-2">
                  <input type="checkbox" id="isManager" checked={form.isManager} onChange={e => setForm(f => ({ ...f, isManager: e.target.checked }))}
                    className="w-4 h-4 text-amber-500 rounded" />
                  <label htmlFor="isManager" className="text-sm text-slate-700">Gestor <span className="text-slate-400 text-xs">(acesso ao Painel Admin)</span></label>
                </div>
              </div>
            </div>
            <div className="flex gap-3 p-6 border-t border-slate-100">
              <button onClick={() => setModal(null)} className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-600 hover:bg-slate-50">
                Cancelar
              </button>
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
