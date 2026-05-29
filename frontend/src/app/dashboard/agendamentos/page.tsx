'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  CalendarClock, Search, X, CheckCircle2, Clock, Ban,
  Send, ChevronRight, Loader2, AlertCircle, Plus
} from 'lucide-react'

/* ─── tipos ─── */
interface Contact {
  id: number
  name: string
  number: string
  profilePicUrl?: string
}

interface Queue {
  id: number
  name: string
  color: string
}

interface ScheduledItem {
  id: number
  message: string
  scheduledAt: string
  status: 'PENDING' | 'SENT' | 'CANCELLED'
  contact: Contact
  queue: Queue | null
  user: { id: number; name: string }
  ticket: { id: number; status: string } | null
}

/* ─── helpers ─── */
function fmtDate(iso: string) {
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function statusInfo(s: ScheduledItem['status']) {
  if (s === 'PENDING')   return { label: 'Agendado',   cls: 'bg-blue-100 text-blue-700',  Icon: Clock }
  if (s === 'SENT')      return { label: 'Enviado',     cls: 'bg-green-100 text-green-700', Icon: CheckCircle2 }
  return                        { label: 'Cancelado',  cls: 'bg-red-100 text-red-700',    Icon: Ban }
}

function isPast(iso: string) {
  return new Date(iso) < new Date()
}

/* ─── componente principal ─── */
export default function AgendamentosPage() {
  const router = useRouter()
  const token  = typeof window !== 'undefined' ? localStorage.getItem('token') : ''

  /* lista */
  const [items,   setItems]   = useState<ScheduledItem[]>([])
  const [loading, setLoading] = useState(true)
  const [filter,  setFilter]  = useState<'ALL' | 'PENDING' | 'SENT' | 'CANCELLED'>('ALL')

  /* formulário */
  const [showForm,       setShowForm]       = useState(false)
  const [contactSearch,  setContactSearch]  = useState('')
  const [contacts,       setContacts]       = useState<Contact[]>([])
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null)
  const [showDropdown,   setShowDropdown]   = useState(false)
  const [message,        setMessage]        = useState('')
  const [scheduledAt,    setScheduledAt]    = useState('')
  const [queueId,        setQueueId]        = useState('')
  const [queues,         setQueues]         = useState<Queue[]>([])
  const [saving,         setSaving]         = useState(false)
  const [formError,      setFormError]      = useState('')

  const searchRef  = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  /* ── busca lista ── */
  async function fetchList() {
    setLoading(true)
    try {
      const r = await fetch('/api/scheduled', {
        headers: { authorization: `Bearer ${token}` },
      })
      const d = await r.json()
      setItems(Array.isArray(d) ? d : [])
    } finally {
      setLoading(false)
    }
  }

  /* ── busca filas ── */
  async function fetchQueues() {
    const r = await fetch('/api/queues', {
      headers: { authorization: `Bearer ${token}` },
    })
    const d = await r.json()
    setQueues(Array.isArray(d) ? d : [])
  }

  useEffect(() => {
    if (!token) { router.push('/auth/login'); return }
    fetchList()
    fetchQueues()
  }, []) // eslint-disable-line

  /* ── busca contatos ── */
  useEffect(() => {
    const delay = setTimeout(async () => {
      if (!contactSearch.trim()) { setContacts([]); return }
      const r = await fetch(`/api/contacts?search=${encodeURIComponent(contactSearch)}&pageNumber=1`, {
        headers: { authorization: `Bearer ${token}` },
      })
      const d = await r.json()
      setContacts(Array.isArray(d.contacts) ? d.contacts : [])
      setShowDropdown(true)
    }, 300)
    return () => clearTimeout(delay)
  }, [contactSearch]) // eslint-disable-line

  /* fecha dropdown ao clicar fora */
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  /* ── seleciona contato ── */
  function selectContact(c: Contact) {
    setSelectedContact(c)
    setContactSearch(c.name)
    setShowDropdown(false)
  }

  /* ── cancela contato ── */
  function clearContact() {
    setSelectedContact(null)
    setContactSearch('')
    setContacts([])
    setTimeout(() => searchRef.current?.focus(), 50)
  }

  /* ── data/hora mínima (agora) ── */
  function minDatetime() {
    const d = new Date()
    d.setMinutes(d.getMinutes() + 1)
    return d.toISOString().slice(0, 16)
  }

  /* ── salvar agendamento ── */
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setFormError('')

    if (!selectedContact) { setFormError('Selecione um contato.'); return }
    if (!message.trim())  { setFormError('Digite a mensagem inicial.'); return }
    if (!scheduledAt)     { setFormError('Escolha data e horário.'); return }
    if (new Date(scheduledAt) <= new Date()) { setFormError('O horário precisa ser no futuro.'); return }

    setSaving(true)
    try {
      const r = await fetch('/api/scheduled', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', authorization: `Bearer ${token}` },
        body: JSON.stringify({
          contactId:   selectedContact.id,
          message:     message.trim(),
          scheduledAt: new Date(scheduledAt).toISOString(),
          queueId:     queueId || null,
        }),
      })
      if (!r.ok) {
        const err = await r.json()
        setFormError(err.error || 'Erro ao agendar.')
        return
      }
      // reseta form
      setSelectedContact(null)
      setContactSearch('')
      setMessage('')
      setScheduledAt('')
      setQueueId('')
      setShowForm(false)
      await fetchList()
    } finally {
      setSaving(false)
    }
  }

  /* ── cancelar agendamento ── */
  async function handleCancel(id: number) {
    if (!confirm('Cancelar este agendamento?')) return
    await fetch(`/api/scheduled/${id}`, {
      method:  'DELETE',
      headers: { authorization: `Bearer ${token}` },
    })
    await fetchList()
  }

  /* ── filtragem ── */
  const shown = filter === 'ALL' ? items : items.filter(i => i.status === filter)

  /* ── counts ── */
  const pendingCount   = items.filter(i => i.status === 'PENDING').length
  const sentCount      = items.filter(i => i.status === 'SENT').length
  const cancelledCount = items.filter(i => i.status === 'CANCELLED').length

  /* ══════════════════════════════════ RENDER ══════════════════════════════════ */
  return (
    <div className="flex flex-col min-h-full bg-slate-50">

      {/* ── cabeçalho ── */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <CalendarClock size={22} className="text-indigo-600" />
          <div>
            <h1 className="text-lg font-semibold text-slate-800">Agendamentos</h1>
            <p className="text-xs text-slate-500">Programe mensagens e conversas para um horário específico</p>
          </div>
        </div>
        <button
          onClick={() => { setShowForm(true); setFormError('') }}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700 transition-colors"
        >
          <Plus size={16} />
          Novo agendamento
        </button>
      </header>

      {/* ── sumário ── */}
      <div className="px-6 py-4 grid grid-cols-3 gap-4 shrink-0">
        {[
          { label: 'Pendentes',  count: pendingCount,   color: 'text-blue-600',  bg: 'bg-blue-50',  border: 'border-blue-200', key: 'PENDING'   as const },
          { label: 'Enviados',   count: sentCount,      color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200', key: 'SENT'      as const },
          { label: 'Cancelados', count: cancelledCount, color: 'text-slate-500', bg: 'bg-slate-50', border: 'border-slate-200', key: 'CANCELLED' as const },
        ].map(card => (
          <button
            key={card.key}
            onClick={() => setFilter(f => f === card.key ? 'ALL' : card.key)}
            className={`rounded-2xl border-2 p-4 text-left transition-all ${card.bg} ${
              filter === card.key ? card.border + ' ring-2 ring-offset-1 ring-indigo-300' : 'border-transparent hover:' + card.border
            }`}
          >
            <p className={`text-2xl font-bold ${card.color}`}>{card.count}</p>
            <p className="text-xs text-slate-500 mt-0.5">{card.label}</p>
          </button>
        ))}
      </div>

      {/* ── lista ── */}
      <div className="flex-1 px-6 pb-10">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={28} className="animate-spin text-indigo-400" />
          </div>
        ) : shown.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
            <CalendarClock size={40} />
            <p className="text-sm">Nenhum agendamento {filter !== 'ALL' ? 'nesta categoria' : 'ainda'}</p>
            {filter === 'ALL' && (
              <button
                onClick={() => setShowForm(true)}
                className="mt-2 text-indigo-600 text-sm font-medium hover:underline"
              >
                Criar primeiro agendamento →
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {shown.map(item => {
              const { label, cls, Icon } = statusInfo(item.status)
              const overdue = item.status === 'PENDING' && isPast(item.scheduledAt)
              return (
                <div
                  key={item.id}
                  className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition-all ${
                    overdue ? 'border-amber-300' : 'border-slate-200'
                  }`}
                >
                  <div className="p-4 flex gap-4 items-start">
                    {/* avatar */}
                    <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
                      {item.contact.profilePicUrl
                        ? <img src={item.contact.profilePicUrl} alt="" className="w-10 h-10 rounded-full object-cover" />
                        : <span className="text-indigo-700 font-bold text-sm">{item.contact.name[0]?.toUpperCase()}</span>
                      }
                    </div>

                    {/* conteúdo */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="font-semibold text-slate-800 text-sm">{item.contact.name}</span>
                        <span className="text-xs text-slate-400">{item.contact.number}</span>
                        {item.queue && (
                          <span
                            className="text-xs px-2 py-0.5 rounded-full font-medium"
                            style={{ backgroundColor: item.queue.color + '22', color: item.queue.color }}
                          >
                            {item.queue.name}
                          </span>
                        )}
                      </div>

                      <p className="text-sm text-slate-600 line-clamp-2 mb-2">
                        &ldquo;{item.message}&rdquo;
                      </p>

                      <div className="flex items-center gap-3 flex-wrap">
                        <span className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${cls}`}>
                          <Icon size={12} />
                          {label}
                        </span>

                        <span className={`flex items-center gap-1 text-xs ${overdue ? 'text-amber-600 font-semibold' : 'text-slate-400'}`}>
                          <Clock size={12} />
                          {overdue ? '⚠ ' : ''}{fmtDate(item.scheduledAt)}
                        </span>

                        <span className="text-xs text-slate-400">por {item.user.name}</span>

                        {item.status === 'SENT' && item.ticket && (
                          <button
                            onClick={() => router.push(`/dashboard/atendimentos?ticketId=${item.ticket!.id}`)}
                            className="flex items-center gap-1 text-xs text-indigo-600 hover:underline"
                          >
                            Ver conversa <ChevronRight size={12} />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* ação */}
                    {item.status === 'PENDING' && (
                      <button
                        onClick={() => handleCancel(item.id)}
                        title="Cancelar agendamento"
                        className="shrink-0 p-1.5 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                      >
                        <X size={16} />
                      </button>
                    )}
                  </div>

                  {/* barra de progresso para pendentes */}
                  {item.status === 'PENDING' && !overdue && (
                    <div className="h-0.5 bg-slate-100">
                      <div className="h-full bg-indigo-400 rounded-full" style={{ width: '40%' }} />
                    </div>
                  )}
                  {overdue && (
                    <div className="bg-amber-50 px-4 py-1.5 text-xs text-amber-700 flex items-center gap-1">
                      <AlertCircle size={12} />
                      Aguardando disparo automático (próxima execução do cron)
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ══════════ MODAL de formulário ══════════ */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">

            {/* header modal */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <CalendarClock size={18} className="text-indigo-600" />
                <h2 className="font-semibold text-slate-800">Novo agendamento</h2>
              </div>
              <button
                onClick={() => setShowForm(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-5">

              {/* contato */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Contato <span className="text-red-400">*</span>
                </label>
                <div className="relative" ref={dropdownRef}>
                  <div className={`flex items-center gap-2 border rounded-xl px-3 py-2.5 transition-colors ${
                    selectedContact
                      ? 'border-indigo-300 bg-indigo-50'
                      : 'border-slate-300 focus-within:border-indigo-400'
                  }`}>
                    <Search size={16} className="text-slate-400 shrink-0" />
                    {selectedContact ? (
                      <>
                        <div className="flex-1">
                          <span className="text-sm font-medium text-slate-800">{selectedContact.name}</span>
                          <span className="text-xs text-slate-500 ml-2">{selectedContact.number}</span>
                        </div>
                        <button type="button" onClick={clearContact} className="text-slate-400 hover:text-red-500">
                          <X size={16} />
                        </button>
                      </>
                    ) : (
                      <input
                        ref={searchRef}
                        type="text"
                        value={contactSearch}
                        onChange={e => { setContactSearch(e.target.value); setShowDropdown(true) }}
                        placeholder="Buscar por nome ou número..."
                        className="flex-1 bg-transparent outline-none text-sm text-slate-700 placeholder:text-slate-400"
                      />
                    )}
                  </div>

                  {showDropdown && contacts.length > 0 && !selectedContact && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-10 max-h-48 overflow-y-auto">
                      {contacts.map(c => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => selectContact(c)}
                          className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-indigo-50 transition-colors text-left"
                        >
                          <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
                            {c.profilePicUrl
                              ? <img src={c.profilePicUrl} alt="" className="w-8 h-8 rounded-full object-cover" />
                              : <span className="text-indigo-700 text-xs font-bold">{c.name[0]?.toUpperCase()}</span>
                            }
                          </div>
                          <div>
                            <p className="text-sm font-medium text-slate-800">{c.name}</p>
                            <p className="text-xs text-slate-500">{c.number}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* departamento */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Departamento <span className="text-slate-400 text-xs">(opcional)</span>
                </label>
                <select
                  value={queueId}
                  onChange={e => setQueueId(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:border-indigo-400 bg-white"
                >
                  <option value="">Sem departamento</option>
                  {queues.map(q => (
                    <option key={q.id} value={q.id}>{q.name}</option>
                  ))}
                </select>
              </div>

              {/* mensagem */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Mensagem inicial <span className="text-red-400">*</span>
                </label>
                <textarea
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  placeholder="Olá! Entro em contato para..."
                  rows={3}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:border-indigo-400 resize-none"
                />
                <p className="text-xs text-slate-400 mt-1">{message.length} caracteres</p>
              </div>

              {/* data / hora */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Data e horário <span className="text-red-400">*</span>
                </label>
                <input
                  type="datetime-local"
                  value={scheduledAt}
                  min={minDatetime()}
                  onChange={e => setScheduledAt(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:border-indigo-400"
                />
              </div>

              {/* erro */}
              {formError && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-3 py-2.5 text-sm text-red-600">
                  <AlertCircle size={16} className="shrink-0" />
                  {formError}
                </div>
              )}

              {/* botões */}
              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 px-4 py-2.5 border border-slate-300 rounded-xl text-sm text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-60"
                >
                  {saving ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                  {saving ? 'Agendando...' : 'Agendar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
