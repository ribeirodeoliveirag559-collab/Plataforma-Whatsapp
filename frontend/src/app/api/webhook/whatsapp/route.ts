import { after }                                        from 'next/server'
import { NextRequest, NextResponse }                    from 'next/server'
import prisma                                           from '@/lib/prisma'
import { sendText, jidToNumber, isGroupJid }            from '@/lib/evolution'
import { runPorter, isPorterEnabled }                   from '@/lib/porter'

/** Mapeia messageType da Evolution API para nosso mediaType */
function toMediaType(msgType: string): string {
  if (msgType === 'imageMessage')   return 'image'
  if (msgType === 'videoMessage')   return 'video'
  if (msgType === 'audioMessage' || msgType === 'sttMessage' || msgType === 'pttMessage') return 'audio'
  if (msgType === 'documentMessage' || msgType === 'documentWithCaptionMessage') return 'document'
  if (msgType === 'stickerMessage') return 'sticker'
  return 'chat'
}

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

  const jid = key.remoteJid as string
  if (!jid || isGroupJid(jid)) return NextResponse.json({ ok: true })

  const isFromMe  = key.fromMe === true
  const number    = jidToNumber(jid)
  const msgId     = key.id as string
  const pushName  = (data.pushName as string) || ''
  const message   = data.message as Record<string, unknown> | undefined

  const rawMsgType   = (data.messageType as string) || 'conversation'
  const mediaType    = toMediaType(rawMsgType)
  const msgTimestamp = data.messageTimestamp as number | undefined

  /* Timestamp real da mensagem (preserva ordem cronológica no histórico) */
  const createdAt = msgTimestamp ? new Date(msgTimestamp * 1000) : new Date()

  /* Texto/legenda da mensagem */
  const messageText: string =
    (message?.conversation as string) ||
    ((message?.extendedTextMessage as Record<string, unknown>)?.text as string) ||
    ((message?.imageMessage as Record<string, unknown>)?.caption as string) ||
    ((message?.videoMessage as Record<string, unknown>)?.caption as string) ||
    ((message?.audioMessage as Record<string, unknown>)?.caption as string) ||
    ((message?.documentMessage as Record<string, unknown>)?.caption as string) ||
    ((message?.documentWithCaptionMessage as Record<string, unknown>)?.caption as string) ||
    ''

  /* Base64 da Evolution API (webhookBase64: true) — só para imagens */
  const rawBase64 = data.base64 as string | undefined
  const mediaUrl: string | null =
    mediaType === 'image' && rawBase64 && rawBase64.length < 3_500_000
      ? rawBase64
      : null

  const displayBody = messageText || (mediaType !== 'chat'
    ? `📎 ${mediaType === 'image' ? 'Imagem' : mediaType === 'video' ? 'Vídeo' : mediaType === 'audio' ? 'Áudio' : 'Arquivo'} recebido`
    : null)

  /* ── Verificação de duplicata pelo gosacId (válido para fromThem; fromMe usa lógica própria) ── */
  const existingByGosacId = msgId
    ? await prisma.message.findFirst({ where: { gosacId: msgId } })
    : null
  if (existingByGosacId) return NextResponse.json({ ok: true })

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
    ticket = await prisma.ticket.create({ data: { contactId: contact.id, status: 'PENDING' } })
  }

  /* ── Mensagens enviadas (fromMe): dedup com mensagens enviadas pelo painel ── */
  if (isFromMe) {
    /* Verifica se foi enviada pelo nosso painel nos últimos 30s (gosacId ainda null) */
    const recentPlatformMsg = displayBody
      ? await prisma.message.findFirst({
          where: {
            ticketId: ticket.id,
            fromMe:   true,
            body:     displayBody,
            gosacId:  null,
            createdAt: { gte: new Date(Date.now() - 30_000) },
          },
          orderBy: { createdAt: 'desc' },
        })
      : null

    if (recentPlatformMsg) {
      /* Registra o gosacId na mensagem do painel para dedup futuros */
      if (msgId) await prisma.message.update({ where: { id: recentPlatformMsg.id }, data: { gosacId: msgId } })
      return NextResponse.json({ ok: true })
    }

    /* Mensagem enviada fora do painel (pelo celular) ou histórico — salva normalmente */
    await prisma.message.create({
      data: { body: displayBody, fromMe: true, mediaType, mediaUrl, read: true, ticketId: ticket.id, gosacId: msgId || null, createdAt },
    })
    /* Atualiza lastMessage do ticket sem incrementar unread */
    await prisma.ticket.update({
      where: { id: ticket.id },
      data:  { lastMessage: displayBody, updatedAt: createdAt },
    })

    return NextResponse.json({ ok: true })
  }

  /* ── Mensagem recebida (fromMe=false) ── */
  await Promise.all([
    prisma.message.create({
      data: { body: displayBody, fromMe: false, mediaType, mediaUrl, read: false, ticketId: ticket.id, gosacId: msgId || null, createdAt },
    }),
    prisma.ticket.update({
      where: { id: ticket.id },
      data:  { lastMessage: displayBody, unreadMessages: { increment: 1 }, updatedAt: createdAt },
    }),
  ])

  /* Mensagens com mais de 5 minutos são históricas — não aciona o Porter */
  const msgAgeSeconds = msgTimestamp ? (Date.now() / 1000 - msgTimestamp) : 0
  const isLiveMessage = msgAgeSeconds < 300

  const porterEligible = isLiveMessage && ticket.status === 'PENDING' && !ticket.queueId && isPorterEnabled()
  console.log(`[Webhook] ticket=${ticket.id} age=${Math.round(msgAgeSeconds)}s live=${isLiveMessage} porterRun=${porterEligible}`)

  if (porterEligible) {
    const ticketId    = ticket.id
    const contactId   = contact.id
    const contactName = contact.name

    after(async () => {
      console.log(`[Porter] ticket=${ticketId} iniciando — ${new Date().toISOString()}`)
      try {
        const result = await runPorter(ticketId)
        console.log(`[Porter] ticket=${ticketId} — route=${!!result.route} msg="${result.message.slice(0, 80)}"`)

        const [sendResult, porterMsg] = await Promise.all([
          sendText(number, result.message),
          prisma.message.create({
            data: { body: result.message, fromMe: true, mediaType: 'chat', read: true, ticketId },
          }),
        ])
        await prisma.ticket.update({
          where: { id: ticketId },
          data:  { lastMessage: result.message, updatedAt: new Date() },
        })

        /* Registra o gosacId do Porter para evitar duplicata no webhook */
        const porterWaId = (sendResult as Record<string, unknown>)?.key
          ? ((sendResult as Record<string, unknown>).key as Record<string, unknown>)?.id as string | undefined
          : undefined
        if (porterWaId) {
          await prisma.message.update({ where: { id: porterMsg.id }, data: { gosacId: porterWaId } })
        }

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
