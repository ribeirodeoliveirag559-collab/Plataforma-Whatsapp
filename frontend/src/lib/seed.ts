import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Iniciando seed...')

  // Departamentos (baseado nos dados reais do Gosac)
  const queues = await Promise.all([
    prisma.queue.upsert({ where: { id: 1 }, update: {}, create: { id: 1, name: 'Vendas', color: '#f59e0b', order: 1, greetingMessage: 'Não deixe de visitar nosso site www.phinformatica.info' } }),
    prisma.queue.upsert({ where: { id: 2 }, update: {}, create: { id: 2, name: 'Financeiro', color: '#ef4444', order: 2, greetingMessage: 'Setor financeiro. Como posso ajudar?' } }),
    prisma.queue.upsert({ where: { id: 3 }, update: {}, create: { id: 3, name: 'Suporte ao Clipp Pro', color: '#22c55e', order: 3, greetingMessage: 'Suporte Clipp Pro. Informe seu CNPJ ou nome da empresa.' } }),
    prisma.queue.upsert({ where: { id: 4 }, update: {}, create: { id: 4, name: 'Solicitação de Serviço', color: '#8b5cf6', order: 4, greetingMessage: 'Para abertura de OS informe nome, empresa e descrição do problema.' } }),
    prisma.queue.upsert({ where: { id: 5 }, update: {}, create: { id: 5, name: 'Laboratório', color: '#06b6d4', order: 5, greetingMessage: 'Assistência técnica. Informe o equipamento e o problema.' } }),
    prisma.queue.upsert({ where: { id: 6 }, update: {}, create: { id: 6, name: 'Ordem de Serviço', color: '#f97316', order: 6, greetingMessage: 'Digite o número da sua Ordem de Serviço.' } }),
    prisma.queue.upsert({ where: { id: 7 }, update: {}, create: { id: 7, name: 'RH', color: '#ec4899', order: 7, greetingMessage: 'RH — Recebimento de currículos.' } }),
    prisma.queue.upsert({ where: { id: 8 }, update: {}, create: { id: 8, name: 'Fornecedor', color: '#64748b', order: 8, greetingMessage: 'Setor de compras. Como posso ajudar?' } }),
  ])
  console.log(`✅ ${queues.length} departamentos criados`)

  // Usuários reais do Gosac
  const senha = await bcrypt.hash('ph2024', 10)
  const users = await Promise.all([
    prisma.user.upsert({
      where: { username: 'gustavo' }, update: {},
      create: { name: 'GUSTAVO HENRIQUE', username: 'gustavo', passwordHash: senha, profileSlug: 'admin', isManager: true, defaultQueueId: 3 }
    }),
    prisma.user.upsert({
      where: { username: 'paulo' }, update: {},
      create: { name: 'Paulo Henrique', username: 'paulo', passwordHash: senha, profileSlug: 'admin', isManager: true }
    }),
    prisma.user.upsert({
      where: { username: 'laura' }, update: {},
      create: { name: 'LAURA LOIS', username: 'laura', passwordHash: senha, profileSlug: 'admin' }
    }),
    prisma.user.upsert({
      where: { username: 'iara' }, update: {},
      create: { name: 'IARA SALES DINIZ', username: 'iara', passwordHash: senha, profileSlug: 'user', defaultQueueId: 1 }
    }),
    prisma.user.upsert({
      where: { username: 'luiz' }, update: {},
      create: { name: 'LUIZ FLAVIO CALO', username: 'luiz', passwordHash: senha, profileSlug: 'user', defaultQueueId: 5 }
    }),
    prisma.user.upsert({
      where: { username: 'bruno' }, update: {},
      create: { name: 'bruno magalhaes', username: 'bruno', passwordHash: senha, profileSlug: 'user' }
    }),
  ])
  console.log(`✅ ${users.length} usuários criados`)
  console.log('🔑 Senha padrão de todos: ph2024')
  console.log('')
  console.log('Usuários:')
  users.forEach(u => console.log(`  ${u.username} → ${u.name}`))
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
