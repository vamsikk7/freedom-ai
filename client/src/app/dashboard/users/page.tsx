'use client'

import { useQuery } from '@tanstack/react-query'
import { userAPI, type User } from '@/lib/api'
import { useState, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

function UsersPageContent() {
  const searchParams = useSearchParams()
  const [orgId, setOrgId] = useState(searchParams.get('organizationId') || '')
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  const { data: users, isLoading } = useQuery({
    queryKey: ['users', orgId],
    queryFn: async () => {
      if (!orgId) return []
      const response = await userAPI.list({ organizationId: orgId })
      return response.data
    },
    enabled: !!orgId,
  })

  // Filter users
  const filteredUsers = users?.filter((user) => {
    if (roleFilter !== 'all' && user.role !== roleFilter) return false
    if (statusFilter !== 'all' && user.status !== statusFilter) return false
    if (searchTerm) {
      const search = searchTerm.toLowerCase()
      if (!user.name.toLowerCase().includes(search) && 
          !user.email.toLowerCase().includes(search)) {
        return false
      }
    }
    return true
  })

  return (
    <div className="p-8 bg-gray-50">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Users</h1>
        <Link
          href={`/dashboard/users/new${orgId ? `?organizationId=${orgId}` : ''}`}
          className="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700"
        >
          Add User
        </Link>
      </div>

      <div className="mb-6 space-y-4">
        <div className="flex gap-4">
          <input
            type="text"
            placeholder="Organization ID"
            value={orgId}
            onChange={(e) => setOrgId(e.target.value)}
            className="px-4 py-2 border rounded"
          />
          <input
            type="text"
            placeholder="Search by name or email"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-4 py-2 border rounded flex-1"
          />
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-4 py-2 border rounded"
          >
            <option value="all">All Roles</option>
            <option value="tenant_user">User</option>
            <option value="tenant_admin">Admin</option>
            <option value="developer">Developer</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border rounded"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {isLoading && <div>Loading...</div>}

      {filteredUsers && filteredUsers.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Active</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredUsers.map((user) => (
                <tr key={user.id}>
                  <td className="px-6 py-4 whitespace-nowrap">{user.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{user.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 text-xs rounded bg-blue-100 text-blue-800">
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 text-xs rounded ${
                        user.status === 'active'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {user.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {user.lastActive ? new Date(user.lastActive).toLocaleDateString() : 'Never'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex gap-2">
                      <Link
                        href={`/dashboard/users/${user.userId}`}
                        className="text-primary-600 hover:text-primary-800"
                      >
                        View
                      </Link>
                      <Link
                        href={`/dashboard/users/${user.userId}/edit`}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        Edit
                      </Link>
                      <Link
                        href={`/dashboard/consumption?userId=${user.userId}`}
                        className="text-purple-600 hover:text-purple-800"
                      >
                        Consumption
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="p-8 text-center text-gray-500">
          {!orgId ? 'Enter an Organization ID to view users' : 'No users found'}
        </div>
      )}
    </div>
  )
}

export default function UsersPage() {
  return (
    <Suspense fallback={<div className="p-8">Loading...</div>}>
      <UsersPageContent />
    </Suspense>
  )
}
