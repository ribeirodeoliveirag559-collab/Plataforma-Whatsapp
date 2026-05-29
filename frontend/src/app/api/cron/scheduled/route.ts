import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// GET /api/cron/scheduled
// Chamado pelo Vercel Cron Job a cada minuto.
// Verifica agendamentos que venceram e cria o ticket + mensagem inicial.
export async function GET(req: NextRequest) {
  // Proteção simples: chave enviada pelo Vercel ou configurada manualmente
  const authHeader = req.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const now = new Date()

  // Busca agendamentos PENDING que já passaram do horário
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
      // Cria ticket OPEN já atribuído ao usuário que agendou
      const ticket = await prisma.ticket.create({
        data: {
          contactId: item.contactId,
          userId:    item.userId,
          queueId:   item.queueId,
          status:    'OPEN',
          lastMessage: item.message,
        },
      })

      // Cria mensagem inicial
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

      // Atualiza o agendamento como SENT, vincula ao ticket criado
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
