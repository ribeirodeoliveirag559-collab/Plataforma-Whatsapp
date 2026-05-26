// Script temporário — atualiza senha do usuário gustavo
// Uso: DATABASE_URL="..." node scripts/update-password.mjs

import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

const USERNAME = 'gustavo'
const NOVA_SENHA = '172526'

async function main() {
  const hash = await bcrypt.hash(NOVA_SENHA, 10)
  const user = await prisma.user.update({
    where: { username: USERNAME },
    data: { passwordHash: hash },
  })
  console.log(`✅ Senha do usuário "${user.username}" (${user.name}) atualizada com sucesso!`)
}

main()
  .catch(e => { console.error('❌ Erro:', e.message); process.exit(1) })
  .finally(() => prisma.$disconnect())
