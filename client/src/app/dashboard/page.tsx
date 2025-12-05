'use client'

import { useQuery } from '@tanstack/react-query'
import { analyticsAPI, tenantAPI, consumptionAPI } from '@/lib/api'
import Link from 'next/link'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'
import { useEffect, useState } from 'react'

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8']

export default function DashboardOverview() {
  const [selectedOrgId, setSelectedOrgId] = useState('')
  
  const { data: overview } = useQuery({
    queryKey: ['analytics-overview'],
    queryFn: async () => {
      const response = await analyticsAPI.overview()
      return response.data
    },
  })

  // Real-time consumption polling
  const { data: realTimeConsumption } = useQuery({
    queryKey: ['real-time-consumption', selectedOrgId],
    queryFn: async () => {
      if (!selectedOrgId) return null
      const response = await consumptionAPI.realTime({ organizationId: selectedOrgId })
      return response.data
    },
    enabled: !!selectedOrgId,
    refetchInterval: 5000, // Poll every 5 seconds
  })

  const { data: tenants } = useQuery({
    queryKey: ['tenants'],
    queryFn: async () => {
      const response = await tenantAPI.list()
      return response.data
    },
  })

  const { data: consumptionByAssistant } = useQuery({
    queryKey: ['consumption-by-assistant'],
    queryFn: async () => {
      const response = await consumptionAPI.byAssistant()
      return response.data
    },
  })

  const pieData = consumptionByAssistant?.map((item: any) => ({
    name: item._id || 'Unknown',
    value: item.tokens || 0,
  })) || []

  return (
    <div className="p-8 bg-gray-50">
      <h1 className="text-3xl font-bold mb-6 text-gray-900">Dashboard Overview</h1>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="p-6 bg-white border rounded-lg">
          <h3 className="text-sm text-gray-500 mb-2">Total Tenants</h3>
          <p className="text-3xl font-bold text-gray-900">{overview?.tenants?.total || 0}</p>
          <p className="text-sm text-green-600 mt-1">{overview?.tenants?.active || 0} active</p>
        </div>
        <div className="p-6 bg-white border rounded-lg">
          <h3 className="text-sm text-gray-500 mb-2">Total Users</h3>
          <p className="text-3xl font-bold text-gray-900">{overview?.users?.total || 0}</p>
          <p className="text-sm text-green-600 mt-1">{overview?.users?.active || 0} active</p>
        </div>
        <div className="p-6 bg-white border rounded-lg">
          <h3 className="text-sm text-gray-500 mb-2">This Month Tokens</h3>
          <p className="text-3xl font-bold text-gray-900">{(overview?.consumption?.thisMonth?.tokens || 0).toLocaleString()}</p>
          <p className="text-sm text-gray-600 mt-1">${(overview?.consumption?.thisMonth?.cost || 0).toFixed(2)}</p>
        </div>
        <div className="p-6 bg-white border rounded-lg">
          <h3 className="text-sm text-gray-500 mb-2">Today Tokens</h3>
          <p className="text-3xl font-bold text-gray-900">{(overview?.consumption?.today?.tokens || 0).toLocaleString()}</p>
          <p className="text-sm text-gray-600 mt-1">${(overview?.consumption?.today?.cost || 0).toFixed(2)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Consumption by Assistant */}
        <div className="p-6 bg-white border rounded-lg">
          <h2 className="text-xl font-semibold mb-4 text-gray-900">Consumption by Assistant</h2>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-500">No data available</p>
          )}
        </div>

        {/* Quick Actions */}
        {/* Real-time Consumption */}
        {selectedOrgId && realTimeConsumption && (
          <div className="p-6 bg-white border rounded-lg mb-6">
            <h2 className="text-xl font-semibold mb-2 text-gray-900">Real-Time Consumption</h2>
            <p className="text-3xl font-bold text-primary-600">
              {realTimeConsumption.totalTokensToday.toLocaleString()} tokens
            </p>
            <p className="text-sm text-gray-500 mt-1">Today (live)</p>
          </div>
        )}

        <div className="p-6 bg-white border rounded-lg">
          <h2 className="text-xl font-semibold mb-4 text-gray-900">Quick Actions</h2>
          <div className="space-y-3">
            <Link
              href="/dashboard/tenants"
              className="block p-3 border rounded hover:bg-gray-50"
            >
              Manage Tenants
            </Link>
            <Link
              href="/dashboard/users"
              className="block p-3 border rounded hover:bg-gray-50"
            >
              Manage Users
            </Link>
            <Link
              href="/dashboard/billing"
              className="block p-3 border rounded hover:bg-gray-50"
            >
              View Billing
            </Link>
            <Link
              href="/dashboard/analytics"
              className="block p-3 border rounded hover:bg-gray-50"
            >
              View Analytics
            </Link>
            <Link
              href="/dashboard/reports"
              className="block p-3 border rounded hover:bg-gray-50"
            >
              View Reports
            </Link>
          </div>
        </div>
      </div>

      {/* Recent Tenants */}
      {tenants && tenants.length > 0 && (
        <div className="mt-8 p-6 bg-white border rounded-lg">
          <h2 className="text-xl font-semibold mb-4 text-gray-900">Recent Tenants</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b">
                  <th className="px-4 py-2 text-left">Name</th>
                  <th className="px-4 py-2 text-left">Wallet Balance</th>
                  <th className="px-4 py-2 text-left">Status</th>
                  <th className="px-4 py-2 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {tenants.slice(0, 5).map((tenant) => (
                  <tr key={tenant.id} className="border-b">
                    <td className="px-4 py-2">{tenant.name}</td>
                    <td className="px-4 py-2">${tenant.walletBalance.toFixed(2)}</td>
                    <td className="px-4 py-2">
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
                    <td className="px-4 py-2">
                      <Link
                        href={`/dashboard/tenants/${tenant.orgId}`}
                        className="text-primary-600 hover:text-primary-800"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
