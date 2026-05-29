'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft, UserPlus, Phone, User, Building2,
  Tag, Briefcase, StickyNote, Save, Loader2,
  CheckCircle2,
} from 'lucide-react'
import s from '../../dashboard.module.css'

const CATEGORIES = ['Consumidor', 'Zweb', 'Clipp Pro', 'Gdor', 'Contador'] as const
const CATEGORY_COLORS: Record<string, string> = {
  'Consumidor': '#6366f1',
  'Zweb':       '#0ea5e9',
  'Clipp Pro':  '#10b981',
  'Gdor':       '#f59e0b',
  'Contador':   '#ec4899',
}
const ROLE_SUGGESTIONS = [
  'Gerente', 'Fiscal de caixa', 'Gestor', 'Colaborador',
  'Diretor', 'Supervisor', 'Analista', 'Técnico', 'Proprietário', 'Sócio',
]

export default function NovoContatoPage() {
  const router  = useRouter()
  const numRef  = useRef<HTMLInputElement>(null)
  const token   = () => typeof window !== 'undefined' ? localStorage.getItem('token') ?? '' : ''

  const [name,        setName]        = useState('')
  const [number,      setNumber]      = useState('')
  const [company,     setCompany]     = useState('')
  const [category,    setCategory]    = useState('')
  const [role,        setRole]        = useState('')
  const [observation, setObservation] = useState('')
  const [saving,      setSaving]      = useState(false)
  const [error,       setError]       = useState('')
  const [success,     setSuccess]     = useState(false)

  useEffect(() => { numRef.current?.focus() }, [])

  /* ── formata número enquanto digita ── */
  function handleNumber(raw: string) {
    const d = raw.replace(/\D/g, '').slice(0, 13)
    let fmt = d
    if (d.length > 2)  fmt = `(${d.slice(0,2)}) ${d.slice(2)}`
    if (d.length > 7)  fmt = `(${d.slice(0,2)}) ${d.slice(2,7)}-${d.slice(7)}`
    if (d.length > 11) fmt = `(${d.slice(0,2)}) ${d.slice(2,3)} ${d.slice(3,7)}-${d.slice(7)}`
    setNumber(fmt)
  }

  const digits       = number.replace(/\D/g, '')
  const numberValid  = digits.length >= 10
  const nameValid    = name.trim().length >= 2
  const formValid    = numberValid && nameValid

  /* ── submete ── */
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!formValid) return

    setSaving(true)
    const r = await fetch('/api/contacts', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
      body: JSON.stringify({
        name: name.trim(), number: digits,
        company:     company.trim()     || null,
        category:    category           || null,
        role:        role.trim()        || null,
        observation: observation.trim() || null,
      }),
    })
    setSaving(false)
    if (!r.ok) { const d = await r.json(); setError(d.error || 'Erro ao cadastrar.'); return }
    setSuccess(true)
    setTimeout(() => router.push('/dashboard/contatos'), 1800)
  }

  /* ── tela de sucesso ── */
  if (success) {
    return (
      <div className={s.container} style={{ alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16,
          animation: 'fadeIn 0.4s ease-out both',
        }}>
          <div style={{
            width: 72, height: 72, borderRadius: '50%',
            background: 'linear-gradient(135deg, #10b981, #34d399)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 8px 24px rgba(16, 185, 129, 0.35)',
          }}>
            <CheckCircle2 size={36} color="white" />
          </div>
          <h2 style={{ fontSize: '1.375rem', fontWeight: 700, color: '#1e293b', margin: 0 }}>
            Contato cadastrado!
          </h2>
          <p style={{ color: '#64748b', margin: 0 }}>
            <strong>{name}</strong> foi adicionado com sucesso. Redirecionando...
          </p>
        </div>
      </div>
    )
  }

  /* ══════════════════════════════════════════ RENDER ══════════════════════════════════════════ */
  return (
    <div className={s.container}>

      {/* ── cabeçalho ── */}
      <div className={s.pageHeader}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <button
            onClick={() => router.push('/dashboard/contatos')}
            className={`${s.btn} ${s.btnGhost}`}
            style={{ padding: '8px 12px' }}
          >
            <ArrowLeft size={16} />
            Voltar
          </button>
          <div className={s.pageIconBox}><UserPlus size={20} /></div>
          <div>
            <h1 className={s.pageTitle}>Cadastrar contato</h1>
            <p className={s.pageSubtitle}>Preencha os dados do novo cliente</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 24 }}>

          {/* ════ SEÇÃO 1 — Identificação ════ */}
          <div className={s.card}>
            <SectionTitle icon={<Phone size={16} />} label="Identificação" />

            <div className={s.grid2} style={{ marginTop: 20 }}>
              {/* número */}
              <div>
                <label className={s.label}>
                  Número WhatsApp
                  <span style={{ color: '#ef4444', marginLeft: 4 }}>*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <Phone size={15} style={{
                    position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
                    color: numberValid ? '#10b981' : '#a78bfa', pointerEvents: 'none',
                  }} />
                  <input
                    ref={numRef}
                    type="tel"
                    value={number}
                    onChange={e => handleNumber(e.target.value)}
                    placeholder="(64) 9 9999-9999"
                    className={s.input}
                    style={{ paddingLeft: 36 }}
                  />
                </div>
                <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: 5 }}>
                  DDD + número, sem +55 · {digits.length}/11 dígitos
                </p>
              </div>

              {/* nome */}
              <div>
                <label className={s.label}>
                  Nome completo
                  <span style={{ color: '#ef4444', marginLeft: 4 }}>*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <User size={15} style={{
                    position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
                    color: nameValid ? '#10b981' : '#a78bfa', pointerEvents: 'none',
                  }} />
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Nome do cliente"
                    className={s.input}
                    style={{ paddingLeft: 36 }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* ════ SEÇÃO 2 — Dados da empresa ════ */}
          <div className={s.card}>
            <SectionTitle icon={<Building2 size={16} />} label="Dados da empresa" />

            {/* empresa */}
            <div style={{ marginTop: 20 }}>
              <label className={s.label}>Empresa</label>
              <div style={{ position: 'relative' }}>
                <Building2 size={15} style={{
                  position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
                  color: '#a78bfa', pointerEvents: 'none',
                }} />
                <input
                  type="text"
                  value={company}
                  onChange={e => setCompany(e.target.value)}
                  placeholder="Nome da empresa (deixe vazio se não tiver)"
                  className={s.input}
                  style={{ paddingLeft: 36 }}
                />
              </div>
            </div>

            <div className={s.grid2} style={{ marginTop: 18 }}>
              {/* cargo */}
              <div>
                <label className={s.label}>Cargo</label>
                <div style={{ position: 'relative' }}>
                  <Briefcase size={15} style={{
                    position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
                    color: '#a78bfa', pointerEvents: 'none',
                  }} />
                  <input
                    type="text"
                    value={role}
                    onChange={e => setRole(e.target.value)}
                    placeholder="Ex: Gerente, Colaborador..."
                    list="role-suggestions"
                    className={s.input}
                    style={{ paddingLeft: 36 }}
                  />
                  <datalist id="role-suggestions">
                    {ROLE_SUGGESTIONS.map(r => <option key={r} value={r} />)}
                  </datalist>
                </div>
              </div>

              {/* categoria — chips */}
              <div>
                <label className={s.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Tag size={13} /> Categoria do cliente
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 4 }}>
                  {CATEGORIES.map(cat => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setCategory(c => c === cat ? '' : cat)}
                      style={{
                        padding: '6px 14px', borderRadius: 999, fontSize: '0.8rem',
                        fontWeight: 600, border: '2px solid', cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        ...(category === cat
                          ? { backgroundColor: CATEGORY_COLORS[cat], borderColor: CATEGORY_COLORS[cat], color: '#fff', boxShadow: `0 4px 12px ${CATEGORY_COLORS[cat]}55` }
                          : { backgroundColor: 'transparent', borderColor: CATEGORY_COLORS[cat] + '55', color: CATEGORY_COLORS[cat] }
                        ),
                      }}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ════ SEÇÃO 3 — Observações ════ */}
          <div className={s.card}>
            <SectionTitle icon={<StickyNote size={16} />} label="Observações internas" />
            <div style={{ marginTop: 20 }}>
              <textarea
                value={observation}
                onChange={e => setObservation(e.target.value)}
                placeholder="Anote informações relevantes sobre este cliente: histórico, preferências, observações de atendimento..."
                rows={5}
                className={s.textarea}
              />
              <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: 5, textAlign: 'right' }}>
                {observation.length} caracteres
              </p>
            </div>
          </div>

          {/* ════ ERRO ════ */}
          {error && (
            <div className={s.errorBox} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              ⚠ {error}
            </div>
          )}

          {/* ════ AÇÕES ════ */}
          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => router.push('/dashboard/contatos')}
              className={`${s.btn} ${s.btnGhost}`}
              style={{ minWidth: 120 }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!formValid || saving}
              className={`${s.btn} ${s.btnPrimary}`}
              style={{ minWidth: 200, opacity: formValid ? 1 : 0.5 }}
            >
              {saving
                ? <><Loader2 size={16} style={{ animation: 'spin 0.8s linear infinite' }} /> Cadastrando...</>
                : <><Save size={16} /> Cadastrar contato</>
              }
            </button>
          </div>

        </div>
      </form>
    </div>
  )
}

/* ── título de seção ── */
function SectionTitle({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{
        width: 30, height: 30, borderRadius: 9,
        background: 'linear-gradient(135deg, rgba(167,139,250,0.18), rgba(99,102,241,0.18))',
        border: '1px solid rgba(167,139,250,0.3)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6366f1',
      }}>
        {icon}
      </div>
      <span style={{ fontWeight: 700, fontSize: '0.9375rem', color: '#1e293b' }}>{label}</span>
    </div>
  )
}
