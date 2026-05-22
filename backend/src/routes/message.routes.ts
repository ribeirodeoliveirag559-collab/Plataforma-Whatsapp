import { Router } from 'express'
import { authMiddleware } from '../middlewares/auth.middleware'
import prisma from '../config/database'

const router = Router()
router.use(authMiddleware)

router.get('/:ticketId', async (req, res) => {
  const { pageNumber = '1' } = req.query
  const pageSize = 50
  const skip = (Number(pageNumber) - 1) * pageSize

  const [messages, count] = await Promise.all([
    prisma.message.findMany({
      where: { ticketId: Number(req.params.ticketId), isDeleted: false },
      include: { sender: { select: { id: true, name: true, avatar: true } } },
      orderBy: { createdAt: 'asc' },
      skip,
      take: pageSize
    }),
    prisma.message.count({ where: { ticketId: Number(req.params.ticketId) } })
  ])

  return res.json({ messages, count })
})

export default router
