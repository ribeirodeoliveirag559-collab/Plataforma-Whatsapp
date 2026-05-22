import { Router } from 'express'
import { authMiddleware } from '../middlewares/auth.middleware'
import prisma from '../config/database'

const router = Router()
router.use(authMiddleware)

router.get('/', async (req, res) => {
  const { search, pageNumber = '1' } = req.query
  const pageSize = 20
  const skip = (Number(pageNumber) - 1) * pageSize

  const where = search
    ? {
        OR: [
          { name: { contains: String(search), mode: 'insensitive' as const } },
          { number: { contains: String(search) } },
          { company: { contains: String(search), mode: 'insensitive' as const } }
        ],
        deletedAt: null
      }
    : { deletedAt: null }

  const [contacts, count] = await Promise.all([
    prisma.contact.findMany({ where, skip, take: pageSize, orderBy: { name: 'asc' }, include: { tags: { include: { tag: true } } } }),
    prisma.contact.count({ where })
  ])

  return res.json({ contacts, count })
})

router.get('/:id', async (req, res) => {
  const contact = await prisma.contact.findUnique({
    where: { id: Number(req.params.id) },
    include: {
      tags: { include: { tag: true } },
      tickets: { orderBy: { createdAt: 'desc' }, take: 10, include: { queue: true, user: true } }
    }
  })
  if (!contact) return res.status(404).json({ error: 'Contato não encontrado' })
  return res.json(contact)
})

export default router
