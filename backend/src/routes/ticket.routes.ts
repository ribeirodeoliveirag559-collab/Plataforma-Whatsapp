import { Router } from 'express'
import { listTickets, getTicket, updateTicket } from '../controllers/ticket.controller'
import { authMiddleware } from '../middlewares/auth.middleware'

const router = Router()

router.use(authMiddleware)
router.get('/', listTickets)
router.get('/:id', getTicket)
router.put('/:id', updateTicket)

export default router
