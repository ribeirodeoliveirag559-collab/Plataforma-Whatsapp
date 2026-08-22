import { after }                               from 'next/server'
import { NextRequest, NextResponse }           from 'next/server'
import prisma                                  from '@/lib/prisma'
import { sendText, jidToNumber, isGroupJid }   from '@/lib/evolution'
import { runPorter, isPorterEnabled }          from '@/lib/porter'

export const maxDuration = 60

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>
  try { body = await req.json() } catch { return NextResponse.json({ ok: true }) }

  const event = body.event as string
  if (event !== 'messages.upsert') return NextResponse.json({ ok: true })

  const data = body.data as Record<string, unknown> | undefined
  if (!data) return NextResponse.json({ ok: true })

  const key = data.key as Record<string, unknown>
  if (!key) return NextResponse.json({ ok: true })

  if (key.fromMe === true) return NextResponse.json({ ok: true })

  const jid = key.remoteJid as string
  if (!jid || isGroupJid(jid)) return NextResponse.json({ ok: true })

  const number   = jidToNumber(jid)
  const msgId    = key.id as string
  const pushName = (data.pushName as string) || ''
  const message  = data.message as Record<string, unknown> | undefined

  const messageText: string =
    (message?.conversation as string) ||
    ((message?.extendedTextMessage as Record<string, unknown>)?.text as string) ||
    ((message?.imageMessage as Record<string, unknown>)?.caption as string) ||
    ((message?.videoMessage as Record<string, unknown>)?.caption as string) ||
    ((message?.documentMessage as Record<string, unknown>)?.caption as string) ||
    '📎 Mídia recebida'

  /* Duplicata */
  if (msgId) {
    const existing = await prisma.message.findFirst({ where: { gosacId: msgId } })
    if (existing) return NextResponse.json({ ok: true })
  }

  /* Contato */
  let contact = await prisma.contact.findFirst({ where: { number, deletedAt: null } })
  if (!contact) {
    contact = await prisma.contact.create({ data: { name: pushName || number, number } })
  } else if (pushName && (!contact.name || contact.name === contact.number)) {
    await prisma.contact.update({ where: { id: contact.id }, data: { name: pushName } })
    contact = { ...contact, name: pushName }
  }

  /* Ticket */
  let ticket = await prisma.ticket.findFirst({
    where:   { contactId: contact.id, status: { in: ['PENDING', 'OPEN'] } },
    orderBy: { createdAt: 'desc' },
  })
  if (!ticket) {
    ticket = await prisma.ticket.create({ data: { contactId: contact.id, status: 'PENDING' } })
  }

  /* Salva mensagem */
  await prisma.message.create({
    data: { body: messageText, fromMe: false, mediaType: 'chat', read: false, ticketId: ticket.id, gosacId: msgId || null },
  })
  await prisma.ticket.update({
    where: { id: ticket.id },
    data:  { lastMessage: messageText, unreadMessages: { increment: 1 }, updatedAt: new Date() },
  })

  /* Retorna 200 imediatamente — Porter IA roda em background sem bloquear o webhook */
  if (ticket.status === 'PENDING' && isPorterEnabled()) {
    const ticketId   = ticket.id
    const contactId  = contact.id
    const contactName = contact.name

    after(async () => {
      try {
        const result = await runPorter(ticketId)

        await sendText(number, result.message)

        await prisma.message.create({
          data: { body: result.message, fromMe: true, mediaType: 'chat', read: true, ticketId },
        })
        await prisma.ticket.update({
          where: { id: ticketId },
          data:  { lastMessage: result.message, updatedAt: new Date() },
        })

        if (result.route) {
          await prisma.ticket.update({
            where: { id: ticketId },
            data:  { queueId: result.route.queueId, aiSummary: result.route.summary },
          })

          const updates: Record<string, string | null> = {}
          if (result.route.clientName && (!contactName || contactName === number))
            updates.name = result.route.clientName
          if (result.route.company)
            updates.company = result.route.company
          if (Object.keys(updates).length)
            await prisma.contact.update({ where: { id: contactId }, data: updates })
        }
      } catch (err) {
        console.error('[Porter] Erro:', err)
      }
    })
  }

  return NextResponse.json({ ok: true })
}

export async function GET() {
  return NextResponse.json({ status: 'webhook ativo', timestamp: new Date().toISOString() })
}
