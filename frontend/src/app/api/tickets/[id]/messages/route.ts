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

  const messages = await prisma.message.findMany({
    where:   { ticketId, isDeleted: false },
    include: { sender: { select: { id: true, name: true } } },
    orderBy: { createdAt: 'asc' },
  })

  // Marca como lido em background — não bloqueia a resposta
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

  return NextResponse.json(messages)
}

export async function POST(req: NextRequest, { params }: Params) {
  const payload = getTokenFromRequest(req)
  if (!payload) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { id } = await params
  const { body } = await req.json()
  if (!body?.trim()) return NextResponse.json({ error: 'Mensagem vazia' }, { status: 400 })

  const ticketId = Number(id)

  // 3 queries em paralelo em vez de sequencial
  const [ticket, message] = await Promise.all([
    prisma.ticket.findUnique({
      where:   { id: ticketId },
      select:  { contact: { select: { number: true } } },
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

  // Envia pelo WhatsApp em background — não bloqueia a resposta
  if (ticket?.contact?.number) {
    after(async () => {
      await sendText(ticket.contact!.number, body)
    })
  }

  return NextResponse.json(message, { status: 201 })
}
