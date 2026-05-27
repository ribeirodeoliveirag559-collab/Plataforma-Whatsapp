'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import {
  Clock, CheckCircle, MessageSquare, RefreshCw, Send,
  UserCheck, X, ChevronRight, Building2, Phone, Bot,
  ArrowLeftRight, Eye, EyeOff,
} from 'lucide-react'

type TicketStatus = 'PENDING' | 'OPEN' | 'CLOSED'

interface Contact { id: number; name: string; number: string; profilePicUrl: string | null; company?: string | null }
interface Queue   { id: number; name: string; color: string }
interface User    { id: number; name: string; avatar: string | null }
interface Ticket  {
  id: number; status: TicketStatus; lastMessage: string | null
  unreadMessages: number; aiSummary: string | null
  contact: Contact; queue: Queue | null; user: User | null
  updatedAt: string; createdAt: string
}
interface Message {
  id: number; body: string | null; fromMe: boolean
  mediaType: string; createdAt: string
  sender: { id: number; name: string } | null
}

const STATUS_TABS = [
  { key: 'PENDING' as TicketStatus, label: 'Pendentes',       icon: Clock,          color: 'text-amber-500',  activeClass: 'bg-amber-50 text-amber-600 border-amber-300' },
  { key: 'OPEN'    as TicketStatus, label: 'Em Atendimento',  icon: MessageSquare,  color: 'text-indigo-600', activeClass: 'bg-indigo-50 text-indigo-600 border-indigo-300' },
  { key: 'CLOSED'  as TicketStatus, label: 'Encerrados',      icon: CheckCircle,    color: 'text-slate-500',  activeClass: 'bg-slate-100 text-slate-600 border-slate-300' },
]

