import { Router } from 'express'
import { authMiddleware } from '../middlewares/auth.middleware'
import prisma from '../config/database'

const router = Router()
router.use(authMiddleware)

router.get('/', async (_, res) => {
  const queues = await prisma.queue.findMany({
    where: { deletedAt: null },
    orderBy: { order: 'asc' },
    include: {
      _count: {
        select: {
          tickets: { where: { status: { in: ['OPEN', 'PENDING'] } } }
        }
      }
    }
  })
  return res.json(queues)
})

export default router
