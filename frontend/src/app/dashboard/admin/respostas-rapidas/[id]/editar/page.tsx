'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import {
  ArrowLeft, Zap, Save, Loader2, CheckCircle2,
  Hash, MessageSquareText, StickyNote,
} from 'lucide-react'
import s from '../../../../dashboard.module.css'

export default function EditarRespostaRapidaPage() {
  const router = useRouter()
  const { id } = useParams<{ id: string }>()
  const nameRef = useRef<HTMLInputElement>(null)
  const token   = () => typeof window !== 'undefined' ? localStorage.getItem('token') ?? '' : ''

  const [name,    setName]    = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving,  setSaving]  = useState(false)
  const [error,   setError]   = useState('')
  const [success, setSuccess] = useState(false)

  /* Carrega dados existentes */
  useEffect(() => {
    fetch(`/api/quick-replies?search=`, { headers: { Authorization: `Bearer ${token()}` } })
      .then(r => r.json())
      .then((list: { id: number; name: string; message: string }[]) => {
        const found = list.find(r => String(r.id) === String(id))
        if (found) { setName(found.name); setMessage(found.message) }
        setLoading(false)
        setTimeout(() => nameRef.current?.focus(), 50)
      })
      .catch(() => setLoading(false))
  }, [id]) // eslint-disable-line

  const handleName = (v: string) => setName(v.replace(/\s+/g, '_').toLowerCase().replace(/[^a-z0-9_]/g, ''))

  const nameValid    = name.trim().length >= 1
  const messageValid = message.trim().length >= 1
  const formValid    = nameValid && messageValid

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!formValid) return

    setSaving(true)
    const r = await fetch(`/api/quick-replies/${id}`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
      body:    JSON.stringify({ name: name.trim(), message: message.trim() }),
    })
    setSaving(false)

    if (!r.ok) { const d = await r.json(); setError(d.error || 'Erro ao salvar.'); return }
    setSuccess(true)
    setTimeout(() => router.push('/dashboard/admin/respostas-rapidas'), 1800)
  }

  /* ── tela de sucesso ── */
  if (success) {
    return (
      <div className={s.container} style={{ alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, animation: 'fadeIn 0.4s ease-out both' }}>
          <div style={{
            width: 72, height: 72, borderRadius: '50%',
            background: 'linear-gradient(135deg, #7c3aed, #6d28d9)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 8px 24px rgba(124,58,237,0.35)',
          }}>
            <CheckCircle2 size={36} color="white" />
          </div>
          <h2 style={{ fontSize: '1.375rem', fontWeight: 700, color: '#1e293b', margin: 0 }}>Resposta atualizada!</h2>
          <p style={{ color: '#64748b', margin: 0 }}>
            Use <code style={{ background: '#ede9fe', color: '#6d28d9', borderRadius: 6, padding: '2px 8px', fontWeight: 700 }}>/{name}</code> no chat. Redirecionando...
          </p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className={s.container}>
        <div className={s.spinnerWrap}><div className={s.spinner} /></div>
      </div>
    )
  }

  return (
    <div className={s.container}>

      {/* ── cabeçalho ── */}
      <div className={s.pageHeader}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <button
            onClick={() => router.push('/dashboard/admin/respostas-rapidas')}
            className={`${s.btn} ${s.btnGhost}`}
            style={{ padding: '8px 12px' }}
          >
            <ArrowLeft size={16} /> Voltar
          </button>
          <div style={{
            width: 44, height: 44, borderRadius: 14,
            background: 'linear-gradient(135deg, rgba(124,58,237,0.18), rgba(99,102,241,0.18))',
            border: '1px solid rgba(124,58,237,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#7c3aed',
            boxShadow: '0 4px 14px rgba(124,58,237,0.18)',
          }}>
            <Zap size={22} />
          </div>
          <div>
            <h1 className={s.pageTitle}>Editar resposta rápida</h1>
            <p className={s.pageSubtitle}>Atualize o atalho ou o texto da mensagem</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 24 }}>

          {/* ════ SEÇÃO 1 — Atalho ════ */}
          <div className={s.card}>
            <SectionTitle icon={<Hash size={16} />} label="Atalho" />

            <div style={{ marginTop: 20 }}>
              <label className={s.label}>
                Nome do atalho
                <span style={{ color: '#ef4444', marginLeft: 4 }}>*</span>
              </label>

              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: 4,
                  background: name ? '#ede9fe' : '#f8fafc',
                  border: `1px solid ${name ? '#c4b5fd' : '#e2e8f0'}`,
                  borderRadius: 10, padding: '6px 14px',
                  fontFamily: 'monospace', fontSize: '1rem', fontWeight: 700,
                  color: name ? '#6d28d9' : '#94a3b8',
                  transition: 'all 0.2s ease', minWidth: 80,
                }}>
                  /{name || 'atalho'}
                </div>
                <span style={{ fontSize: '0.8125rem', color: '#94a3b8' }}>
                  → será usado como <strong style={{ color: '#6d28d9' }}>/{name || 'atalho'}</strong> no chat
                </span>
              </div>

              <div style={{ position: 'relative' }}>
                <span style={{
                  position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
                  fontFamily: 'monospace', fontWeight: 700, fontSize: '1.1rem',
                  color: nameValid ? '#7c3aed' : '#a78bfa', pointerEvents: 'none',
                }}>/</span>
                <input
                  ref={nameRef}
                  type="text"
                  value={name}
                  onChange={e => handleName(e.target.value)}
                  placeholder="ex: bom_dia, saudacao, horario"
                  className={s.input}
                  style={{ paddingLeft: 28 }}
                />
              </div>
              <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: 5 }}>
                Apenas letras minúsculas, números e _ (underline) · sem espaços
              </p>
            </div>
          </div>

          {/* ════ SEÇÃO 2 — Mensagem ════ */}
          <div className={s.card}>
            <SectionTitle icon={<MessageSquareText size={16} />} label="Mensagem" />

            <div style={{ marginTop: 20 }}>
              <label className={s.label}>
                Texto completo da mensagem
                <span style={{ color: '#ef4444', marginLeft: 4 }}>*</span>
              </label>
              <textarea
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder="Digite a mensagem completa que será inserida no chat ao usar o atalho..."
                rows={7}
                className={s.textarea}
              />
              <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: 5, textAlign: 'right' }}>
                {message.length} caracteres
              </p>
            </div>
          </div>

          {/* ════ DICA ════ */}
          <div style={{
            background: 'linear-gradient(135deg, #faf5ff, #f5f3ff)',
            border: '1px solid #e9d5ff', borderRadius: 14, padding: '16px 20px',
            display: 'flex', alignItems: 'flex-start', gap: 12,
          }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10, flexShrink: 0,
              background: '#ede9fe', display: 'flex', alignItems: 'center',
              justifyContent: 'center', color: '#7c3aed',
            }}>
              <StickyNote size={16} />
            </div>
            <div>
              <p style={{ margin: '0 0 4px', fontWeight: 700, fontSize: '0.875rem', color: '#5b21b6' }}>Como usar no chat</p>
              <p style={{ margin: 0, fontSize: '0.8125rem', color: '#7c3aed', lineHeight: 1.55 }}>
                Durante um atendimento, digite <code style={{ background: '#ddd6fe', borderRadius: 4, padding: '1px 6px', fontWeight: 700 }}>/</code> seguido do atalho no campo de mensagem. Um menu aparecerá com as opções. Use as setas para navegar e <strong>Enter</strong> ou <strong>Tab</strong> para inserir.
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
              onClick={() => router.push('/dashboard/admin/respostas-rapidas')}
              className={`${s.btn} ${s.btnGhost}`}
              style={{ minWidth: 120 }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!formValid || saving}
              className={`${s.btn} ${s.btnPrimary}`}
              style={{ minWidth: 220, opacity: formValid ? 1 : 0.5 }}
            >
              {saving
                ? <><Loader2 size={16} style={{ animation: 'spin 0.8s linear infinite' }} /> Salvando...</>
                : <><Save size={16} /> Salvar alterações</>
              }
            </button>
          </div>

        </div>
      </form>
    </div>
  )
}

function SectionTitle({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{
        width: 30, height: 30, borderRadius: 9,
        background: 'linear-gradient(135deg, rgba(124,58,237,0.15), rgba(99,102,241,0.15))',
        border: '1px solid rgba(124,58,237,0.25)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#7c3aed',
      }}>
        {icon}
      </div>
      <span style={{ fontWeight: 700, fontSize: '0.9375rem', color: '#1e293b' }}>{label}</span>
    </div>
  )
}
