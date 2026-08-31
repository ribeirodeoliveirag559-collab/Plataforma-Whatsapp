'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search, User, Users, UserPlus, Pencil, X, Save, Building2, Briefcase, Tag, StickyNote, Loader2, Phone } from 'lucide-react'
import s from '../dashboard.module.css'

const CATEGORIES = ['Consumidor', 'Zweb', 'Clipp Pro', 'Gdor', 'Contador'] as const
const CATEGORY_COLORS: Record<string, string> = {
  'Consumidor': '#6366f1', 'Zweb': '#0ea5e9', 'Clipp Pro': '#10b981', 'Gdor': '#f59e0b', 'Contador': '#ec4899',
}

interface Contact {
  id: number; name: string; number: string
  company: string | null; email: string | null; role: string | null
  category: string | null; observation: string | null
  tags: { tag: { name: string; color: string } }[]
}

export default function ContatosPage() {
  const router = useRouter()
  const [contacts, setContacts] = useState<Contact[]>([])
  const [count, setCount]       = useState(0)
  const [search, setSearch]     = useState('')
  const [loading, setLoading]   = useState(false)
  const [page, setPage]         = useState(1)
  const [editing, setEditing]   = useState<Contact | null>(null)

  const token = () => typeof window !== 'undefined' ? localStorage.getItem('token') ?? '' : ''

  const load = async (q: string, p: number) => {
    setLoading(true)
    const r = await fetch(`/api/contacts?search=${encodeURIComponent(q)}&pageNumber=${p}`, {
      headers: { Authorization: `Bearer ${token()}` },
    })
    const d = await r.json()
    setContacts(d.contacts || [])
    setCount(d.count || 0)
    setLoading(false)
  }

  useEffect(() => { load('', 1) }, []) // eslint-disable-line

  const handleSearch = (v: string) => { setSearch(v); setPage(1); load(v, 1) }

  const handleSaved = (updated: Contact) => {
    setContacts(prev => prev.map(c => c.id === updated.id ? { ...c, ...updated } : c))
    setEditing(null)
  }

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
        <button onClick={() => router.push('/dashboard/contatos/novo')} className={`${s.btn} ${s.btnPrimary}`}>
          <UserPlus size={16} /> Novo contato
        </button>
      </div>

      <div style={{ position: 'relative' }}>
        <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#a78bfa', pointerEvents: 'none' }} />
        <input value={search} onChange={e => handleSearch(e.target.value)}
          placeholder="Buscar por nome, número ou empresa..."
          className={s.input} style={{ paddingLeft: 40 }} />
      </div>

      {loading ? (
        <div className={s.spinnerWrap}><div className={s.spinner} /></div>
      ) : (
        <div className={s.card} style={{ padding: 0, overflow: 'hidden' }}>
          {contacts.map((c, i) => (
            <div key={c.id} style={{
              display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px',
              borderBottom: i < contacts.length - 1 ? '1px solid rgba(226,232,240,0.6)' : 'none',
              transition: 'background 0.15s ease',
            }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(244,243,255,0.5)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              <div style={{
                width: 38, height: 38, borderRadius: 12, flexShrink: 0,
                background: 'linear-gradient(135deg, #a78bfa 0%, #6366f1 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 3px 10px rgba(99,102,241,0.25)',
              }}>
                <User size={16} style={{ color: 'white' }} />
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, color: '#1e293b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {c.name || 'Sem nome'}
                </div>
                <div style={{ fontSize: '0.8125rem', color: '#64748b' }}>
                  {c.number}{c.company ? ` · ${c.company}` : ''}
                  {c.category && (
                    <span style={{ marginLeft: 6, fontWeight: 600, color: CATEGORY_COLORS[c.category] ?? '#6366f1' }}>
                      · {c.category}
                    </span>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', alignItems: 'center' }}>
                {c.tags.map(({ tag }) => (
                  <span key={tag.name} style={{
                    fontSize: '0.6875rem', fontWeight: 600, padding: '3px 9px', borderRadius: 99,
                    background: tag.color + '20', color: tag.color, border: `1px solid ${tag.color}40`,
                  }}>{tag.name}</span>
                ))}
                <button
                  onClick={() => setEditing(c)}
                  title="Editar contato"
                  style={{
                    display: 'flex', alignItems: 'center', gap: 5,
                    padding: '5px 12px', borderRadius: 8, border: '1px solid #e2e8f0',
                    background: 'white', color: '#6366f1', fontSize: '0.75rem', fontWeight: 600,
                    cursor: 'pointer', transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#eef2ff' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'white' }}
                >
                  <Pencil size={13} /> Editar
                </button>
              </div>
            </div>
          ))}
          {contacts.length === 0 && (
            <div style={{ textAlign: 'center', padding: '48px 20px', color: '#94a3b8' }}>Nenhum contato encontrado</div>
          )}
        </div>
      )}

      {count > 20 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, alignItems: 'center' }}>
          <button disabled={page === 1} onClick={() => { setPage(p => p - 1); load(search, page - 1) }}
            className={`${s.btn} ${s.btnGhost}`} style={{ opacity: page === 1 ? 0.4 : 1 }}>Anterior</button>
          <span style={{ padding: '0 16px', fontSize: '0.875rem', color: '#64748b', fontWeight: 500 }}>
            Página {page} de {Math.ceil(count / 20)}
          </span>
          <button disabled={page >= Math.ceil(count / 20)} onClick={() => { setPage(p => p + 1); load(search, page + 1) }}
            className={`${s.btn} ${s.btnGhost}`} style={{ opacity: page >= Math.ceil(count / 20) ? 0.4 : 1 }}>Próxima</button>
        </div>
      )}

      {editing && (
        <EditContactModal
          contact={editing}
          token={token()}
          onClose={() => setEditing(null)}
          onSaved={handleSaved}
        />
      )}
    </div>
  )
}

/* ── Modal de edição ── */
function EditContactModal({ contact, token, onClose, onSaved }: {
  contact: Contact; token: string
  onClose: () => void
  onSaved: (c: Contact) => void
}) {
  const [name,        setName]        = useState(contact.name || '')
  const [company,     setCompany]     = useState(contact.company || '')
  const [category,    setCategory]    = useState(contact.category || '')
  const [role,        setRole]        = useState(contact.role || '')
  const [observation, setObservation] = useState(contact.observation || '')
  const [saving,      setSaving]      = useState(false)
  const [error,       setError]       = useState('')

  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', fn)
    return () => window.removeEventListener('keydown', fn)
  }, [onClose])

  async function handleSave() {
    if (!name.trim()) { setError('Nome é obrigatório'); return }
    setSaving(true); setError('')
    const r = await fetch(`/api/contacts/${contact.id}`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body:    JSON.stringify({ name: name.trim(), company: company.trim() || null, category: category || null, role: role.trim() || null, observation: observation.trim() || null }),
    })
    setSaving(false)
    if (!r.ok) { setError('Erro ao salvar. Tente novamente.'); return }
    onSaved(await r.json())
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div style={{ background: 'white', borderRadius: 20, width: '100%', maxWidth: 520, boxShadow: '0 24px 64px rgba(0,0,0,0.18)', overflow: 'hidden' }}>

        {/* Header */}
        <div style={{ padding: '18px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: '1rem', color: '#1e293b' }}>Editar contato</div>
            <div style={{ fontSize: '0.8rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
              <Phone size={12} />{contact.number}
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', borderRadius: 8, padding: 4 }}>
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 14, maxHeight: '70vh', overflowY: 'auto' }}>

          {/* Nome */}
          <div>
            <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>
              Nome <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input value={name} onChange={e => setName(e.target.value)}
              className={s.input} placeholder="Nome do cliente" />
          </div>

          {/* Empresa */}
          <div>
            <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>
              <Building2 size={13} style={{ display: 'inline', marginRight: 4 }} />Empresa
            </label>
            <input value={company} onChange={e => setCompany(e.target.value)}
              className={s.input} placeholder="Nome da empresa" />
          </div>

          {/* Cargo */}
          <div>
            <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>
              <Briefcase size={13} style={{ display: 'inline', marginRight: 4 }} />Cargo
            </label>
            <input value={role} onChange={e => setRole(e.target.value)}
              className={s.input} placeholder="Ex: Gerente, Colaborador..." />
          </div>

          {/* Categoria */}
          <div>
            <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: 8 }}>
              <Tag size={13} style={{ display: 'inline', marginRight: 4 }} />Categoria
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {CATEGORIES.map(cat => (
                <button key={cat} type="button" onClick={() => setCategory(c => c === cat ? '' : cat)}
                  style={{
                    padding: '5px 14px', borderRadius: 999, fontSize: '0.8rem', fontWeight: 600,
                    border: '2px solid', cursor: 'pointer', transition: 'all 0.15s',
                    ...(category === cat
                      ? { backgroundColor: CATEGORY_COLORS[cat], borderColor: CATEGORY_COLORS[cat], color: '#fff' }
                      : { backgroundColor: 'transparent', borderColor: CATEGORY_COLORS[cat] + '55', color: CATEGORY_COLORS[cat] }
                    ),
                  }}>{cat}</button>
              ))}
            </div>
          </div>

          {/* Observação */}
          <div>
            <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>
              <StickyNote size={13} style={{ display: 'inline', marginRight: 4 }} />Observações
            </label>
            <textarea value={observation} onChange={e => setObservation(e.target.value)}
              rows={3} className={s.textarea}
              placeholder="Informações internas sobre este cliente..." />
          </div>

          {error && <div className={s.errorBox}>{error}</div>}
        </div>

        {/* Footer */}
        <div style={{ padding: '14px 24px', borderTop: '1px solid #f1f5f9', display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button onClick={onClose} className={`${s.btn} ${s.btnGhost}`}>Cancelar</button>
          <button onClick={handleSave} disabled={saving} className={`${s.btn} ${s.btnPrimary}`} style={{ minWidth: 130 }}>
            {saving ? <><Loader2 size={15} style={{ animation: 'spin 0.8s linear infinite' }} /> Salvando...</> : <><Save size={15} /> Salvar alterações</>}
          </button>
        </div>
      </div>
    </div>
  )
}
