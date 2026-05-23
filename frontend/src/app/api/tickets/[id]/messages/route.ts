import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getTokenFromRequest, verifyToken } from '@/lib/auth'

type Params = { params: Promise<{ id: string }> }

export async function GET(req: NextRequest, { params }: Params) {
  if (!getTokenFromRequest(req)) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  const { id } = await params

  const messages = await prisma.message.findMany({
    where:   { ticketId: Number(id), isDeleted: false },
    include: { sender: { select: { id: true, name: true } } },
    orderBy: { createdAt: 'asc' },
  })

  // Marca mensagens como lidas
  await prisma.message.updateMany({
    where: { ticketId: Number(id), fromMe: false, read: false },
    data:  { read: true },
  })
  await prisma.ticket.update({
    where: { id: Number(id) },
    data:  { unreadMessages: 0 },
  })

  return NextResponse.json(messages)
}

export async function POST(req: NextRequest, { params }: Params) {
  const token = getTokenFromRequest(req)
  if (!token) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  const payload = verifyToken(token) as { id: number } | null
  if (!payload) return NextResponse.json({ error: 'Token inválido' }, { status: 401 })

  const { id } = await params
  const { body } = await req.json()
  if (!body?.trim()) return NextResponse.json({ error: 'Mensagem vazia' }, { status: 400 })

  const message = await prisma.message.create({
    data: {
      body,
      fromMe:       true,
      mediaType:    'chat',
      read:         true,
      ticketId:     Number(id),
      senderUserId: payload.id,
    },
    include: { sender: { select: { id: true, name: true } } },
  })

  // Atualiza lastMessage do ticket
  await prisma.ticket.update({
    where: { id: Number(id) },
    data:  { lastMessage: body, updatedAt: new Date() },
  })

  return NextResponse.json(message, { status: 201 })
}
