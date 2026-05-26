'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { MessageSquare, Users, LayoutDashboard, Shield, LogOut, Headphones } from 'lucide-react'
import { LOGO_BASE64 } from '@/lib/logo'
import styles from './layout.module.css'

interface NavItem { href: string; label: string; icon: React.ElementType; exact?: boolean }

// Nav principal — sem Departamentos
const mainNav: NavItem[] = [
  { href: '/dashboard',              label: 'Dashboard',    icon: LayoutDashboard, exact: true },
  { href: '/dashboard/atendimentos', label: 'Atendimentos', icon: MessageSquare },
  { href: '/dashboard/contatos',     label: 'Contatos',     icon: Users },
]

const adminItem: NavItem = { href: '/dashboard/admin', label: 'Admin', icon: Shield }

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router   = useRouter()
  const [isManager, setIsManager] = useState(false)
  const [userName, setUserName]   = useState('')

  useEffect(() => {
    const stored = localStorage.getItem('user')
    if (!stored) { router.push('/auth/login'); return }
    const user = JSON.parse(stored)
    setIsManager(user.isManager || user.profileSlug === 'admin')
    setUserName(user.name?.split(' ')[0] || user.username)
  }, [router])

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    router.push('/auth/login')
  }

  const renderNavItem = ({ href, label, icon: Icon, exact }: NavItem, admin = false) => {
    const active = exact ? pathname === href : pathname.startsWith(href)
    const className = active
      ? `${styles.navItem} ${admin ? styles.navItemAdmin : styles.navItemActive}`
      : styles.navItem
    return (
      <Link key={href} href={href} className={className}>
        <Icon size={17} className="shrink-0" />
        <span className={styles.navLabel}>{label}</span>
        {admin && active && <span className={styles.adminBadge}>ADMIN</span>}
      </Link>
    )
  }

  return (
    <div className={styles.shell}>
      {/* Topbar flutuante glassmorphism */}
      <header className={styles.topbar}>
        {/* Logo */}
        <Link href="/dashboard" className={styles.logoWrap}>
          <img src={LOGO_BASE64} alt="PH Informática" className={styles.logoImg} />
          <span className={styles.logoText}>PH Informática</span>
        </Link>

        <div className={styles.divider} />

        {/* Nav principal */}
        <nav className={styles.nav}>
          {mainNav.map(item => renderNavItem(item))}

          {/* Suporte Clipp (link externo) */}
          <a
            href="https://platformph.vercel.app/"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.navItem}
          >
            <Headphones size={17} className="shrink-0" />
            <span className={styles.navLabel}>Suporte Clipp</span>
          </a>

          {/* Painel Admin (apenas gestores) */}
          {isManager && renderNavItem(adminItem, true)}
        </nav>

        {/* Right side: user + logout */}
        <div className={styles.userSection}>
          <div className={styles.userPill}>
            <div className={styles.userAvatar}>
              {userName[0]?.toUpperCase() || '?'}
            </div>
            <span className={styles.userName}>{userName}</span>
          </div>
          <button onClick={handleLogout} className={styles.logoutBtn} title="Sair">
            <LogOut size={17} />
          </button>
        </div>
      </header>

      {/* Conteúdo principal */}
      <main className={styles.main}>{children}</main>
    </div>
  )
}