function avatar(name: string, number: string) {
  return name ? name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : number.slice(-2)
}
function timeAgo(iso: string) {
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60000)
  if (m < 1) return 'agora'
  if (m < 60) return `${m}m`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h`
  return `${Math.floor(h / 24)}d`
}
function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

// ─────────────────────────────────────────────────────
export default function AtendimentosPage() {
  const [tab, setTab]           = useState<TicketStatus>('PENDING')
  const [tickets, setTickets]   = useState<Ticket[]>([])
  const [selected, setSelected] = useState<Ticket | null>(null)
  const [loading, setLoading]   = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [showAll, setShowAll]   = useState(false)   // toggle "ver todas"
  const [queues, setQueues]     = useState<Queue[]>([])

  const token = () => localStorage.getItem('token') ?? ''

  const fetchTickets = useCallback(async (status: TicketStatus, all = false) => {
    setLoading(true)
    setFetchError(null)
    try {
      const r = await fetch(`/api/tickets?status=${status}&showAll=${all}&pageNumber=1`, {
        headers: { Authorization: `Bearer ${token()}` },
      })
      if (!r.ok) {
        const err = await r.json().catch(() => ({ error: `HTTP ${r.status}` }))
        setFetchError(err.error ?? `Erro ${r.status}`)
        setTickets([])
        return
      }
      const d = await r.json()
      setTickets(d.tickets ?? [])
    } catch (e) {
      setFetchError(e instanceof Error ? e.message : 'Erro de conexão')
      setTickets([])
    } finally { setLoading(false) }
  }, [])

  useEffect(() => {
    fetch('/api/admin/queues', { headers: { Authorization: `Bearer ${token()}` } })
      .then(r => r.json()).then(d => setQueues(Array.isArray(d) ? d : []))
  }, [])

  useEffect(() => { fetchTickets(tab, showAll); setSelected(null) }, [tab, showAll, fetchTickets])

  // Após aceitar/encerrar/transferir, remove da lista e fecha painel
  const afterAction = useCallback((updated: Ticket) => {
    setTickets(prev => prev.filter(t => t.id !== updated.id))
    setSelected(null)
  }, [])

  // Atualiza ticket selecionado na lista (ex: ao enviar msg)
  const updateSelected = useCallback((t: Ticket) => {
    setSelected(t)
    setTickets(prev => prev.map(p => p.id === t.id ? t : p))
  }, [])

  const currentTab = STATUS_TABS.find(t => t.key === tab)!

  return (
    <div
      className="flex h-full overflow-hidden"
      style={{
        margin: '0 16px 16px',
        borderRadius: '20px',
        border: '1px solid rgba(196, 181, 253, 0.35)',
        boxShadow: '0 10px 40px -10px rgba(99, 102, 241, 0.18), 0 4px 16px -4px rgba(167, 139, 250, 0.15)',
      }}
    >

      {/* ══ PAINEL ESQUERDO — lista ══ */}
      <aside className="w-80 xl:w-96 shrink-0 flex flex-col border-r border-slate-200 bg-white">

        {/* Header */}
        <div className="px-4 pt-4 pb-3 border-b border-slate-100 space-y-3">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-bold text-slate-800">Atendimentos</h1>
            <button onClick={() => fetchTickets(tab, showAll)}
              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors">
              <RefreshCw size={15} />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-1">
            {STATUS_TABS.map(({ key, label, icon: Icon, activeClass }) => (
              <button key={key} onClick={() => setTab(key)}
                className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                  tab === key ? activeClass : 'border-transparent text-slate-400 hover:bg-slate-50'
                }`}>
                <Icon size={12} />{label}
              </button>
            ))}
          </div>

          {/* Toggle "ver todas" — só para OPEN e CLOSED */}
          {(tab === 'OPEN' || tab === 'CLOSED') && (
            <button
              onClick={() => setShowAll(v => !v)}
              className={`w-full flex items-center justify-center gap-2 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                showAll
                  ? 'bg-indigo-50 border-indigo-200 text-indigo-600'
                  : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
              }`}
            >
              {showAll ? <Eye size={13} /> : <EyeOff size={13} />}
              {showAll ? 'Mostrando todas as conversas' : 'Ver apenas as minhas'}
            </button>
          )}
        </div>

        {/* Contagem / erro */}
        <div className="px-4 py-2 text-xs border-b border-slate-50">
          {loading
            ? <span className="text-slate-400">Carregando...</span>
            : fetchError
              ? <span className="text-red-500 font-medium">⚠ {fetchError}</span>
              : <span className="text-slate-400">{tickets.length} atendimento{tickets.length !== 1 ? 's' : ''}</span>
          }
        </div>

        {/* Lista */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex justify-center py-16">
              <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : fetchError ? (
            <div className="flex flex-col items-center justify-center py-16 text-red-400 text-sm gap-2 px-4 text-center">
              <span className="text-3xl">⚠️</span>
              <span className="font-medium text-red-500">Erro ao carregar</span>
              <span className="text-slate-400">{fetchError}</span>
              <button
                onClick={() => fetchTickets(tab, showAll)}
                className="mt-2 px-4 py-1.5 bg-indigo-600 text-white text-xs rounded-lg hover:bg-indigo-500"
              >
                Tentar novamente
              </button>
            </div>
          ) : tickets.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400 text-sm gap-2">
              <currentTab.icon size={28} strokeWidth={1.5} className="text-slate-300" />
              Nenhum atendimento aqui
            </div>
          ) : (
            tickets.map(ticket => (
              <TicketRow
                key={ticket.id}
                ticket={ticket}
                active={selected?.id === ticket.id}
                onClick={() => setSelected(ticket)}
              />
            ))
          )}
        </div>
      </aside>

      {/* ══ PAINEL DIREITO — chat ══ */}
      <main className="flex-1 flex flex-col overflow-hidden bg-slate-50">
        {selected ? (
          <ChatPanel
            ticket={selected}
            queues={queues}
            token={token()}
            onClose={() => setSelected(null)}
            onAction={afterAction}
            onUpdate={updateSelected}
          />
        ) : (
          <EmptyState tab={tab} />
        )}
      </main>
    </div>
  )
}

