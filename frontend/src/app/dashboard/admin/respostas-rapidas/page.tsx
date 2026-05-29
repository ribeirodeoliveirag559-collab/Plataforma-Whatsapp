'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft, Zap, Plus, Pencil, Trash2,
  Search, MessageSquareText, X,
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
  const [deleting, setDeleting] = useState<QuickReply | null>(null)

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

  const handleSearch = (v: string) => { setSearch(v); load(v) }

  const handleDelete = async (id: number) => {
    const r = await fetch(`/api/quick-replies/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token()}` },
    })
    if (r.ok) { setDeleting(null); load(search) }
  }

  return (
    <div className={s.container}>

      {/* ── Cabeçalho ── */}
      <div className={s.pageHeader}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <button onClick={() => router.push('/dashboard/admin')} className={`${s.btn} ${s.btnGhost}`} style={{ padding: '8px 12px' }}>
            <ArrowLeft size={16} /> Voltar
          </button>
          <div style={{
            width: 44, height: 44, borderRadius: 14,
            background: 'linear-gradient(135deg, rgba(124,58,237,0.2) 0%, rgba(99,102,241,0.2) 100%)',
            border: '1px solid rgba(124,58,237,0.35)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#7c3aed',
            boxShadow: '0 4px 14px rgba(124,58,237,0.18)',
          }}>
            <Zap size={22} />
          </div>
          <div>
            <h1 className={s.pageTitle}>Respostas Rápidas</h1>
            <p className={s.pageSubtitle}>
              {replies.length > 0
                ? `${replies.length} resposta${replies.length !== 1 ? 's' : ''} cadastrada${replies.length !== 1 ? 's' : ''}`
                : 'Use /nome no chat para inserir instantaneamente'}
            </p>
          </div>
        </div>

        <button onClick={() => router.push('/dashboard/admin/respostas-rapidas/nova')} className={`${s.btn} ${s.btnPrimary}`}>
          <Plus size={16} /> Nova resposta
        </button>
      </div>

      {/* ── Busca ── */}
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

      {/* ── Lista ── */}
      {loading ? (
        <div className={s.spinnerWrap}><div className={s.spinner} /></div>
      ) : replies.length === 0 ? (
        <div className={s.card} style={{ textAlign: 'center', padding: '56px 20px' }}>
          <MessageSquareText size={44} style={{ color: '#cbd5e1', margin: '0 auto 16px' }} />
          <p style={{ color: '#94a3b8', fontWeight: 600, fontSize: '1rem', marginBottom: 6 }}>Nenhuma resposta cadastrada</p>
          <p style={{ color: '#cbd5e1', fontSize: '0.875rem', marginBottom: 20 }}>Crie a primeira usando o botão acima</p>
          <button onClick={() => router.push('/dashboard/admin/respostas-rapidas/nova')} className={`${s.btn} ${s.btnPrimary}`}>
            <Plus size={16} /> Criar primeira resposta
          </button>
        </div>
      ) : (
        <div className={s.card} style={{ padding: 0, overflow: 'hidden' }}>
          {replies.map((r, i) => (
            <div key={r.id} style={{
              display: 'flex', alignItems: 'flex-start', gap: 14, padding: '16px 20px',
              borderBottom: i < replies.length - 1 ? '1px solid rgba(226,232,240,0.7)' : 'none',
              transition: 'background 0.15s',
            }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(245,243,255,0.5)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              {/* Chip do atalho */}
              <div style={{
                flexShrink: 0, marginTop: 2,
                background: 'linear-gradient(135deg, #ede9fe, #ddd6fe)',
                border: '1px solid #c4b5fd', borderRadius: 10,
                padding: '5px 12px', fontFamily: 'monospace',
                fontSize: '0.8125rem', fontWeight: 700, color: '#6d28d9', whiteSpace: 'nowrap',
              }}>
                /{r.name}
              </div>

              {/* Mensagem */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{
                  margin: 0, fontSize: '0.875rem', color: '#334155', lineHeight: 1.5,
                  overflow: 'hidden', display: '-webkit-box',
                  WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                }}>
                  {r.message}
                </p>
              </div>

              {/* Ações */}
              <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                <button
                  onClick={() => router.push(`/dashboard/admin/respostas-rapidas/${r.id}/editar`)}
                  title="Editar"
                  style={{
                    width: 34, height: 34, borderRadius: 9, border: '1px solid #e2e8f0',
                    background: 'white', cursor: 'pointer', display: 'flex',
                    alignItems: 'center', justifyContent: 'center', color: '#64748b', transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = '#6366f1'; (e.currentTarget as HTMLButtonElement).style.color = '#6366f1' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = '#e2e8f0'; (e.currentTarget as HTMLButtonElement).style.color = '#64748b' }}
                >
                  <Pencil size={14} />
                </button>
                <button
                  onClick={() => setDeleting(r)}
                  title="Excluir"
                  style={{
                    width: 34, height: 34, borderRadius: 9, border: '1px solid #fecaca',
                    background: 'white', cursor: 'pointer', display: 'flex',
                    alignItems: 'center', justifyContent: 'center', color: '#f87171', transition: 'all 0.15s',
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

      {/* ════ CONFIRM DELETE ════ */}
      {deleting && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.45)',
          backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center',
          justifyContent: 'center', zIndex: 9999, padding: 20,
        }}>
          <div style={{
            background: 'white', borderRadius: 20, width: '100%', maxWidth: 420,
            boxShadow: '0 24px 64px rgba(0,0,0,0.18)', overflow: 'hidden',
          }}>
            {/* header */}
            <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: '#fef2f2', border: '1px solid #fecaca', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444' }}>
                  <Trash2 size={18} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontWeight: 700, fontSize: '1rem', color: '#0f172a' }}>Excluir resposta rápida?</h3>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>Esta ação não pode ser desfeita</p>
                </div>
              </div>
              <button onClick={() => setDeleting(null)} style={{ width: 30, height: 30, borderRadius: 8, border: 'none', background: '#f1f5f9', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
                <X size={15} />
              </button>
            </div>
            {/* body */}
            <div style={{ padding: '18px 24px 24px' }}>
              <div style={{ background: '#faf5ff', border: '1px solid #e9d5ff', borderRadius: 12, padding: '12px 16px', marginBottom: 20 }}>
                <p style={{ margin: '0 0 4px', fontSize: '0.8rem', color: '#7c3aed', fontWeight: 600 }}>Atalho que será excluído:</p>
                <code style={{ fontSize: '0.9rem', fontWeight: 700, color: '#6d28d9' }}>/{deleting.name}</code>
                <p style={{ margin: '6px 0 0', fontSize: '0.8rem', color: '#94a3b8', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                  {deleting.message}
                </p>
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button onClick={() => setDeleting(null)} className={`${s.btn} ${s.btnGhost}`}>Cancelar</button>
                <button onClick={() => handleDelete(deleting.id)} style={{
                  padding: '10px 24px', borderRadius: 10, border: 'none',
                  background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                  color: 'white', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(239,68,68,0.35)',
                }}>
                  Excluir
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
