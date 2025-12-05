'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { DashboardGuard } from '@/components/DashboardGuard'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <DashboardGuard>
      <DashboardLayoutContent>{children}</DashboardLayoutContent>
    </DashboardGuard>
  )
}

function DashboardLayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { user, signOut } = useAuth()

  // Define all navigation items with required roles
  const allNavItems = [
    { href: '/dashboard', label: 'Overview', icon: '📊', roles: ['developer', 'tenant_admin', 'tenant_user'] },
    { href: '/dashboard/tenants', label: 'Tenants', icon: '🏢', roles: ['developer'] },
    { href: '/dashboard/users', label: 'Users', icon: '👥', roles: ['developer', 'tenant_admin'] },
    { href: '/dashboard/consumption', label: 'Consumption', icon: '📈', roles: ['developer', 'tenant_admin', 'tenant_user'] },
    { href: '/dashboard/billing', label: 'Billing', icon: '💳', roles: ['developer', 'tenant_admin'] },
    { href: '/dashboard/analytics', label: 'Analytics', icon: '📊', roles: ['developer', 'tenant_admin'] },
    { href: '/dashboard/projects', label: 'Projects', icon: '📁', roles: ['developer', 'tenant_admin', 'tenant_user'] },
    { href: '/dashboard/reports', label: 'Reports', icon: '📄', roles: ['developer', 'tenant_admin'] },
  ]

  // Filter navigation items based on user role
  const navItems = allNavItems.filter((item) => {
    if (!user?.role) return false
    return item.roles.includes(user.role)
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <h1 className="text-xl font-bold text-gray-900">Freedom AI Management</h1>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                      pathname === item.href
                        ? 'border-primary-500 text-gray-900'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <span className="mr-2">{item.icon}</span>
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {user && (
                <>
                  <span className="text-sm text-gray-600">{user.email}</span>
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                    {user.role || 'user'}
                  </span>
                  <button
                    onClick={signOut}
                    className="text-sm text-gray-600 hover:text-gray-900"
                  >
                    Sign Out
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>
      <main>{children}</main>
    </div>
  )
}

