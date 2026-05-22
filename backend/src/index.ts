import express from 'express'
import cors from 'cors'
import { createServer } from 'http'
import { Server } from 'socket.io'
import dotenv from 'dotenv'

import authRoutes from './routes/auth.routes'
import contactRoutes from './routes/contact.routes'
import ticketRoutes from './routes/ticket.routes'
import messageRoutes from './routes/message.routes'
import queueRoutes from './routes/queue.routes'
import userRoutes from './routes/user.routes'
import { setupWebSocket } from './websocket/socket'

dotenv.config()

const app = express()
const httpServer = createServer(app)
const io = new Server(httpServer, {
  cors: { origin: process.env.FRONTEND_URL || 'http://localhost:3000' }
})

// Middlewares
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:3000' }))
app.use(express.json())

// Rotas
app.use('/api/auth', authRoutes)
app.use('/api/contacts', contactRoutes)
app.use('/api/tickets', ticketRoutes)
app.use('/api/messages', messageRoutes)
app.use('/api/queues', queueRoutes)
app.use('/api/users', userRoutes)

// Health check
app.get('/health', (_, res) => res.json({ status: 'ok', timestamp: new Date() }))

// WebSocket
setupWebSocket(io)

const PORT = process.env.PORT || 8080
httpServer.listen(PORT, () => {
  console.log(`🚀 Backend rodando na porta ${PORT}`)
})

export { io }
