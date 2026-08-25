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

  if (key.fromMe === true) return NextResponse.json({ ok: true })

  const jid = key.remoteJid as string
  if (!jid || isGroupJid(jid)) return NextResponse.json({ ok: true })

  const number   = jidToNumber(jid)
  const msgId    = key.id as string
  const pushName = (data.pushName as string) || ''
  const message  = data.message as Record<string, unknown> | undefined

  const rawMsgType = (data.messageType as string) || 'conversation'
  const mediaType  = toMediaType(rawMsgType)

  const messageText: string =
    (message?.conversation as string) ||
    ((message?.extendedTextMessage as Record<string, unknown>)?.text as string) ||
    ((message?.imageMessage as Record<string, unknown>)?.caption as string) ||
    ((message?.videoMessage as Record<string, unknown>)?.caption as string) ||
    ((message?.audioMessage as Record<string, unknown>)?.caption as string) ||
    ((message?.documentMessage as Record<string, unknown>)?.caption as string) ||
    ((message?.documentWithCaptionMessage as Record<string, unknown>)?.caption as string) ||
    ''

  /* Base64 da Evolution API (webhookBase64: true) — armazena só imagens (vídeos são grandes demais) */
  const rawBase64 = data.base64 as string | undefined
  const mediaUrl: string | null =
    mediaType === 'image' && rawBase64 && rawBase64.length < 3_500_000
      ? rawBase64   // já vem como "data:image/jpeg;base64,..."
      : null

  /* Duplicata + Contato em paralelo */
  const [existing, contactFound] = await Promise.all([
    msgId ? prisma.message.findFirst({ where: { gosacId: msgId } }) : Promise.resolve(null),
    prisma.contact.findFirst({ where: { number, deletedAt: null } }),
  ])
  if (existing) return NextResponse.json({ ok: true })

  let contact = contactFound
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

  /* Salva mensagem + atualiza ticket em paralelo */
  const displayBody = messageText || (mediaType !== 'chat' ? `📎 ${mediaType === 'image' ? 'Imagem' : mediaType === 'video' ? 'Vídeo' : mediaType === 'audio' ? 'Áudio' : 'Arquivo'} recebido` : null)
  await Promise.all([
    prisma.message.create({
      data: { body: displayBody, fromMe: false, mediaType, mediaUrl, read: false, ticketId: ticket.id, gosacId: msgId || null },
    }),
    prisma.ticket.update({
      where: { id: ticket.id },
      data:  { lastMessage: displayBody, unreadMessages: { increment: 1 }, updatedAt: new Date() },
    }),
  ])

  /* Mensagens com mais de 5 minutos são históricas (sync inicial do Baileys) — não aciona o Porter */
  const msgTimestamp  = data.messageTimestamp as number | undefined
  const msgAgeSeconds = msgTimestamp ? (Date.now() / 1000 - msgTimestamp) : 0
  const isLiveMessage = msgAgeSeconds < 300  // menos de 5 minutos

  /* Retorna 200 imediatamente — Porter IA roda em background sem bloquear o webhook */
  const porterEligible = isLiveMessage && ticket.status === 'PENDING' && !ticket.queueId && isPorterEnabled()
  console.log(`[Webhook] ticket=${ticket.id} age=${Math.round(msgAgeSeconds)}s live=${isLiveMessage} porterRun=${porterEligible}`)
  if (porterEligible) {
    const ticketId   = ticket.id
    const contactId  = contact.id
    const contactName = contact.name

    after(async () => {
      console.log(`[Porter] ticket=${ticketId} iniciando — ${new Date().toISOString()}`)
      try {
        const result = await runPorter(ticketId)
        console.log(`[Porter] ticket=${ticketId} — route=${!!result.route} msg="${result.message.slice(0, 80)}"`)

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
