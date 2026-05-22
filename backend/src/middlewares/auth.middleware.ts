import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'

export interface AuthRequest extends Request {
  userId?: number
  profileSlug?: string
}

export const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization
  if (!authHeader) {
    return res.status(401).json({ error: 'Token não informado' })
  }

  const [, token] = authHeader.split(' ')
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      id: number
      profileSlug: string
    }
    req.userId = decoded.id
    req.profileSlug = decoded.profileSlug
    return next()
  } catch {
    return res.status(401).json({ error: 'Token inválido' })
  }
}
