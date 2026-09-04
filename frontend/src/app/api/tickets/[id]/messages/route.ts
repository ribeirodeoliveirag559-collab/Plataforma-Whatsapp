import { after }                        from 'next/server'
import { NextRequest, NextResponse }    from 'next/server'
import prisma                           from '@/lib/prisma'
import { getTokenFromRequest }          from '@/lib/auth'
import { sendText }                     from '@/lib/evolution'

type Params = { params: Promise<{ id: string }> }

export async function GET(req: NextRequest, { params }: Params) {
  if (!getTokenFromRequest(req)) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  const { id } = await params
  const ticketId = Number(id)
  const poll = req.nextUrl.searchParams.get('poll') === '1'

  const messages = await prisma.message.findMany({
    where:   { ticketId, isDeleted: false },
    include: { sender: { select: { id: true, name: true } } },
    orderBy: { createdAt: 'asc' },
  })

  // Marca como lido apenas na primeira abertura (não no polling) — usa after() para não atrasar a resposta
  if (!poll) {
    after(async () => {
      await Promise.all([
        prisma.message.updateMany({
          where: { ticketId, fromMe: false, read: false },
          data:  { read: true },
        }),
        prisma.ticket.update({
          where: { id: ticketId },
          data:  { unreadMessages: 0 },
        }),
      ])
    })
  }

  return NextResponse.json(messages)
}

export async function POST(req: NextRequest, { params }: Params) {
  const payload = getTokenFromRequest(req)
  if (!payload) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { id } = await params
  const { body } = await req.json()
  if (!body?.trim()) return NextResponse.json({ error: 'Mensagem vazia' }, { status: 400 })

  const ticketId = Number(id)

  const [ticket, message] = await Promise.all([
    prisma.ticket.findUnique({
      where:  { id: ticketId },
      select: { contact: { select: { number: true } } },
    }),
    prisma.message.create({
      data: {
        body,
        fromMe:       true,
        mediaType:    'chat',
        read:         true,
        ticketId,
        senderUserId: payload.id,
      },
      include: { sender: { select: { id: true, name: true } } },
    }),
    prisma.ticket.update({
      where: { id: ticketId },
      data:  { lastMessage: body, updatedAt: new Date() },
    }),
  ])

  if (ticket?.contact?.number) {
    const messageId = message.id
    after(async () => {
      const result = await sendText(ticket.contact!.number, body) as Record<string, unknown> | null
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
