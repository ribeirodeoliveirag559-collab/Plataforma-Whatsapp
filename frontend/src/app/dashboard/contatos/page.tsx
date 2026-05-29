'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search, User, Users, UserPlus } from 'lucide-react'
import s from '../dashboard.module.css'

interface Contact {
  id: number; name: string; number: string
  company: string | null; email: string | null
  tags: { tag: { name: string; color: string } }[]
}

export default function ContatosPage() {
  const router = useRouter()
  const [contacts, setContacts] = useState<Contact[]>([])
  const [count, setCount]       = useState(0)
  const [search, setSearch]     = useState('')
  const [loading, setLoading]   = useState(false)
  const [page, setPage]         = useState(1)

  const token = () => typeof window !== 'undefined' ? localStorage.getItem('token') ?? '' : ''

  const load = async (q: string, p: number) => {
    setLoading(true)
    const r = await fetch(`/api/contacts?search=${q}&pageNumber=${p}`, {
      headers: { Authorization: `Bearer ${token()}` },
    })
    const d = await r.json()
    setContacts(d.contacts || [])
    setCount(d.count || 0)
    setLoading(false)
  }

  useEffect(() => { load('', 1) }, []) // eslint-disable-line

  const handleSearch = (v: string) => { setSearch(v); setPage(1); load(v, 1) }

  return (
    <div className={s.container}>
      <div className={s.pageHeader}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div className={s.pageIconBox}><Users size={22} /></div>
          <div>
            <h1 className={s.pageTitle}>Contatos</h1>
            <p className={s.pageSubtitle}>{count.toLocaleString()} contatos cadastrados</p>
          </div>
        </div>

        <button
          onClick={() => router.push('/dashboard/contatos/novo')}
          className={`${s.btn} ${s.btnPrimary}`}
        >
          <UserPlus size={16} />
          Novo contato
        </button>
      </div>

      {/* Busca */}
      <div style={{ position: 'relative' }}>
        <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#a78bfa', pointerEvents: 'none' }} />
        <input
          value={search}
          onChange={e => handleSearch(e.target.value)}
          placeholder="Buscar por nome, número ou empresa..."
          className={s.input}
          style={{ paddingLeft: 40 }}
        />
      </div>

      {loading ? (
        <div className={s.spinnerWrap}><div className={s.spinner} /></div>
      ) : (
        <div className={s.card} style={{ padding: 0, overflow: 'hidden' }}>
          {contacts.map((c, i) => (
            <div key={c.id} style={{
              display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px',
              borderBottom: i < contacts.length - 1 ? '1px solid rgba(226, 232, 240, 0.6)' : 'none',
              transition: 'background 0.15s ease',
            }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(244, 243, 255, 0.5)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              <div style={{
                width: 38, height: 38, borderRadius: 12, flexShrink: 0,
                background: 'linear-gradient(135deg, #a78bfa 0%, #6366f1 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 3px 10px rgba(99, 102, 241, 0.25)',
              }}>
                <User size={16} style={{ color: 'white' }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, color: '#1e293b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {c.name || 'Sem nome'}
                </div>
                <div style={{ fontSize: '0.8125rem', color: '#64748b' }}>
                  {c.number}{c.company ? ` · ${c.company}` : ''}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                {c.tags.map(({ tag }) => (
                  <span key={tag.name} style={{
                    fontSize: '0.6875rem', fontWeight: 600, padding: '3px 9px', borderRadius: 99,
                    background: tag.color + '20', color: tag.color, border: `1px solid ${tag.color}40`,
                  }}>
                    {tag.name}
                  </span>
                ))}
              </div>
            </div>
          ))}
          {contacts.length === 0 && (
            <div style={{ textAlign: 'center', padding: '48px 20px', color: '#94a3b8' }}>
              Nenhum contato encontrado
            </div>
          )}
        </div>
      )}

      {count > 20 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, alignItems: 'center' }}>
          <button disabled={page === 1} onClick={() => { setPage(p => p - 1); load(search, page - 1) }}
            className={`${s.btn} ${s.btnGhost}`} style={{ opacity: page === 1 ? 0.4 : 1 }}>
            Anterior
          </button>
          <span style={{ padding: '0 16px', fontSize: '0.875rem', color: '#64748b', fontWeight: 500 }}>
            Página {page} de {Math.ceil(count / 20)}
          </span>
          <button disabled={page >= Math.ceil(count / 20)} onClick={() => { setPage(p => p + 1); load(search, page + 1) }}
            className={`${s.btn} ${s.btnGhost}`} style={{ opacity: page >= Math.ceil(count / 20) ? 0.4 : 1 }}>
            Próxima
          </button>
        </div>
      )}
    </div>
  )
}
