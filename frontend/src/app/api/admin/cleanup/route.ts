import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getTokenFromRequest } from '@/lib/auth'

export async function DELETE(req: NextRequest) {
  const payload = getTokenFromRequest(req)
  if (!payload) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const user = await prisma.user.findUnique({ where: { id: payload.id }, select: { isManager: true } })
  if (!user?.isManager) return NextResponse.json({ error: 'Acesso restrito a gestores' }, { status: 403 })

  /* Deleta em ordem para respeitar foreign keys */
  const [msgs, tickets, contacts, scheduled] = await Promise.all([
    prisma.message.deleteMany({}),
    prisma.ticket.deleteMany({}),
    prisma.contact.deleteMany({}),
    prisma.scheduledTicket.deleteMany({}),
  ])

  return NextResponse.json({
    ok: true,
    deleted: {
      messages:  msgs.count,
      tickets:   tickets.count,
      contacts:  contacts.count,
      scheduled: scheduled.count,
    },
  })
}
