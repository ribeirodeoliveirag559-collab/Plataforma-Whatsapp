/**
 * Helpers de permissão do lado do cliente.
 * Trabalham em cima do objeto `user` salvo no localStorage.
 */

export interface StoredQueue {
  id: number
  name: string
  color?: string
}

export interface StoredUser {
  id: number
  name: string
  username: string
  profileSlug?: string
  isManager?: boolean
  defaultQueueId?: number | null
  defaultQueue?: StoredQueue | null
  queues?: StoredQueue[]
}

/** Nome canônico da fila que libera o link de Suporte Clipp. */
export const SUPORTE_CLIPP_QUEUE_NAME = 'Suporte ao Clipp Pro'

/** Carrega o user do localStorage (somente client-side). */
export function getStoredUser(): StoredUser | null {
  if (typeof window === 'undefined') return null
  const raw = localStorage.getItem('user')
  if (!raw) return null
  try { return JSON.parse(raw) as StoredUser } catch { return null }
}

/** Gestor: campo isManager ou profileSlug === 'admin'. */
export function isUserManager(user: StoredUser | null): boolean {
  if (!user) return false
  return Boolean(user.isManager) || user.profileSlug === 'admin'
}

/** Tem acesso ao Suporte Clipp? Gestor OU tem a fila "Suporte ao Clipp Pro". */
export function canAccessSuporteClipp(user: StoredUser | null): boolean {
  if (!user) return false
  if (isUserManager(user)) return true

  const hasInQueues = user.queues?.some(q => q.name === SUPORTE_CLIPP_QUEUE_NAME) ?? false
  const hasAsDefault = user.defaultQueue?.name === SUPORTE_CLIPP_QUEUE_NAME

  return hasInQueues || hasAsDefault
}
