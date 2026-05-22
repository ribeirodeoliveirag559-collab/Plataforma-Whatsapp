import { Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import prisma from '../config/database'

export const login = async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body

    const user = await prisma.user.findFirst({
      where: {
        OR: [{ username }, { email: username }],
        active: true,
        deletedAt: null
      }
    })

    if (!user) {
      return res.status(401).json({ error: 'Usuário não encontrado' })
    }

    const valid = await bcrypt.compare(password, user.passwordHash)
    if (!valid) {
      return res.status(401).json({ error: 'Senha incorreta' })
    }

    const token = jwt.sign(
      { id: user.id, profileSlug: user.profileSlug },
      process.env.JWT_SECRET!,
      { expiresIn: '30d' }
    )

    return res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        username: user.username,
        email: user.email,
        profileSlug: user.profileSlug,
        avatar: user.avatar
      }
    })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ error: 'Erro interno' })
  }
}

export const me = async (req: Request & { userId?: number }, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: {
        id: true, name: true, username: true,
        email: true, profileSlug: true, avatar: true,
        defaultQueueId: true
      }
    })
    return res.json(user)
  } catch {
    return res.status(500).json({ error: 'Erro interno' })
  }
}
