'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft, Bot, Save, Loader2, CheckCircle2,
  Building2, Clock, MapPin, Phone, StickyNote,
  MessageSquare, ListChecks, User, ToggleLeft, ToggleRight,
} from 'lucide-react'
import s from '../../dashboard.module.css'

interface AIConfig {
  porterName:         string
  companyName:        string
  companyCity:        string
  companyDescription: string
  businessHours:      string
  companyAddress:     string
  companyPhone:       string
  greetingMessage:    string
  additionalRules:    string
  collectCompany:     boolean
}

const DEFAULT: AIConfig = {
  porterName: 'Sofia', companyName: 'PH Informática', companyCity: 'Itumbiara-GO',
  companyDescription: '', businessHours: '', companyAddress: '', companyPhone: '',
  greetingMessage: '', additionalRules: '', collectCompany: true,
}

export default function PorteiroConfigPage() {
  const router = useRouter()
  const token  = () => typeof window !== 'undefined' ? localStorage.getItem('token') ?? '' : ''

  const [cfg,     setCfg]     = useState<AIConfig>(DEFAULT)
  const [loading, setLoading] = useState(true)
  const [saving,  setSaving]  = useState(false)
  const [saved,   setSaved]   = useState(false)
  const [error,   setError]   = useState('')

  useEffect(() => {
    fetch('/api/admin/ai-config', { headers: { Authorization: `Bearer ${token()}` } })
      .then(r => r.json())
      .then(d => { if (d.porterName) setCfg(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, []) // eslint-disable-line

  const set = (key: keyof AIConfig, value: string | boolean) =>
    setCfg(prev => ({ ...prev, [key]: value }))

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(''); setSaving(true)
    const r = await fetch('/api/admin/ai-config', {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
      body:    JSON.stringify(cfg),
    })
    setSaving(false)
    if (!r.ok) { const d = await r.json(); setError(d.error || 'Erro ao salvar'); return }
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  if (loading) return <div className={s.container}><div className={s.spinnerWrap}><div className={s.spinner} /></div></div>

  return (
    <div className={s.container}>

      {/* ── Header ── */}
      <div className={s.pageHeader}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <button onClick={() => router.push('/dashboard/admin')} className={`${s.btn} ${s.btnGhost}`} style={{ padding: '8px 12px' }}>
            <ArrowLeft size={16} /> Voltar
          </button>
          <div style={{
            width: 44, height: 44, borderRadius: 14,
            background: 'linear-gradient(135deg, rgba(124,58,237,0.18), rgba(99,102,241,0.18))',
            border: '1px solid rgba(124,58,237,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#7c3aed',
          }}>
            <Bot size={22} />
          </div>
          <div>
            <h1 className={s.pageTitle}>Porteiro IA</h1>
            <p className={s.pageSubtitle}>Configure o assistente virtual que recepciona os clientes</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSave}>
        <div style={{ display: 'grid', gap: 24 }}>

          {/* ════ SEÇÃO 1 — Identidade ════ */}
          <div className={s.card}>
            <SectionTitle icon={<User size={16} />} label="Identidade do assistente" />

            <div className={s.grid2} style={{ marginTop: 20 }}>
              <div>
                <label className={s.label}>Nome do assistente virtual</label>
                <input
                  value={cfg.porterName}
                  onChange={e => set('porterName', e.target.value)}
                  placeholder="Ex: Sofia, Ana, João..."
                  className={s.input}
                />
                <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: 5 }}>
                  Este nome aparece nas mensagens: "Olá, sou a <strong>{cfg.porterName || '...'}</strong>"
                </p>
              </div>

              <div>
                <label className={s.label}>Perguntar nome da empresa?</label>
                <button
                  type="button"
                  onClick={() => set('collectCompany', !cfg.collectCompany)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    background: cfg.collectCompany ? '#f5f3ff' : '#f8fafc',
                    border: `2px solid ${cfg.collectCompany ? '#c4b5fd' : '#e2e8f0'}`,
                    borderRadius: 12, padding: '10px 16px', cursor: 'pointer',
                    transition: 'all 0.15s', width: '100%',
                  }}
                >
                  {cfg.collectCompany
                    ? <ToggleRight size={22} style={{ color: '#7c3aed' }} />
                    : <ToggleLeft  size={22} style={{ color: '#94a3b8' }} />}
                  <span style={{ fontSize: '0.875rem', fontWeight: 600, color: cfg.collectCompany ? '#7c3aed' : '#64748b' }}>
                    {cfg.collectCompany ? 'Sim — coleta nome da empresa' : 'Não — apenas nome do cliente'}
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* ════ SEÇÃO 2 — Informações da empresa ════ */}
          <div className={s.card}>
            <SectionTitle icon={<Building2 size={16} />} label="Informações da empresa" />
            <p style={{ fontSize: '0.8125rem', color: '#64748b', marginTop: 6, marginBottom: 20 }}>
              O assistente usa essas informações para responder dúvidas sobre a empresa.
            </p>

            <div className={s.grid2}>
              <div>
                <label className={s.label}>Nome da empresa</label>
                <input value={cfg.companyName} onChange={e => set('companyName', e.target.value)} placeholder="Ex: PH Informática" className={s.input} />
              </div>
              <div>
                <label className={s.label}>Cidade / Estado</label>
                <input value={cfg.companyCity} onChange={e => set('companyCity', e.target.value)} placeholder="Ex: Itumbiara-GO" className={s.input} />
              </div>
            </div>

            <div style={{ marginTop: 16 }}>
              <label className={s.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Building2 size={13} /> Descrição / serviços oferecidos
              </label>
              <textarea
                value={cfg.companyDescription}
                onChange={e => set('companyDescription', e.target.value)}
                placeholder="Ex: Empresa de informática especializada em suporte técnico, venda de equipamentos, automação comercial com o sistema Clipp Pro, conserto de computadores e impressoras."
                rows={4}
                className={s.textarea}
              />
            </div>

            <div className={s.grid2} style={{ marginTop: 16 }}>
              <div>
                <label className={s.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Clock size={13} /> Horário de atendimento
                </label>
                <input
                  value={cfg.businessHours}
                  onChange={e => set('businessHours', e.target.value)}
                  placeholder="Ex: Seg-Sex 8h-18h, Sáb 8h-12h"
                  className={s.input}
                />
              </div>
              <div>
                <label className={s.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Phone size={13} /> Telefone / contato adicional
                </label>
                <input
                  value={cfg.companyPhone}
                  onChange={e => set('companyPhone', e.target.value)}
                  placeholder="Ex: (64) 3090-0000"
                  className={s.input}
                />
              </div>
            </div>

            <div style={{ marginTop: 16 }}>
              <label className={s.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <MapPin size={13} /> Endereço
              </label>
              <input
                value={cfg.companyAddress}
                onChange={e => set('companyAddress', e.target.value)}
                placeholder="Ex: Rua das Acácias, 123 — Centro, Itumbiara-GO"
                className={s.input}
              />
            </div>
          </div>

          {/* ════ SEÇÃO 3 — Mensagem de boas-vindas ════ */}
          <div className={s.card}>
            <SectionTitle icon={<MessageSquare size={16} />} label="Mensagem de boas-vindas" />
            <p style={{ fontSize: '0.8125rem', color: '#64748b', marginTop: 6, marginBottom: 16 }}>
              Enviada automaticamente na <strong>primeira mensagem</strong> do cliente. Se deixar vazio, a IA gera uma saudação sozinha.
            </p>

            <textarea
              value={cfg.greetingMessage}
              onChange={e => set('greetingMessage', e.target.value)}
              placeholder={`Ex: Olá! 😊 Seja bem-vindo à ${cfg.companyName || 'nossa empresa'}! Sou ${cfg.porterName || 'Sofia'}, sua assistente virtual. Como posso te ajudar hoje?`}
              rows={4}
              className={s.textarea}
            />
            <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: 5, textAlign: 'right' }}>
              {cfg.greetingMessage.length} caracteres
            </p>
          </div>

          {/* ════ SEÇÃO 4 — Instruções adicionais ════ */}
          <div className={s.card}>
            <SectionTitle icon={<ListChecks size={16} />} label="Instruções adicionais" />
            <p style={{ fontSize: '0.8125rem', color: '#64748b', marginTop: 6, marginBottom: 16 }}>
              Regras extras que o assistente deve seguir. Escreva em linguagem natural.
            </p>

            <textarea
              value={cfg.additionalRules}
              onChange={e => set('additionalRules', e.target.value)}
              placeholder={`Exemplos de instruções:\n- Nunca forneça preços sem encaminhar para o atendente de Vendas\n- Se o cliente mencionar "urgente" ou "não está funcionando", encaminhe imediatamente para Suporte\n- Sempre pergunte o número de série do equipamento em casos de conserto\n- Não agende visitas técnicas diretamente, encaminhe para o departamento de OS\n- Se perguntar sobre boleto ou pagamento, encaminhe para Financeiro`}
              rows={8}
              className={s.textarea}
            />
            <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: 5, textAlign: 'right' }}>
              {cfg.additionalRules.length} caracteres
            </p>
          </div>

          {/* ════ Preview do prompt ════ */}
          <details style={{ cursor: 'pointer' }}>
            <summary style={{ fontWeight: 600, color: '#64748b', fontSize: '0.875rem', padding: '8px 0', userSelect: 'none' }}>
              🔍 Ver preview do que o assistente recebe (prompt completo)
            </summary>
            <div style={{
              marginTop: 10, background: '#0f172a', borderRadius: 12, padding: '16px 20px',
              fontFamily: 'monospace', fontSize: '0.8rem', color: '#94a3b8', lineHeight: 1.7,
              whiteSpace: 'pre-wrap', border: '1px solid #1e293b',
            }}>
{`Você é ${cfg.porterName || 'Sofia'}, a recepcionista virtual da ${cfg.companyName || 'empresa'}.

INFORMAÇÕES DA EMPRESA:
Empresa: ${cfg.companyName || '—'}${cfg.companyCity ? ` — ${cfg.companyCity}` : ''}
${cfg.companyDescription ? `Descrição: ${cfg.companyDescription}` : ''}${cfg.businessHours ? `\nHorário: ${cfg.businessHours}` : ''}${cfg.companyAddress ? `\nEndereço: ${cfg.companyAddress}` : ''}${cfg.companyPhone ? `\nTelefone: ${cfg.companyPhone}` : ''}

DEPARTAMENTOS: [carregados do banco em tempo real]

MISSÃO: Cumprimentar, coletar nome${cfg.collectCompany ? ' + empresa' : ''} + motivo, encaminhar.
${cfg.additionalRules ? `\nINSTRUÇÕES ADICIONAIS:\n${cfg.additionalRules}` : ''}`}
            </div>
          </details>

          {/* ════ DICA ════ */}
          <div style={{
            background: 'linear-gradient(135deg, #faf5ff, #f5f3ff)',
            border: '1px solid #e9d5ff', borderRadius: 14, padding: '16px 20px',
            display: 'flex', alignItems: 'flex-start', gap: 12,
          }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: '#ede9fe', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#7c3aed', flexShrink: 0 }}>
              <StickyNote size={16} />
            </div>
            <div>
              <p style={{ margin: '0 0 4px', fontWeight: 700, fontSize: '0.875rem', color: '#5b21b6' }}>Como o porteiro funciona</p>
              <p style={{ margin: 0, fontSize: '0.8125rem', color: '#7c3aed', lineHeight: 1.6 }}>
                Quando um cliente manda uma mensagem nova no WhatsApp, o porteiro responde automaticamente, coleta as informações e encaminha para o departamento correto. O ticket fica como <strong>Pendente</strong> aguardando um atendente assumir. Quando o atendente assume, o porteiro para de responder.
              </p>
            </div>
          </div>

          {error && (
            <div className={s.errorBox} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              ⚠ {error}
            </div>
          )}

          {/* ════ AÇÕES ════ */}
          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
            <button type="button" onClick={() => router.push('/dashboard/admin')} className={`${s.btn} ${s.btnGhost}`}>
              Cancelar
            </button>
            <button type="submit" disabled={saving} className={`${s.btn} ${s.btnPrimary}`} style={{ minWidth: 200 }}>
              {saving
                ? <><Loader2 size={15} style={{ animation: 'spin 0.8s linear infinite' }} /> Salvando...</>
                : saved
                  ? <><CheckCircle2 size={15} /> Salvo com sucesso!</>
                  : <><Save size={15} /> Salvar configurações</>
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
