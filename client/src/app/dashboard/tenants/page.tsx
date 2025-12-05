'use client'

import { useQuery } from '@tanstack/react-query'
import { tenantAPI, type Organization } from '@/lib/api'
import Link from 'next/link'
import { useState } from 'react'

export default function TenantsPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  const { data: tenants, isLoading, error } = useQuery({
    queryKey: ['tenants'],
    queryFn: async () => {
      const response = await tenantAPI.list()
      return response.data
    },
  })

  // Filter tenants
  const filteredTenants = tenants?.filter((tenant) => {
    if (statusFilter !== 'all' && tenant.status !== statusFilter) return false
    if (searchTerm) {
      const search = searchTerm.toLowerCase()
      if (!tenant.name.toLowerCase().includes(search) && 
          !tenant.orgId.toLowerCase().includes(search)) {
        return false
      }
    }
    return true
  })

  if (isLoading) return <div className="p-8">Loading...</div>
  if (error) return <div className="p-8">Error loading tenants</div>

  return (
    <div className="p-8 bg-gray-50">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Tenants</h1>
        <Link
          href="/dashboard/tenants/new"
          className="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700"
        >
          Add Tenant
        </Link>
      </div>

      {/* Filters and Search */}
      <div className="mb-6 space-y-4">
        <div className="flex gap-4 items-center">
          <input
            type="text"
            placeholder="Search by name or organization ID"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-4 py-2 border rounded flex-1"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border rounded"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="suspended">Suspended</option>
          </select>
        </div>
        <div className="flex gap-4">
          <input
            type="date"
            placeholder="Start Date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="px-4 py-2 border rounded"
          />
          <input
            type="date"
            placeholder="End Date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="px-4 py-2 border rounded"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-200">
          <thead>
            <tr className="bg-gray-50">
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Org ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User Count</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Wallet Balance</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredTenants?.map((tenant) => (
              <tr key={tenant.id}>
                <td className="px-6 py-4 whitespace-nowrap">{tenant.name}</td>
                <td className="px-6 py-4 whitespace-nowrap">{tenant.orgId}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {(tenant as any).userCount ?? 0}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">${tenant.walletBalance.toFixed(2)}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-2 py-1 text-xs rounded ${
                      tenant.status === 'active'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {tenant.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {tenant.createdAt ? new Date(tenant.createdAt).toLocaleDateString() : '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex gap-2">
                    <Link
                      href={`/dashboard/tenants/${tenant.orgId}`}
                      className="text-primary-600 hover:text-primary-800"
                    >
                      View
                    </Link>
                    <Link
                      href={`/dashboard/tenants/${tenant.orgId}/edit`}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      Edit
                    </Link>
                    <Link
                      href={`/dashboard/tenants/${tenant.orgId}/users`}
                      className="text-green-600 hover:text-green-800"
                    >
                      Users
                    </Link>
                    <Link
                      href={`/dashboard/consumption?organizationId=${tenant.orgId}`}
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
    </div>
  )
}
