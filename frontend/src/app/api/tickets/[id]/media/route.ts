import { after }                     from 'next/server'
import { NextRequest, NextResponse } from 'next/server'
import prisma                        from '@/lib/prisma'
import { getTokenFromRequest }       from '@/lib/auth'
import { sendMedia }                 from '@/lib/evolution'

type Params = { params: Promise<{ id: string }> }

export const maxDuration = 60

/**
 * POST /api/tickets/[id]/media
 * Body (JSON): { mediaType: 'image'|'video'|'document'|'audio', base64: 'data:...,BASE64', fileName: 'foto.jpg', caption?: string }
 */
export async function POST(req: NextRequest, { params }: Params) {
  const payload = getTokenFromRequest(req)
  if (!payload) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { id } = await params
  const ticketId = Number(id)

  const body = await req.json()
  const { mediaType, base64, fileName, caption } = body as {
    mediaType: 'image' | 'video' | 'document' | 'audio'
    base64: string
    fileName: string
    caption?: string
  }

  if (!base64 || !fileName || !mediaType) {
    return NextResponse.json({ error: 'Dados de mídia inválidos' }, { status: 400 })
  }

  /* Strip data URI prefix para enviar apenas o base64 puro para a Evolution API */
  const pureBase64 = base64.includes(',') ? base64.split(',')[1] : base64

  const [ticket, message] = await Promise.all([
    prisma.ticket.findUnique({
      where:  { id: ticketId },
      select: { contact: { select: { number: true } } },
    }),
    prisma.message.create({
      data: {
        body:         caption || fileName,
        fromMe:       true,
        mediaType,
        mediaUrl:     base64,   // guarda o data URI completo para exibir no chat
        read:         true,
        ticketId,
        senderUserId: payload.id,
      },
      include: { sender: { select: { id: true, name: true } } },
    }),
    prisma.ticket.update({
      where: { id: ticketId },
      data:  { lastMessage: caption || `📎 ${fileName}`, updatedAt: new Date() },
    }),
  ])

  if (ticket?.contact?.number) {
    const messageId = message.id
    after(async () => {
      const result = await sendMedia(ticket.contact!.number, mediaType, pureBase64, fileName, caption) as Record<string, unknown> | null
      const waId = result?.key
        ? (result.key as Record<string, unknown>)?.id as string | undefined
        : undefined
      if (waId) {
        await prisma.message.update({ where: { id: messageId }, data: { gosacId: waId } })
      }
    })
  }

  return NextResponse.json(message, { status: 201 })
}
