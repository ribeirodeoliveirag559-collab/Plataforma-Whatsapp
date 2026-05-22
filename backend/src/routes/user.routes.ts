import { Router } from 'express'
import { authMiddleware } from '../middlewares/auth.middleware'
import prisma from '../config/database'

const router = Router()
router.use(authMiddleware)

router.get('/', async (_, res) => {
  const users = await prisma.user.findMany({
    where: { active: true, deletedAt: null },
    select: { id: true, name: true, username: true, profileSlug: true, avatar: true, defaultQueueId: true }
  })
  return res.json({ users })
})

export default router
