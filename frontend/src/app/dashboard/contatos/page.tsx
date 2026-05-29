'use client'
import { useEffect, useRef, useState } from 'react'
import {
  Search, User, Users, UserPlus, X, Loader2,
  AlertCircle, Phone, Building2, Tag, Briefcase,
  StickyNote, Save,
} from 'lucide-react'
import s from '../dashboard.module.css'

const CATEGORIES = ['Consumidor', 'Zweb', 'Clipp Pro', 'Gdor', 'Contador'] as const
const CATEGORY_COLORS: Record<string, string> = {
  'Consumidor': '#6366f1',
  'Zweb':       '#0ea5e9',
  'Clipp Pro':  '#10b981',
  'Gdor':       '#f59e0b',
  'Contador':   '#ec4899',
}

interface Contact {
  id: number; name: string; number: string
  company: string | null; email: string | null
  tags: { tag: { name: string; color: string } }[]
}

export default function ContatosPage() {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [count, setCount]       = useState(0)
  const [search, setSearch]     = useState('')
  const [loading, setLoading]   = useState(false)
  const [page, setPage]         = useState(1)
  const [showNew, setShowNew]   = useState(false)

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

        {/* ── Botão Novo Contato ── */}
        <button
          onClick={() => setShowNew(true)}
          className={`${s.btn} ${s.btnPrimary}`}
          style={{ gap: 8 }}
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

      {/* ══════════ MODAL Novo Contato ══════════ */}
      {showNew && (
        <NewContactModal
          token={token()}
          onClose={() => setShowNew(false)}
          onSaved={() => { setShowNew(false); load(search, page) }}
        />
      )}
    </div>
  )
}

/* ════════════════════════════════════════════════
   Modal de Cadastro de Novo Contato
════════════════════════════════════════════════ */
function NewContactModal({ token, onClose, onSaved }: {
  token: string
  onClose: () => void
  onSaved: () => void
}) {
  const [name,        setName]        = useState('')
  const [number,      setNumber]      = useState('')
  const [company,     setCompany]     = useState('')
  const [category,    setCategory]    = useState('')
  const [role,        setRole]        = useState('')
  const [observation, setObservation] = useState('')
  const [saving,      setSaving]      = useState(false)
  const [error,       setError]       = useState('')

  const numberRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    numberRef.current?.focus()
    const fn = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', fn)
    return () => window.removeEventListener('keydown', fn)
  }, [onClose])

  // Formata enquanto digita: (64) 9 9999-9999
  function handleNumberChange(raw: string) {
    const digits = raw.replace(/\D/g, '').slice(0, 13)
    let fmt = digits
    if (digits.length > 2)  fmt = `(${digits.slice(0,2)}) ${digits.slice(2)}`
    if (digits.length > 7)  fmt = `(${digits.slice(0,2)}) ${digits.slice(2,7)}-${digits.slice(7)}`
    if (digits.length > 11) fmt = `(${digits.slice(0,2)}) ${digits.slice(2,3)} ${digits.slice(3,7)}-${digits.slice(7)}`
    setNumber(fmt)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    const cleanNumber = number.replace(/\D/g, '')
    if (!name.trim())          { setError('Nome é obrigatório.'); return }
    if (cleanNumber.length < 10) { setError('Número inválido. Use DDD + número (ex: 64 9 9999-9999).'); return }

    setSaving(true)
    const r = await fetch('/api/contacts', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        name: name.trim(), number: cleanNumber,
        company: company.trim() || null,
        category: category || null,
        role: role.trim() || null,
        observation: observation.trim() || null,
      }),
    })
    setSaving(false)
    if (!r.ok) { const d = await r.json(); setError(d.error || 'Erro ao cadastrar.'); return }
    onSaved()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">

        {/* header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <UserPlus size={18} className="text-indigo-600" />
            <h2 className="font-semibold text-slate-800">Novo contato</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 transition-colors">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">

          {/* número WhatsApp */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide flex items-center gap-1">
              <Phone size={11} /> Número WhatsApp <span className="text-red-400 normal-case font-normal">* obrigatório</span>
            </label>
            <input
              ref={numberRef}
              type="tel"
              value={number}
              onChange={e => handleNumberChange(e.target.value)}
              placeholder="(64) 9 9999-9999"
              className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
            />
            <p className="text-xs text-slate-400 mt-1">Digite somente o número com DDD, sem o +55</p>
          </div>

          {/* nome */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide flex items-center gap-1">
              <User size={11} /> Nome <span className="text-red-400 normal-case font-normal">* obrigatório</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Nome completo"
              className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
            />
          </div>

          {/* empresa */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide flex items-center gap-1">
              <Building2 size={11} /> Empresa
            </label>
            <input
              type="text"
              value={company}
              onChange={e => setCompany(e.target.value)}
              placeholder="Nome da empresa (opcional)"
              className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
            />
          </div>

          {/* categoria */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide flex items-center gap-1">
              <Tag size={11} /> Categoria
            </label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(c => c === cat ? '' : cat)}
                  className="px-3 py-1.5 rounded-full text-xs font-semibold border-2 transition-all"
                  style={category === cat
                    ? { backgroundColor: CATEGORY_COLORS[cat], borderColor: CATEGORY_COLORS[cat], color: '#fff' }
                    : { backgroundColor: 'transparent', borderColor: CATEGORY_COLORS[cat] + '60', color: CATEGORY_COLORS[cat] }
                  }
                >
                  {cat}
                </button>
              ))}
              {category && (
                <button type="button" onClick={() => setCategory('')}
                  className="px-3 py-1.5 rounded-full text-xs font-medium border-2 border-slate-200 text-slate-500 hover:border-red-300 hover:text-red-500 transition-colors">
                  ✕ Limpar
                </button>
              )}
            </div>
          </div>

          {/* cargo */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide flex items-center gap-1">
              <Briefcase size={11} /> Cargo
            </label>
            <input
              type="text"
              value={role}
              onChange={e => setRole(e.target.value)}
              placeholder="Ex: Gerente, Fiscal de caixa, Colaborador..."
              list="role-suggestions-new"
              className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
            />
            <datalist id="role-suggestions-new">
              {['Gerente', 'Fiscal de caixa', 'Gestor', 'Colaborador', 'Diretor', 'Supervisor', 'Analista', 'Técnico'].map(s => (
                <option key={s} value={s} />
              ))}
            </datalist>
          </div>

          {/* observações */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide flex items-center gap-1">
              <StickyNote size={11} /> Observações
            </label>
            <textarea
              value={observation}
              onChange={e => setObservation(e.target.value)}
              placeholder="Anotações internas sobre o cliente..."
              rows={3}
              className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 resize-none"
            />
          </div>

          {/* erro */}
          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-3 py-2.5 text-sm text-red-600">
              <AlertCircle size={14} className="shrink-0" /> {error}
            </div>
          )}

          {/* botões */}
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-slate-300 rounded-xl text-sm text-slate-600 hover:bg-slate-50 transition-colors">
              Cancelar
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-60">
              {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
              {saving ? 'Cadastrando...' : 'Cadastrar contato'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
