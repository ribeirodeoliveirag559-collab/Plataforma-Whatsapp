import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getTokenFromRequest } from '@/lib/auth'

type Params = { params: Promise<{ ticketId: string }> }

export async function GET(req: NextRequest, { params }: Params) {
  if (!getTokenFromRequest(req)) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  const { ticketId } = await params
  const page = Number(new URL(req.url).searchParams.get('pageNumber') || 1)

  const [messages, count] = await Promise.all([
    prisma.message.findMany({
      where: { ticketId: Number(ticketId), isDeleted: false },
      include: { sender: { select: { id: true, name: true, avatar: true } } },
      orderBy: { createdAt: 'asc' },
      skip: (page - 1) * 50,
      take: 50
    }),
    prisma.message.count({ where: { ticketId: Number(ticketId) } })
  ])
  return NextResponse.json({ messages, count })
}

export async function POST(req: NextRequest, { params }: Params) {
  const payload = getTokenFromRequest(req)
  if (!payload) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  const { ticketId } = await params
  const { body } = await req.json()

  const message = await prisma.message.create({
    data: {
      body,
      fromMe: true,
      ticketId: Number(ticketId),
      senderUserId: payload.id
    },
    include: { sender: { select: { id: true, name: true, avatar: true } } }
  })

  // Atualizar lastMessage do ticket
  await prisma.ticket.update({
    where: { id: Number(ticketId) },
    data: { lastMessage: body, status: 'OPEN', updatedAt: new Date() }
  })

  return NextResponse.json(message, { status: 201 })
}
