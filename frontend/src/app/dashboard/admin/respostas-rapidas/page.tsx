'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft, Zap, Plus, Pencil, Trash2, Save,
  Loader2, X, Search, MessageSquareText,
} from 'lucide-react'
import s from '../../dashboard.module.css'

interface QuickReply {
  id: number
  name: string
  message: string
  createdAt: string
}

export default function RespostasRapidasPage() {
  const router = useRouter()
  const token = () => typeof window !== 'undefined' ? localStorage.getItem('token') ?? '' : ''

  const [replies,  setReplies]  = useState<QuickReply[]>([])
  const [loading,  setLoading]  = useState(true)
  const [search,   setSearch]   = useState('')

  // form state
  const [showForm, setShowForm]   = useState(false)
  const [editing,  setEditing]    = useState<QuickReply | null>(null)
  const [name,     setName]       = useState('')
  const [message,  setMessage]    = useState('')
  const [saving,   setSaving]     = useState(false)
  const [error,    setError]      = useState('')

  // delete confirm
  const [deleting, setDeleting]   = useState<number | null>(null)

  const load = async (q = '') => {
    setLoading(true)
    const r = await fetch(`/api/quick-replies?search=${encodeURIComponent(q)}`, {
      headers: { Authorization: `Bearer ${token()}` },
    })
    const d = await r.json()
    setReplies(Array.isArray(d) ? d : [])
    setLoading(false)
  }

  useEffect(() => { load() }, []) // eslint-disable-line

  const openCreate = () => {
    setEditing(null)
    setName('')
    setMessage('')
    setError('')
    setShowForm(true)
  }

  const openEdit = (r: QuickReply) => {
    setEditing(r)
    setName(r.name)
    setMessage(r.message)
    setError('')
    setShowForm(true)
  }

  const closeForm = () => { setShowForm(false); setEditing(null); setError('') }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!name.trim())    { setError('Nome é obrigatório'); return }
    if (!message.trim()) { setError('Mensagem é obrigatória'); return }

    setSaving(true)
    const url    = editing ? `/api/quick-replies/${editing.id}` : '/api/quick-replies'
    const method = editing ? 'PATCH' : 'POST'
    const r = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
      body: JSON.stringify({ name: name.trim(), message: message.trim() }),
    })
    setSaving(false)

    if (!r.ok) { const d = await r.json(); setError(d.error || 'Erro ao salvar'); return }

    closeForm()
    load(search)
  }

  const handleDelete = async (id: number) => {
    const r = await fetch(`/api/quick-replies/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token()}` },
    })
    if (r.ok) { setDeleting(null); load(search) }
  }

  const handleSearch = (v: string) => { setSearch(v); load(v) }

  return (
    <div className={s.container}>
      {/* Header */}
      <div className={s.pageHeader}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <button onClick={() => router.push('/dashboard/admin')} className={`${s.btn} ${s.btnGhost}`} style={{ padding: '8px 12px' }}>
            <ArrowLeft size={16} /> Voltar
          </button>
          <div style={{
            width: 44, height: 44, borderRadius: 14,
            background: 'linear-gradient(135deg, rgba(139,92,246,0.2) 0%, rgba(99,102,241,0.2) 100%)',
            border: '1px solid rgba(139,92,246,0.35)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#7c3aed',
          }}>
            <Zap size={22} />
          </div>
          <div>
            <h1 className={s.pageTitle}>Respostas Rápidas</h1>
            <p className={s.pageSubtitle}>Use <strong>/nome</strong> no chat para inserir instantaneamente</p>
          </div>
        </div>

        <button onClick={openCreate} className={`${s.btn} ${s.btnPrimary}`}>
          <Plus size={16} /> Nova resposta
        </button>
      </div>

      {/* Busca */}
      <div style={{ position: 'relative' }}>
        <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#a78bfa', pointerEvents: 'none' }} />
        <input
          value={search}
          onChange={e => handleSearch(e.target.value)}
          placeholder="Buscar por nome do atalho..."
          className={s.input}
          style={{ paddingLeft: 40 }}
        />
      </div>

      {/* Lista */}
      {loading ? (
        <div className={s.spinnerWrap}><div className={s.spinner} /></div>
      ) : replies.length === 0 ? (
        <div className={s.card} style={{ textAlign: 'center', padding: '48px 20px' }}>
          <MessageSquareText size={40} style={{ color: '#cbd5e1', margin: '0 auto 16px' }} />
          <p style={{ color: '#94a3b8', fontWeight: 600, marginBottom: 6 }}>Nenhuma resposta cadastrada</p>
          <p style={{ color: '#cbd5e1', fontSize: '0.875rem' }}>Crie a primeira usando o botão acima</p>
        </div>
      ) : (
        <div className={s.card} style={{ padding: 0, overflow: 'hidden' }}>
          {replies.map((r, i) => (
            <div key={r.id} style={{
              display: 'flex', alignItems: 'flex-start', gap: 14, padding: '16px 20px',
              borderBottom: i < replies.length - 1 ? '1px solid rgba(226,232,240,0.7)' : 'none',
            }}>
              {/* Chip do atalho */}
              <div style={{
                flexShrink: 0, marginTop: 2,
                background: 'linear-gradient(135deg, #ede9fe, #ddd6fe)',
                border: '1px solid #c4b5fd',
                borderRadius: 10, padding: '5px 12px',
                fontFamily: 'monospace', fontSize: '0.8125rem',
                fontWeight: 700, color: '#6d28d9', whiteSpace: 'nowrap',
              }}>
                /{r.name}
              </div>

              {/* Mensagem */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{
                  margin: 0, fontSize: '0.875rem', color: '#334155',
                  overflow: 'hidden', display: '-webkit-box',
                  WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                  lineHeight: 1.5,
                }}>
                  {r.message}
                </p>
              </div>

              {/* Ações */}
              <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                <button onClick={() => openEdit(r)} title="Editar" style={{
                  width: 32, height: 32, borderRadius: 8, border: '1px solid #e2e8f0',
                  background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', color: '#64748b', transition: 'all 0.15s',
                }}
                  onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = '#6366f1'; (e.currentTarget as HTMLButtonElement).style.color = '#6366f1' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = '#e2e8f0'; (e.currentTarget as HTMLButtonElement).style.color = '#64748b' }}
                >
                  <Pencil size={14} />
                </button>
                <button onClick={() => setDeleting(r.id)} title="Excluir" style={{
                  width: 32, height: 32, borderRadius: 8, border: '1px solid #fecaca',
                  background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', color: '#f87171', transition: 'all 0.15s',
                }}
                  onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#fef2f2' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'white' }}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ════ MODAL FORM ════ */}
      {showForm && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.45)',
          backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center',
          justifyContent: 'center', zIndex: 9999, padding: 20,
        }}>
          <div style={{
            background: 'white', borderRadius: 20, width: '100%', maxWidth: 540,
            boxShadow: '0 24px 64px rgba(0,0,0,0.18)', overflow: 'hidden',
          }}>
            {/* Modal header */}
            <div style={{
              padding: '22px 24px 18px', borderBottom: '1px solid #f1f5f9',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 38, height: 38, borderRadius: 11,
                  background: 'linear-gradient(135deg, #ede9fe, #ddd6fe)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#7c3aed',
                }}>
                  <Zap size={18} />
                </div>
                <div>
                  <h2 style={{ margin: 0, fontWeight: 700, fontSize: '1.0625rem', color: '#0f172a' }}>
                    {editing ? 'Editar resposta' : 'Nova resposta rápida'}
                  </h2>
                  <p style={{ margin: 0, fontSize: '0.8125rem', color: '#64748b' }}>
                    {editing ? `Editando /${editing.name}` : 'Preencha o atalho e a mensagem'}
                  </p>
                </div>
              </div>
              <button onClick={closeForm} style={{
                width: 32, height: 32, borderRadius: 8, border: 'none', background: '#f1f5f9',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b',
              }}>
                <X size={16} />
              </button>
            </div>

            {/* Modal body */}
            <form onSubmit={handleSave} style={{ padding: 24 }}>
              {/* Nome / atalho */}
              <div style={{ marginBottom: 18 }}>
                <label className={s.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{
                    background: '#ede9fe', color: '#7c3aed', borderRadius: 6,
                    padding: '1px 7px', fontFamily: 'monospace', fontWeight: 700, fontSize: '0.875rem',
                  }}>/</span>
                  Nome do atalho
                  <span style={{ color: '#ef4444', marginLeft: 2 }}>*</span>
                </label>
                <input
                  value={name}
                  onChange={e => setName(e.target.value.replace(/\s+/g, '_').toLowerCase())}
                  placeholder="ex: boa_tarde, saudacao, horario"
                  className={s.input}
                  autoFocus
                />
                <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: 5 }}>
                  Sem espaços — use _ para separar palavras. No chat: <code style={{ background: '#f1f5f9', padding: '1px 6px', borderRadius: 4 }}>/boa_tarde</code>
                </p>
              </div>

              {/* Mensagem */}
              <div style={{ marginBottom: 20 }}>
                <label className={s.label}>
                  Mensagem completa
                  <span style={{ color: '#ef4444', marginLeft: 4 }}>*</span>
                </label>
                <textarea
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  placeholder="Digite a mensagem que será enviada ao cliente..."
                  rows={5}
                  className={s.textarea}
                />
                <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: 5, textAlign: 'right' }}>
                  {message.length} caracteres
                </p>
              </div>

              {error && (
                <div className={s.errorBox} style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                  ⚠ {error}
                </div>
              )}

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button type="button" onClick={closeForm} className={`${s.btn} ${s.btnGhost}`}>
                  Cancelar
                </button>
                <button type="submit" disabled={saving} className={`${s.btn} ${s.btnPrimary}`} style={{ minWidth: 140 }}>
                  {saving
                    ? <><Loader2 size={15} style={{ animation: 'spin 0.8s linear infinite' }} /> Salvando...</>
                    : <><Save size={15} /> {editing ? 'Salvar alterações' : 'Criar resposta'}</>
                  }
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ════ CONFIRM DELETE ════ */}
      {deleting !== null && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.45)',
          backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center',
          justifyContent: 'center', zIndex: 9999, padding: 20,
        }}>
          <div style={{
            background: 'white', borderRadius: 20, width: '100%', maxWidth: 400,
            boxShadow: '0 24px 64px rgba(0,0,0,0.18)', padding: 28, textAlign: 'center',
          }}>
            <div style={{
              width: 56, height: 56, borderRadius: 16, background: '#fef2f2', border: '1px solid #fecaca',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#ef4444', margin: '0 auto 16px',
            }}>
              <Trash2 size={24} />
            </div>
            <h3 style={{ margin: '0 0 8px', fontWeight: 700, color: '#0f172a', fontSize: '1.0625rem' }}>
              Excluir resposta rápida?
            </h3>
            <p style={{ margin: '0 0 24px', color: '#64748b', fontSize: '0.875rem' }}>
              Esta ação não pode ser desfeita.
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button onClick={() => setDeleting(null)} className={`${s.btn} ${s.btnGhost}`}>
                Cancelar
              </button>
              <button onClick={() => handleDelete(deleting)} style={{
                padding: '10px 24px', borderRadius: 10, border: 'none',
                background: '#ef4444', color: 'white', fontWeight: 600,
                fontSize: '0.875rem', cursor: 'pointer',
              }}>
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
