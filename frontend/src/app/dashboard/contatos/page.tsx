'use client'
import { useEffect, useState } from 'react'
import { Search, User } from 'lucide-react'

interface Contact {
  id: number; name: string; number: string
  company: string | null; email: string | null
  tags: { tag: { name: string; color: string } }[]
}

export default function ContatosPage() {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [count, setCount] = useState(0)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)

  const load = async (s: string, p: number) => {
    setLoading(true)
    const token = localStorage.getItem('token')
    const r = await fetch(`/api/contacts?search=${s}&pageNumber=${p}`, { headers: { Authorization: `Bearer ${token}` } })
    const d = await r.json()
    setContacts(d.contacts || [])
    setCount(d.count || 0)
    setLoading(false)
  }

  useEffect(() => { load(search, page) }, [])

  const handleSearch = (v: string) => { setSearch(v); setPage(1); load(v, 1) }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Contatos</h1>
          <p className="text-slate-500 text-sm mt-1">{count.toLocaleString()} contatos cadastrados</p>
        </div>
      </div>

      {/* Busca */}
      <div className="relative mb-6">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          value={search}
          onChange={e => handleSearch(e.target.value)}
          placeholder="Buscar por nome, número ou empresa..."
          className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><div className="animate-spin w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full" /></div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          {contacts.map((c, i) => (
            <div key={c.id} className={`flex items-center gap-3 p-4 ${i < contacts.length - 1 ? 'border-b border-slate-100' : ''}`}>
              <div className="w-9 h-9 bg-indigo-100 rounded-full flex items-center justify-center shrink-0">
                <User size={16} className="text-indigo-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-slate-800 truncate">{c.name || 'Sem nome'}</div>
                <div className="text-sm text-slate-500">{c.number}{c.company ? ` · ${c.company}` : ''}</div>
              </div>
              <div className="flex gap-1">
                {c.tags.map(({ tag }) => (
                  <span key={tag.name} className="text-xs px-2 py-0.5 rounded-full" style={{ background: tag.color + '20', color: tag.color }}>
                    {tag.name}
                  </span>
                ))}
              </div>
            </div>
          ))}
          {contacts.length === 0 && <div className="text-center py-12 text-slate-400">Nenhum contato encontrado</div>}
        </div>
      )}

      {/* Paginação */}
      {count > 20 && (
        <div className="flex justify-center gap-2 mt-4">
          <button disabled={page === 1} onClick={() => { setPage(p => p - 1); load(search, page - 1) }}
            className="px-4 py-2 rounded-lg border border-slate-200 text-sm disabled:opacity-40">Anterior</button>
          <span className="px-4 py-2 text-sm text-slate-500">Página {page} de {Math.ceil(count / 20)}</span>
          <button disabled={page >= Math.ceil(count / 20)} onClick={() => { setPage(p => p + 1); load(search, page + 1) }}
            className="px-4 py-2 rounded-lg border border-slate-200 text-sm disabled:opacity-40">Próxima</button>
        </div>
      )}
    </div>
  )
}