// ─────────────────────────────────────────────────────
function TicketRow({ ticket, active, onClick }: { ticket: Ticket; active: boolean; onClick: () => void }) {
  const ini = avatar(ticket.contact.name, ticket.contact.number)

  return (
    <button onClick={onClick}
      className={`w-full text-left px-4 py-3.5 border-b border-slate-100 flex items-start gap-3 transition-colors ${
        active ? 'bg-indigo-50 border-l-2 border-l-indigo-500' : 'hover:bg-slate-50'
      }`}
    >
      {/* Avatar */}
      <div className="relative shrink-0">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
          active ? 'bg-indigo-200 text-indigo-700' : 'bg-slate-200 text-slate-600'
        }`}>{ini}</div>
        {ticket.status === 'PENDING' && (
          <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-amber-400 rounded-full border-2 border-white" />
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-1 mb-0.5">
          <span className="font-semibold text-slate-800 text-sm truncate">
            {ticket.contact.name || ticket.contact.number}
          </span>
          <span className="text-xs text-slate-400 shrink-0">{timeAgo(ticket.updatedAt)}</span>
        </div>

        {ticket.queue && (
          <span className="inline-block text-xs px-1.5 py-0.5 rounded-full font-medium mb-0.5"
            style={{ background: ticket.queue.color + '20', color: ticket.queue.color }}>
            {ticket.queue.name}
          </span>
        )}

        {ticket.aiSummary ? (
          <p className="text-xs text-slate-500 truncate flex items-center gap-1">
            <Bot size={10} className="shrink-0 text-indigo-400" />
            {ticket.aiSummary}
          </p>
        ) : ticket.lastMessage ? (
          <p className="text-xs text-slate-400 truncate">{ticket.lastMessage}</p>
        ) : null}

        {/* Atendente (em OPEN / CLOSED) */}
        {ticket.user && ticket.status !== 'PENDING' && (
          <p className="text-xs text-slate-400 mt-0.5">👤 {ticket.user.name.split(' ')[0]}</p>
        )}
      </div>

      {ticket.unreadMessages > 0 && (
        <span className="shrink-0 mt-1 min-w-[20px] h-5 bg-indigo-600 text-white text-xs rounded-full flex items-center justify-center px-1">
          {ticket.unreadMessages}
        </span>
      )}
      <ChevronRight size={14} className="shrink-0 self-center text-slate-300" />
    </button>
  )
}

// ─────────────────────────────────────────────────────
function ChatPanel({
  ticket, queues, token, onClose, onAction, onUpdate,
}: {
  ticket: Ticket; queues: Queue[]; token: string
  onClose: () => void
  onAction: (t: Ticket) => void
  onUpdate: (t: Ticket) => void
}) {
  const [messages, setMessages]     = useState<Message[]>([])
  const [loadingMsgs, setLoadingMsgs] = useState(true)
  const [text, setText]             = useState('')
  const [sending, setSending]       = useState(false)
  const [actioning, setActioning]   = useState(false)
  const [showTransfer, setShowTransfer] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  const fetchMessages = useCallback(async () => {
    setLoadingMsgs(true)
    const r = await fetch(`/api/tickets/${ticket.id}/messages`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    const d = await r.json()
    setMessages(Array.isArray(d) ? d : [])
    setLoadingMsgs(false)
  }, [ticket.id, token])

  useEffect(() => { fetchMessages() }, [fetchMessages])
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const sendMessage = async () => {
    if (!text.trim() || sending) return
    setSending(true)
    const r = await fetch(`/api/tickets/${ticket.id}/messages`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ body: text.trim() }),
    })
    if (r.ok) { const msg = await r.json(); setMessages(prev => [...prev, msg]); setText('') }
    setSending(false)
  }

  const updateStatus = async (status: TicketStatus) => {
    setActioning(true)
    const user = JSON.parse(localStorage.getItem('user') ?? '{}')
    const r = await fetch(`/api/tickets/${ticket.id}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, userId: status === 'OPEN' ? user.id : undefined }),
    })
    if (r.ok) onAction(await r.json())
    setActioning(false)
  }

  const transferQueue = async (queueId: number) => {
    setActioning(true)
    const r = await fetch(`/api/tickets/${ticket.id}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ queueId }),
    })
    if (r.ok) onAction(await r.json())
    setActioning(false); setShowTransfer(false)
  }

  const ini = avatar(ticket.contact.name, ticket.contact.number)

  return (
    <div className="flex flex-col h-full">

      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-5 py-3 flex items-center gap-3 shrink-0">
        <div className="w-9 h-9 bg-indigo-100 rounded-full flex items-center justify-center text-sm font-bold text-indigo-600 shrink-0">
          {ini}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-slate-800 text-sm">
            {ticket.contact.name || ticket.contact.number}
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-400 flex-wrap">
            <span className="flex items-center gap-1"><Phone size={10} />{ticket.contact.number}</span>
            {ticket.contact.company && (
              <span className="flex items-center gap-1"><Building2 size={10} />{ticket.contact.company}</span>
            )}
          </div>
        </div>

        {ticket.queue && (
          <span className="text-xs px-2.5 py-1 rounded-full font-medium shrink-0"
            style={{ background: ticket.queue.color + '20', color: ticket.queue.color }}>
            {ticket.queue.name}
          </span>
        )}

        {/* ── Ações por status ── */}
        <div className="flex items-center gap-2 shrink-0">
          {ticket.status === 'PENDING' && (
            <button onClick={() => updateStatus('OPEN')} disabled={actioning}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition-colors">
              <UserCheck size={13} /> Iniciar conversa
            </button>
          )}
          {ticket.status === 'OPEN' && (<>
            <button onClick={() => setShowTransfer(v => !v)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-medium rounded-lg transition-colors">
              <ArrowLeftRight size={13} /> Transferir
            </button>
            <button onClick={() => updateStatus('CLOSED')} disabled={actioning}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500 hover:bg-red-400 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition-colors">
              <X size={13} /> Encerrar
            </button>
          </>)}
        </div>

        <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 ml-1 shrink-0">
          <X size={16} />
        </button>
      </header>

      {/* Dropdown transferir */}
      {showTransfer && (
        <div className="bg-white border-b border-slate-200 px-5 py-3 shrink-0">
          <p className="text-xs text-slate-500 mb-2 font-medium">Transferir para departamento:</p>
          <div className="flex flex-wrap gap-2">
            {queues.filter(q => q.id !== ticket.queue?.id).map(q => (
              <button key={q.id} onClick={() => transferQueue(q.id)} disabled={actioning}
                className="text-xs px-3 py-1.5 rounded-full border-2 font-medium transition-colors hover:opacity-80"
                style={{ borderColor: q.color, color: q.color, background: q.color + '15' }}>
                {q.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Resumo IA */}
      {ticket.aiSummary && (
        <div className="mx-4 mt-3 mb-1 bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-2.5 flex items-start gap-2 shrink-0">
          <Bot size={15} className="text-indigo-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-semibold text-indigo-700 mb-0.5">Resumo da IA</p>
            <p className="text-xs text-indigo-600 leading-relaxed">{ticket.aiSummary}</p>
          </div>
        </div>
      )}

      {/* Mensagens */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-1">
        {loadingMsgs ? (
          <div className="flex justify-center py-16">
            <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-16 text-slate-400 text-sm">Nenhuma mensagem ainda</div>
        ) : messages.map((msg, i) => {
          const prev = messages[i - 1]
          const showDate = !prev || new Date(msg.createdAt).toDateString() !== new Date(prev.createdAt).toDateString()
          return (
            <div key={msg.id}>
              {showDate && (
                <div className="flex justify-center my-3">
                  <span className="bg-slate-200 text-slate-500 text-xs px-3 py-0.5 rounded-full">
                    {new Date(msg.createdAt).toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
                  </span>
                </div>
              )}
              <div className={`flex ${msg.fromMe ? 'justify-end' : 'justify-start'} mb-0.5`}>
                <div className={`max-w-[72%] px-3.5 py-2 rounded-2xl text-sm leading-relaxed ${
                  msg.fromMe
                    ? 'bg-indigo-600 text-white rounded-br-sm'
                    : 'bg-white text-slate-800 rounded-bl-sm shadow-sm border border-slate-100'
                }`}>
                  {!msg.fromMe && msg.sender && (
                    <p className="text-xs font-semibold text-indigo-500 mb-0.5">{msg.sender.name}</p>
                  )}
                  <p>{msg.body}</p>
                  <p className={`text-xs mt-0.5 text-right ${msg.fromMe ? 'text-indigo-200' : 'text-slate-400'}`}>
                    {fmtTime(msg.createdAt)}
                  </p>
                </div>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input / aviso */}
      {ticket.status === 'OPEN' ? (
        <div className="bg-white border-t border-slate-200 px-4 py-3 flex items-end gap-2 shrink-0">
          <textarea value={text} onChange={e => setText(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
            placeholder="Digite uma mensagem... (Enter para enviar)"
            rows={1}
            className="flex-1 resize-none bg-slate-100 rounded-xl px-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 max-h-32"
            style={{ minHeight: '42px' }}
          />
          <button onClick={sendMessage} disabled={!text.trim() || sending}
            className="w-10 h-10 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white rounded-xl flex items-center justify-center transition-colors shrink-0">
            <Send size={16} />
          </button>
        </div>
      ) : ticket.status === 'PENDING' ? (
        <div className="bg-amber-50 border-t border-amber-100 px-4 py-3 text-center shrink-0">
          <p className="text-amber-600 text-sm font-medium">
            Clique em <strong>Iniciar conversa</strong> para assumir este atendimento
          </p>
        </div>
      ) : (
        <div className="bg-slate-50 border-t border-slate-200 px-4 py-3 text-center shrink-0">
          <p className="text-slate-400 text-sm">Atendimento encerrado</p>
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────
function EmptyState({ tab }: { tab: TicketStatus }) {
  const msgs: Record<TicketStatus, string> = {
    PENDING: 'Selecione um atendimento pendente para visualizar e iniciar a conversa',
    OPEN:    'Selecione uma conversa em andamento',
    CLOSED:  'Selecione um atendimento encerrado para ver o histórico',
  }
  return (
    <div className="flex flex-col items-center justify-center h-full text-slate-400 select-none gap-2">
      <MessageSquare size={48} strokeWidth={1} className="text-slate-300" />
      <p className="text-base font-medium text-slate-500">Nenhuma conversa aberta</p>
      <p className="text-sm text-center max-w-xs">{msgs[tab]}</p>
    </div>
  )
}
