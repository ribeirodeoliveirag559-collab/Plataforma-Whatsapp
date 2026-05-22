import { Response } from 'express'
import prisma from '../config/database'
import { AuthRequest } from '../middlewares/auth.middleware'
import { io } from '../index'

export const listTickets = async (req: AuthRequest, res: Response) => {
  try {
    const { status, queueId, userId, pageNumber = '1' } = req.query
    const pageSize = 20
    const skip = (Number(pageNumber) - 1) * pageSize

    const where: Record<string, unknown> = { deletedAt: undefined }
    if (status) where.status = String(status).toUpperCase()
    if (queueId) where.queueId = Number(queueId)
    if (userId) where.userId = Number(userId)

    const [tickets, count] = await Promise.all([
      prisma.ticket.findMany({
        where,
        include: {
          contact: { select: { id: true, name: true, number: true, profilePicUrl: true } },
          queue: { select: { id: true, name: true, color: true } },
          user: { select: { id: true, name: true, avatar: true } }
        },
        orderBy: { updatedAt: 'desc' },
        skip,
        take: pageSize
      }),
      prisma.ticket.count({ where })
    ])

    return res.json({ tickets, count, hasMore: skip + pageSize < count })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ error: 'Erro ao listar tickets' })
  }
}

export const getTicket = async (req: AuthRequest, res: Response) => {
  try {
    const ticket = await prisma.ticket.findUnique({
      where: { id: Number(req.params.id) },
      include: {
        contact: true,
        queue: true,
        user: { select: { id: true, name: true, avatar: true } }
      }
    })
    if (!ticket) return res.status(404).json({ error: 'Ticket não encontrado' })
    return res.json(ticket)
  } catch {
    return res.status(500).json({ error: 'Erro interno' })
  }
}

export const updateTicket = async (req: AuthRequest, res: Response) => {
  try {
    const { status, queueId, userId } = req.body
    const ticket = await prisma.ticket.update({
      where: { id: Number(req.params.id) },
      data: {
        ...(status && { status, closedAt: status === 'CLOSED' ? new Date() : null }),
        ...(queueId !== undefined && { queueId }),
        ...(userId !== undefined && { userId })
      },
      include: {
        contact: true,
        queue: true,
        user: { select: { id: true, name: true, avatar: true } }
      }
    })

    // Notificar via WebSocket
    io.emit('ticket:update', ticket)

    return res.json(ticket)
  } catch {
    return res.status(500).json({ error: 'Erro interno' })
  }
}
