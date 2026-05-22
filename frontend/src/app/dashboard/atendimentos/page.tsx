'use client'

import { useEffect, useState } from 'react'
import { Clock, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react'

type TicketStatus = 'PENDING' | 'OPEN' | 'CLOSED'

interface Ticket {
  id: number
  status: TicketStatus
  lastMessage: string | null
  unreadMessages: number
  contact: { id: number; name: string; number: string; profilePicUrl: string | null }
  queue: { id: number; name: string; color: string } | null
  user: { id: number; name: string; avatar: string | null } | null
  updatedAt: string
}

const statusConfig = {
  PENDING: { label: 'Pendente', color: 'text-amber-500', bg: 'bg-amber-50 border-amber-200', icon: Clock },
  OPEN: { label: 'Em atendimento', color: 'text-indigo-600', bg: 'bg-indigo-50 border-indigo-200', icon: AlertCircle },
  CLOSED: { label: 'Encerrado', color: 'text-slate-400', bg: 'bg-slate-50 border-slate-200', icon: CheckCircle },
}

export default function AtendimentosPage() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [activeStatus, setActiveStatus] = useState<TicketStatus>('OPEN')

  const fetchTickets = async (status: TicketStatus) => {
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(
        `/api/tickets?status=${status}&pageNumber=1`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      const data = await res.json()
      setTickets(data.tickets || [])
    } catch {
      console.error('Erro ao carregar tickets')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchTickets(activeStatus) }, [activeStatus])

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Atendimentos</h1>
          <p className="text-slate-500 text-sm mt-0.5">Gerencie os atendimentos WhatsApp</p>
        </div>
        <button
          onClick={() => fetchTickets(activeStatus)}
          className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors text-sm"
        >
          <RefreshCw size={15} />
          Atualizar
        </button>
      </div>

      {/* Tabs de status */}
      <div className="flex gap-2 mb-6">
        {(['OPEN', 'PENDING', 'CLOSED'] as TicketStatus[]).map(status => {
          const cfg = statusConfig[status]
          return (
            <button
              key={status}
              onClick={() => setActiveStatus(status)}
              className={`px-4 py-2 rounded-xl text-sm font-medium border transition-colors ${
                activeStatus === status
                  ? cfg.bg + ' ' + cfg.color + ' border-current'
                  : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
              }`}
            >
              {cfg.label}
            </button>
          )
        })}
      </div>

      {/* Lista de tickets */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full" />
        </div>
      ) : tickets.length === 0 ? (
        <div className="text-center py-20 text-slate-400">
          <MessageIcon />
          <p className="mt-2">Nenhum atendimento {statusConfig[activeStatus].label.toLowerCase()}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {tickets.map(ticket => (
            <TicketCard key={ticket.id} ticket={ticket} />
          ))}
        </div>
      )}
    </div>
  )
}

function TicketCard({ ticket }: { ticket: Ticket }) {
  const initials = ticket.contact.name
    ? ticket.contact.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : ticket.contact.number.slice(-4)

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 hover:shadow-md transition-shadow cursor-pointer">
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center shrink-0">
          <span className="text-indigo-600 font-semibold text-sm">{initials}</span>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className="font-semibold text-slate-800 truncate">
              {ticket.contact.name || ticket.contact.number}
            </span>
            {ticket.unreadMessages > 0 && (
              <span className="bg-indigo-600 text-white text-xs rounded-full px-2 py-0.5 shrink-0">
                {ticket.unreadMessages}
              </span>
            )}
          </div>

          {ticket.lastMessage && (
            <p className="text-slate-500 text-sm truncate mt-0.5">{ticket.lastMessage}</p>
          )}

          {/* Resumo IA */}
          <div className="flex items-center gap-3 mt-2">
            {ticket.queue && (
              <span
                className="text-xs px-2 py-0.5 rounded-full font-medium"
                style={{ backgroundColor: ticket.queue.color + '20', color: ticket.queue.color }}
              >
                {ticket.queue.name}
              </span>
            )}
            {ticket.user && (
              <span className="text-xs text-slate-400">{ticket.user.name}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function MessageIcon() {
  return (
    <svg className="w-12 h-12 mx-auto text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
        d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
    </svg>
  )
}
