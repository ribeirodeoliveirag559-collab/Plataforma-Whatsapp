import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getTokenFromRequest } from '@/lib/auth'

// GET /api/cron/scheduled
// Aceita duas formas de autenticação:
//   1. Vercel Cron Job → Authorization: Bearer <CRON_SECRET>
//   2. Usuário logado  → Authorization: Bearer <JWT>  (polling client-side)
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  // Verifica se é o cron da Vercel ou um JWT válido de usuário
  const isCron    = cronSecret ? authHeader === `Bearer ${cronSecret}` : false
  const userToken = getTokenFromRequest(req)

  if (!isCron && !userToken) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const now = new Date()

  const due = await prisma.scheduledTicket.findMany({
    where: {
      status:      'PENDING',
      scheduledAt: { lte: now },
    },
  })

  if (due.length === 0) {
    return NextResponse.json({ fired: 0 })
  }

  const results: number[] = []

  for (const item of due) {
    try {
      const ticket = await prisma.ticket.create({
        data: {
          contactId:   item.contactId,
          userId:      item.userId,
          queueId:     item.queueId,
          status:      'OPEN',
          lastMessage: item.message,
        },
      })

      await prisma.message.create({
        data: {
          body:         item.message,
          fromMe:       true,
          mediaType:    'chat',
          read:         true,
          ticketId:     ticket.id,
          senderUserId: item.userId,
        },
      })

      await prisma.scheduledTicket.update({
        where: { id: item.id },
        data:  { status: 'SENT', ticketId: ticket.id },
      })

      results.push(item.id)
    } catch (err) {
      console.error(`Erro ao disparar agendamento ${item.id}:`, err)
    }
  }

  return NextResponse.json({ fired: results.length, ids: results })
}
