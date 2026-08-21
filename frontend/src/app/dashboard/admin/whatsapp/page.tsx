'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft, Smartphone, Wifi, WifiOff, Loader2,
  RefreshCw, LogOut, Copy, CheckCircle2, AlertTriangle,
  Bot, Zap, Server, Key, Trash2, X,
} from 'lucide-react'
import s from '../../dashboard.module.css'

interface WhatsAppStatus {
  configured:    boolean
  state:         'open' | 'close' | 'connecting' | 'not_configured'
  qr?:           { base64?: string; code?: string } | null
  instance?:     string
  webhookUrl?:   string
  porterEnabled: boolean
}

export default function WhatsAppAdminPage() {
  const router = useRouter()
  const token  = () => typeof window !== 'undefined' ? localStorage.getItem('token') ?? '' : ''

  const [status,      setStatus]      = useState<WhatsAppStatus | null>(null)
  const [loading,     setLoading]     = useState(true)
  const [fetchErr,    setFetchErr]    = useState<string | null>(null)
  const [actioning,   setActioning]   = useState(false)
  const [copied,      setCopied]      = useState(false)
  const [showCleanup, setShowCleanup] = useState(false)
  const [cleanupResult, setCleanupResult] = useState<Record<string, number> | null>(null)

  const fetchStatus = useCallback(async () => {
    try {
      const r = await fetch('/api/admin/whatsapp', {
        headers: { Authorization: `Bearer ${token()}`, 'Cache-Control': 'no-cache' },
      })
      const data = await r.json()
      if (r.ok) {
        setStatus(data)
        setFetchErr(null)
      } else {
        setFetchErr(`Erro ${r.status}: ${data?.error || 'Acesso negado'}`)
      }
    } catch (e: any) {
      setFetchErr(`Erro de rede: ${e?.message}`)
    } finally {
      setLoading(false)
    }
  }, []) // eslint-disable-line

  useEffect(() => { fetchStatus() }, [fetchStatus])

  /* Refresh automático quando conectando ou desconectado (para pegar QR atualizado) */
  useEffect(() => {
    if (!status) return
    if (status.state === 'open') return
    const t = setInterval(fetchStatus, 8000)
    return () => clearInterval(t)
  }, [status, fetchStatus])

  const action = async (act: string) => {
    setActioning(true)
    await fetch('/api/admin/whatsapp', {
      method:  'POST',
      headers: { Authorization: `Bearer ${token()}`, 'Content-Type': 'application/json' },
      body:    JSON.stringify({ action: act }),
    })
    setActioning(false)
    fetchStatus()
  }

  const copyWebhook = () => {
    if (!status?.webhookUrl) return
    navigator.clipboard.writeText(status.webhookUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleCleanup = async () => {
    const r = await fetch('/api/admin/cleanup', {
      method:  'DELETE',
      headers: { Authorization: `Bearer ${token()}` },
    })
    const d = await r.json()
    if (r.ok) { setCleanupResult(d.deleted); setShowCleanup(false) }
  }

  /* ── Helpers de UI ── */
  const StateChip = () => {
    if (!status?.configured) return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#fef3c7', color: '#d97706', border: '1px solid #fcd34d', borderRadius: 99, padding: '4px 14px', fontWeight: 700, fontSize: '0.8125rem' }}>
        <AlertTriangle size={13} /> Não configurado
      </span>
    )
    if (status.state === 'open') return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#dcfce7', color: '#16a34a', border: '1px solid #86efac', borderRadius: 99, padding: '4px 14px', fontWeight: 700, fontSize: '0.8125rem' }}>
        <Wifi size={13} /> Conectado
      </span>
    )
    if (status.state === 'connecting') return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#dbeafe', color: '#2563eb', border: '1px solid #93c5fd', borderRadius: 99, padding: '4px 14px', fontWeight: 700, fontSize: '0.8125rem' }}>
        <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> Conectando...
      </span>
    )
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#fee2e2', color: '#dc2626', border: '1px solid #fca5a5', borderRadius: 99, padding: '4px 14px', fontWeight: 700, fontSize: '0.8125rem' }}>
        <WifiOff size={13} /> Desconectado
      </span>
    )
  }

  return (
    <div className={s.container}>
      {/* ── Header ── */}
      <div className={s.pageHeader}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <button onClick={() => router.push('/dashboard/admin')} className={`${s.btn} ${s.btnGhost}`} style={{ padding: '8px 12px' }}>
            <ArrowLeft size={16} /> Voltar
          </button>
          <div style={{ width: 44, height: 44, borderRadius: 14, background: 'linear-gradient(135deg, #dcfce7, #bbf7d0)', border: '1px solid #86efac', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#16a34a', boxShadow: '0 4px 14px rgba(22,163,74,0.2)' }}>
            <Smartphone size={22} />
          </div>
          <div>
            <h1 className={s.pageTitle}>WhatsApp</h1>
            <p className={s.pageSubtitle}>Conexão e porteiro IA</p>
          </div>
        </div>
        <StateChip />
      </div>

      {loading ? (
        <div className={s.spinnerWrap}><div className={s.spinner} /></div>
      ) : (
        <div style={{ display: 'grid', gap: 20 }}>

          {/* ════ Card: erro de autenticação / rede ════ */}
          {fetchErr && (
            <div className={s.card} style={{ borderLeft: '4px solid #f59e0b', display: 'flex', alignItems: 'center', gap: 14 }}>
              <AlertTriangle size={22} style={{ color: '#d97706', flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <p style={{ margin: '0 0 6px', fontWeight: 700, color: '#1e293b' }}>Sessão expirada ou acesso negado</p>
                <p style={{ margin: '0 0 10px', fontSize: '0.8125rem', color: '#64748b' }}>{fetchErr}</p>
                <button onClick={() => { localStorage.clear(); router.push('/auth/login') }}
                  className={`${s.btn} ${s.btnPrimary}`} style={{ fontSize: '0.8125rem' }}>
                  Fazer login novamente
                </button>
              </div>
            </div>
          )}

          {/* ════ Card: não configurado ════ */}
          {!status?.configured && (
            <div className={s.card} style={{ borderLeft: '4px solid #f59e0b' }}>
              <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#d97706', flexShrink: 0 }}>
                  <AlertTriangle size={22} />
                </div>
                <div>
                  <h2 style={{ margin: '0 0 8px', fontWeight: 700, color: '#1e293b', fontSize: '1rem' }}>Evolution API não configurada</h2>
                  <p style={{ margin: '0 0 16px', color: '#64748b', fontSize: '0.875rem', lineHeight: 1.6 }}>
                    Para conectar o WhatsApp real, você precisa hospedar a Evolution API e adicionar as variáveis de ambiente na Vercel.
                  </p>

                  <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: 16, marginBottom: 16 }}>
                    <p style={{ margin: '0 0 10px', fontWeight: 700, fontSize: '0.875rem', color: '#334155' }}>Passo a passo:</p>
                    <ol style={{ margin: 0, paddingLeft: 20, fontSize: '0.8125rem', color: '#475569', lineHeight: 2 }}>
                      <li>Acesse <strong>railway.app</strong> e crie uma conta gratuita</li>
                      <li>Clique em <strong>New Project → Deploy from Docker Image</strong></li>
                      <li>Use a imagem: <code style={{ background: '#e2e8f0', padding: '1px 6px', borderRadius: 4 }}>atendai/evolution-api:latest</code></li>
                      <li>Adicione a variável <code style={{ background: '#e2e8f0', padding: '1px 6px', borderRadius: 4 }}>AUTHENTICATION_API_KEY</code> com uma senha forte</li>
                      <li>Copie a URL pública gerada pelo Railway</li>
                    </ol>
                  </div>

                  <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: 16 }}>
                    <p style={{ margin: '0 0 10px', fontWeight: 700, fontSize: '0.875rem', color: '#334155', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Key size={14} /> Variáveis de ambiente (adicionar na Vercel)
                    </p>
                    {[
                      ['EVOLUTION_API_URL',  'https://seu-app.up.railway.app'],
                      ['EVOLUTION_API_KEY',  'sua-chave-do-railway'],
                      ['EVOLUTION_INSTANCE', 'phinfo'],
                      ['OPENAI_API_KEY',     'sk-... (obter em platform.openai.com)'],
                      ['WEBHOOK_SECRET',     'uma-senha-secreta-qualquer'],
                      ['NEXT_PUBLIC_URL',    'https://seu-app.vercel.app'],
                    ].map(([k, v]) => (
                      <div key={k} style={{ display: 'flex', gap: 8, marginBottom: 6, fontSize: '0.8125rem', flexWrap: 'wrap' }}>
                        <code style={{ background: '#ddd6fe', color: '#5b21b6', borderRadius: 5, padding: '2px 8px', fontWeight: 700 }}>{k}</code>
                        <span style={{ color: '#64748b' }}>=</span>
                        <code style={{ background: '#f1f5f9', color: '#475569', borderRadius: 5, padding: '2px 8px' }}>{v}</code>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ════ Card: QR code / conectar ════ */}
          {status?.configured && status.state !== 'open' && (
            <div className={s.card} style={{ textAlign: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#16a34a' }}>
                  <Smartphone size={18} />
                </div>
                <div style={{ textAlign: 'left' }}>
                  <h2 style={{ margin: 0, fontWeight: 700, color: '#1e293b', fontSize: '1rem' }}>Escanear QR Code</h2>
                  <p style={{ margin: 0, fontSize: '0.8125rem', color: '#64748b' }}>Abra o WhatsApp → Dispositivos vinculados → Vincular dispositivo</p>
                </div>
              </div>

              {status.qr?.base64 ? (
                <div>
                  <img
                    src={status.qr.base64.startsWith('data:') ? status.qr.base64 : `data:image/png;base64,${status.qr.base64}`}
                    alt="QR Code WhatsApp"
                    style={{ width: 220, height: 220, borderRadius: 12, border: '4px solid #f1f5f9', margin: '0 auto 16px' }}
                  />
                  <p style={{ color: '#94a3b8', fontSize: '0.8125rem', marginBottom: 12 }}>
                    QR Code expira em 60s — atualizando automaticamente
                  </p>
                  <button onClick={fetchStatus} disabled={actioning} className={`${s.btn} ${s.btnGhost}`}>
                    <RefreshCw size={14} /> Atualizar QR
                  </button>
                </div>
              ) : (
                <div style={{ padding: '24px 0' }}>
                  <p style={{ color: '#64748b', marginBottom: 16 }}>Gere o QR Code para conectar</p>
                  <button onClick={() => action('create')} disabled={actioning} className={`${s.btn} ${s.btnPrimary}`}>
                    {actioning ? <Loader2 size={15} style={{ animation: 'spin 0.8s linear infinite' }} /> : <Smartphone size={15} />}
                    {actioning ? 'Criando instância...' : 'Criar instância e gerar QR'}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ════ Card: conectado ════ */}
          {status?.configured && status.state === 'open' && (
            <div className={s.card} style={{ borderLeft: '4px solid #22c55e' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 48, height: 48, borderRadius: 14, background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#16a34a' }}>
                    <CheckCircle2 size={26} />
                  </div>
                  <div>
                    <p style={{ margin: 0, fontWeight: 700, color: '#16a34a', fontSize: '1.0625rem' }}>WhatsApp conectado! 🎉</p>
                    <p style={{ margin: 0, color: '#64748b', fontSize: '0.8125rem' }}>Instância: <strong>{status.instance}</strong> — mensagens chegando em tempo real</p>
                  </div>
                </div>
                <button onClick={() => action('logout')} disabled={actioning} className={`${s.btn} ${s.btnGhost}`} style={{ color: '#ef4444', borderColor: '#fca5a5' }}>
                  <LogOut size={14} /> Desconectar
                </button>
              </div>
            </div>
          )}

          {/* ════ Card: Porteiro IA ════ */}
          {status?.configured && (
            <div className={s.card}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: status.porterEnabled ? '#ede9fe' : '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: status.porterEnabled ? '#7c3aed' : '#94a3b8' }}>
                  <Bot size={18} />
                </div>
                <div>
                  <h2 style={{ margin: 0, fontWeight: 700, color: '#1e293b', fontSize: '1rem' }}>Porteiro IA</h2>
                  <p style={{ margin: 0, fontSize: '0.8125rem', color: '#64748b' }}>GPT-4o-mini responde automaticamente mensagens novas</p>
                </div>
                <span style={{
                  marginLeft: 'auto', padding: '3px 12px', borderRadius: 99, fontSize: '0.75rem', fontWeight: 700,
                  background: status.porterEnabled ? '#dcfce7' : '#fee2e2',
                  color:      status.porterEnabled ? '#16a34a' : '#dc2626',
                  border:     `1px solid ${status.porterEnabled ? '#86efac' : '#fca5a5'}`,
                }}>
                  {status.porterEnabled ? '✓ Ativo' : '✗ Inativo'}
                </span>
              </div>

              {!status.porterEnabled && (
                <div style={{ background: '#fef3c7', border: '1px solid #fcd34d', borderRadius: 10, padding: '10px 14px', fontSize: '0.8125rem', color: '#92400e' }}>
                  <strong>OPENAI_API_KEY</strong> não configurada. Adicione nas variáveis de ambiente da Vercel. Obtenha em <strong>platform.openai.com/api-keys</strong>
                </div>
              )}

              {status.porterEnabled && (
                <div style={{ background: '#f5f3ff', border: '1px solid #ddd6fe', borderRadius: 10, padding: '12px 14px', fontSize: '0.8125rem', color: '#6d28d9', lineHeight: 1.6 }}>
                  O porteiro responde automaticamente quando uma mensagem nova chega (ticket PENDING). Ele coleta nome, empresa e motivo, e então encaminha para o departamento correto. Quando um atendente assume (OPEN), o porteiro para de responder.
                </div>
              )}
            </div>
          )}

          {/* ════ Card: Webhook URL ════ */}
          {status?.configured && status.webhookUrl && (
            <div className={s.card}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#16a34a' }}>
                  <Server size={18} />
                </div>
                <div>
                  <h2 style={{ margin: 0, fontWeight: 700, color: '#1e293b', fontSize: '1rem' }}>URL do Webhook</h2>
                  <p style={{ margin: 0, fontSize: '0.8125rem', color: '#64748b' }}>Configure esta URL na Evolution API</p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <code style={{
                  flex: 1, background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10,
                  padding: '10px 14px', fontSize: '0.8125rem', color: '#475569',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {status.webhookUrl}
                </code>
                <button onClick={copyWebhook} className={`${s.btn} ${s.btnGhost}`} style={{ flexShrink: 0 }}>
                  {copied ? <CheckCircle2 size={14} style={{ color: '#22c55e' }} /> : <Copy size={14} />}
                  {copied ? 'Copiado!' : 'Copiar'}
                </button>
              </div>

              <button onClick={() => action('set_webhook')} disabled={actioning} className={`${s.btn} ${s.btnGhost}`} style={{ marginTop: 10, fontSize: '0.8125rem' }}>
                <Zap size={13} /> Aplicar webhook na Evolution API automaticamente
              </button>
            </div>
          )}

          {/* ════ Card: Limpar dados simulados ════ */}
          <div className={s.card} style={{ borderLeft: '4px solid #ef4444' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444', flexShrink: 0 }}>
                <Trash2 size={20} />
              </div>
              <div style={{ flex: 1 }}>
                <h2 style={{ margin: '0 0 6px', fontWeight: 700, color: '#1e293b', fontSize: '1rem' }}>Limpar dados simulados</h2>
                <p style={{ margin: '0 0 14px', color: '#64748b', fontSize: '0.875rem' }}>
                  Remove todos os contatos, atendimentos e mensagens de teste. Usuários, departamentos e respostas rápidas são mantidos.
                </p>
                {cleanupResult && (
                  <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 10, padding: '10px 14px', marginBottom: 14, fontSize: '0.8125rem', color: '#166534' }}>
                    ✅ Limpeza concluída! Removidos: {cleanupResult.messages} msgs · {cleanupResult.tickets} tickets · {cleanupResult.contacts} contatos
                  </div>
                )}
                <button onClick={() => setShowCleanup(true)} className={`${s.btn} ${s.btnGhost}`} style={{ color: '#ef4444', borderColor: '#fca5a5' }}>
                  <Trash2 size={14} /> Limpar banco de dados
                </button>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* ════ Confirm cleanup ════ */}
      {showCleanup && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 20 }}>
          <div style={{ background: 'white', borderRadius: 20, width: '100%', maxWidth: 420, boxShadow: '0 24px 64px rgba(0,0,0,0.18)', overflow: 'hidden' }}>
            <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444' }}>
                  <AlertTriangle size={18} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontWeight: 700, color: '#0f172a', fontSize: '1rem' }}>Limpar dados de teste?</h3>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>Esta ação não pode ser desfeita</p>
                </div>
              </div>
              <button onClick={() => setShowCleanup(false)} style={{ width: 30, height: 30, borderRadius: 8, border: 'none', background: '#f1f5f9', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
                <X size={15} />
              </button>
            </div>
            <div style={{ padding: 24 }}>
              <p style={{ margin: '0 0 20px', fontSize: '0.875rem', color: '#475569', lineHeight: 1.6 }}>
                Serão deletados permanentemente todos os <strong>contatos</strong>, <strong>atendimentos</strong>, <strong>mensagens</strong> e <strong>agendamentos</strong> do banco de dados.
              </p>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button onClick={() => setShowCleanup(false)} className={`${s.btn} ${s.btnGhost}`}>Cancelar</button>
                <button onClick={handleCleanup} style={{ padding: '10px 24px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg, #ef4444, #dc2626)', color: 'white', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer', boxShadow: '0 4px 12px rgba(239,68,68,0.35)' }}>
                  Confirmar limpeza
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
