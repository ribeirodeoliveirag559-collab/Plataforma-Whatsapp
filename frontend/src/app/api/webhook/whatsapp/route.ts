/**
 * POST /api/webhook/whatsapp
 *
 * Recebe eventos da Evolution API:
 *   - messages.upsert  → salva mensagem, roda porteiro IA se ticket PENDING
 *   - connection.update → (ignorado por enquanto)
 *
 * Configure a URL do webhook na Evolution API como:
 *   https://seu-app.vercel.app/api/webhook/whatsapp?secret=SEU_WEBHOOK_SECRET
 */

import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { sendText, jidToNumber, isGroupJid } from '@/lib/evolution'
import { runPorter, isPorterEnabled }         from '@/lib/porter'

export const maxDuration = 60 // Vercel hobby: 60s

export async function POST(req: NextRequest) {
  /* ── Verificação de segredo (opcional) ── */
  const secret = new URL(req.url).searchParams.get('secret')
  if (process.env.WEBHOOK_SECRET && secret !== process.env.WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: Record<string, unknown>
  try { body = await req.json() } catch { return NextResponse.json({ ok: true }) }

  const event = body.event as string

  /* ── Só processa mensagens recebidas ── */
  if (event !== 'messages.upsert') return NextResponse.json({ ok: true })

  const data = body.data as Record<string, unknown> | undefined
  if (!data) return NextResponse.json({ ok: true })

  const key = data.key as Record<string, unknown>
  if (!key) return NextResponse.json({ ok: true })

  /* Ignora mensagens enviadas por nós */
  if (key.fromMe === true) return NextResponse.json({ ok: true })

  const jid = key.remoteJid as string
  if (!jid) return NextResponse.json({ ok: true })

  /* Ignora grupos */
  if (isGroupJid(jid)) return NextResponse.json({ ok: true })

  const number     = jidToNumber(jid)
  const msgId      = key.id as string
  const pushName   = (data.pushName as string) || ''
  const message    = data.message as Record<string, unknown> | undefined

  /* Extrai texto da mensagem (suporta vários tipos) */
  const messageText: string =
    (message?.conversation as string) ||
    ((message?.extendedTextMessage as Record<string, unknown>)?.text as string) ||
    ((message?.imageMessage as Record<string, unknown>)?.caption as string) ||
    ((message?.videoMessage as Record<string, unknown>)?.caption as string) ||
    ((message?.documentMessage as Record<string, unknown>)?.caption as string) ||
    '📎 Mídia recebida'

  /* ── Duplicata? ── */
  if (msgId) {
    const existing = await prisma.message.findFirst({ where: { gosacId: msgId } })
    if (existing) return NextResponse.json({ ok: true })
  }

  /* ── Contato ── */
  let contact = await prisma.contact.findFirst({ where: { number, deletedAt: null } })
  if (!contact) {
    contact = await prisma.contact.create({ data: { name: pushName || number, number } })
  } else if (pushName && (!contact.name || contact.name === contact.number)) {
    await prisma.contact.update({ where: { id: contact.id }, data: { name: pushName } })
    contact = { ...contact, name: pushName }
  }

  /* ── Ticket ── */
  let ticket = await prisma.ticket.findFirst({
    where:   { contactId: contact.id, status: { in: ['PENDING', 'OPEN'] } },
    orderBy: { createdAt: 'desc' },
  })
  if (!ticket) {
    ticket = await prisma.ticket.create({
      data: { contactId: contact.id, status: 'PENDING' },
    })
  }

  /* ── Salva mensagem recebida ── */
  await prisma.message.create({
    data: {
      body:      messageText,
      fromMe:    false,
      mediaType: 'chat',
      read:      false,
      ticketId:  ticket.id,
      gosacId:   msgId || null,
    },
  })

  await prisma.ticket.update({
    where: { id: ticket.id },
    data:  {
      lastMessage:    messageText,
      unreadMessages: { increment: 1 },
      updatedAt:      new Date(),
    },
  })

  /* ── Porteiro IA (só para tickets PENDING) ── */
  if (ticket.status === 'PENDING' && isPorterEnabled()) {
    try {
      const result = await runPorter(ticket.id)

      /* Envia resposta pelo WhatsApp */
      await sendText(number, result.message)

      /* Salva resposta no banco */
      await prisma.message.create({
        data: {
          body:      result.message,
          fromMe:    true,
          mediaType: 'chat',
          read:      true,
          ticketId:  ticket.id,
        },
      })

      await prisma.ticket.update({
        where: { id: ticket.id },
        data:  { lastMessage: result.message, updatedAt: new Date() },
      })

      /* Roteamento: atualiza fila + resumo */
      if (result.route) {
        await prisma.ticket.update({
          where: { id: ticket.id },
          data:  {
            queueId:   result.route.queueId,
            aiSummary: result.route.summary,
          },
        })

        /* Atualiza nome/empresa do contato se o porteiro coletou */
        const updates: Record<string, string | null> = {}
        if (result.route.clientName && (!contact.name || contact.name === number))
          updates.name = result.route.clientName
        if (result.route.company && !contact.company)
          updates.company = result.route.company
        if (Object.keys(updates).length)
          await prisma.contact.update({ where: { id: contact.id }, data: updates })
      }
    } catch (err) {
      console.error('[Porter] Erro:', err)
      /* Não falha o webhook se o porteiro der erro */
    }
  }

  return NextResponse.json({ ok: true })
}

/* Evolution API faz GET no webhook para verificar disponibilidade */
export async function GET() {
  return NextResponse.json({ status: 'webhook ativo', timestamp: new Date().toISOString() })
}
