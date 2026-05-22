import { Server } from 'socket.io'

export const setupWebSocket = (io: Server) => {
  io.on('connection', (socket) => {
    console.log(`🔌 Cliente conectado: ${socket.id}`)

    // Entrar na sala de um ticket específico
    socket.on('ticket:join', (ticketId: number) => {
      socket.join(`ticket:${ticketId}`)
    })

    // Sair da sala de um ticket
    socket.on('ticket:leave', (ticketId: number) => {
      socket.leave(`ticket:${ticketId}`)
    })

    socket.on('disconnect', () => {
      console.log(`🔌 Cliente desconectado: ${socket.id}`)
    })
  })
}
