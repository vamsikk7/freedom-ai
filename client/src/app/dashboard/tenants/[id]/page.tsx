'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { tenantAPI, userAPI, consumptionAPI, organizationAPI } from '@/lib/api'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8']

export default function TenantDetailsPage() {
  const params = useParams()
  const tenantId = params.id as string
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'consumption' | 'billing' | 'settings'>('overview')
  const [timePeriod, setTimePeriod] = useState<'today' | 'week' | 'month' | 'all'>('month')
  const [limits, setLimits] = useState({
    monthlyLimit: 0,
    dailyLimit: 0,
    perUserLimit: 0,
  })
  const [autoTopUp, setAutoTopUp] = useState({
    enabled: false,
    threshold: 0,
    amount: 0,
  })

  const { data: tenantDetails, isLoading } = useQuery({
    queryKey: ['tenant-details', tenantId],
    queryFn: async () => {
      const response = await tenantAPI.getDetails(tenantId)
      return response.data
    },
  })

  const { data: users } = useQuery({
    queryKey: ['tenant-users', tenantId],
    queryFn: async () => {
      const response = await userAPI.list({ organizationId: tenantId })
      return response.data
    },
    enabled: activeTab === 'users',
  })

  const { data: consumptionByAssistant } = useQuery({
    queryKey: ['consumption-by-assistant', tenantId, timePeriod],
    queryFn: async () => {
      const now = new Date()
      let startDate = ''
      if (timePeriod === 'today') {
        startDate = new Date(now.setHours(0, 0, 0, 0)).toISOString()
      } else if (timePeriod === 'week') {
        startDate = new Date(now.setDate(now.getDate() - 7)).toISOString()
      } else if (timePeriod === 'month') {
        startDate = new Date(now.setMonth(now.getMonth() - 1)).toISOString()
      }
      const response = await consumptionAPI.byAssistant({
        organizationId: tenantId,
        startDate: startDate || undefined,
      })
      return response.data
    },
    enabled: activeTab === 'consumption',
  })

  if (isLoading) return <div className="p-8">Loading...</div>
  if (!tenantDetails) return <div className="p-8">Tenant not found</div>

  const pieData = consumptionByAssistant?.map((item: any) => ({
    name: item._id || 'Unknown',
    value: item.tokens || 0,
  })) || []

  // Initialize limits and auto-top-up from tenant data
  useEffect(() => {
    if (tenantDetails?.tenant) {
      setLimits({
        monthlyLimit: tenantDetails.tenant.consumptionLimits?.monthlyLimit || 0,
        dailyLimit: tenantDetails.tenant.consumptionLimits?.dailyLimit || 0,
        perUserLimit: tenantDetails.tenant.consumptionLimits?.perUserLimit || 0,
      })
      setAutoTopUp({
        enabled: tenantDetails.tenant.autoTopUp?.enabled || false,
        threshold: tenantDetails.tenant.autoTopUp?.threshold || 0,
        amount: tenantDetails.tenant.autoTopUp?.amount || 0,
      })
    }
  }, [tenantDetails])

  const limitsMutation = useMutation({
    mutationFn: (data: typeof limits) => organizationAPI.updateConsumptionLimits(tenantId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenant-details', tenantId] })
      alert('Consumption limits updated successfully')
    },
  })

  const autoTopUpMutation = useMutation({
    mutationFn: (data: typeof autoTopUp) => organizationAPI.updateAutoTopUp(tenantId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenant-details', tenantId] })
      alert('Auto-top-up settings updated successfully')
    },
  })

  return (
    <div className="p-8">
      <div className="mb-6">
        <Link href="/dashboard/tenants" className="text-primary-600 hover:text-primary-800">
          ← Back to Tenants
        </Link>
      </div>

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">{tenantDetails.tenant?.name || 'Tenant Details'}</h1>
        <Link
          href={`/dashboard/tenants/${tenantId}/edit`}
          className="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700"
        >
          Edit Tenant
        </Link>
      </div>

      {/* Tabs */}
      <div className="border-b mb-6">
        <nav className="flex space-x-8">
          {(['overview', 'users', 'consumption', 'billing', 'settings'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </nav>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 bg-white border rounded-lg">
              <h2 className="text-xl font-semibold mb-4">Organization Information</h2>
              <dl className="space-y-2">
                <div>
                  <dt className="text-sm text-gray-500">Organization ID</dt>
                  <dd className="text-lg">{tenantDetails.tenant?.orgId}</dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-500">Contact Email</dt>
                  <dd className="text-lg">{tenantDetails.tenant?.contactEmail}</dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-500">Billing Email</dt>
                  <dd className="text-lg">{tenantDetails.tenant?.billingEmail}</dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-500">Status</dt>
                  <dd>
                    <span
                      className={`px-2 py-1 text-xs rounded ${
                        tenantDetails.tenant?.status === 'active'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {tenantDetails.tenant?.status}
                    </span>
                  </dd>
                </div>
              </dl>
            </div>

            <div className="p-6 bg-white border rounded-lg">
              <h2 className="text-xl font-semibold mb-4">Statistics</h2>
              <dl className="space-y-2">
                <div>
                  <dt className="text-sm text-gray-500">Active Users</dt>
                  <dd className="text-lg">{tenantDetails.stats?.userCount || 0}</dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-500">This Month Tokens</dt>
                  <dd className="text-lg">{(tenantDetails.stats?.totalTokens || 0).toLocaleString()}</dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-500">This Month Cost</dt>
                  <dd className="text-lg">${(tenantDetails.stats?.totalCost || 0).toFixed(2)}</dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-500">Wallet Balance</dt>
                  <dd className="text-lg font-bold text-primary-600">
                    ${(tenantDetails.tenant?.walletBalance || 0).toFixed(2)}
                  </dd>
                </div>
              </dl>
            </div>
          </div>

          {tenantDetails.billingHistory && tenantDetails.billingHistory.length > 0 && (
            <div className="p-6 bg-white border rounded-lg">
              <h2 className="text-xl font-semibold mb-4">Recent Billing History</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="px-4 py-2 text-left">Date</th>
                      <th className="px-4 py-2 text-left">Tokens</th>
                      <th className="px-4 py-2 text-left">Cost</th>
                      <th className="px-4 py-2 text-left">Balance After</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tenantDetails.billingHistory.slice(0, 10).map((billing: any) => (
                      <tr key={billing.id} className="border-b">
                        <td className="px-4 py-2">
                          {new Date(billing.billingDate).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-2">{billing.totalTokens.toLocaleString()}</td>
                        <td className="px-4 py-2">${billing.totalCost.toFixed(2)}</td>
                        <td className="px-4 py-2">${billing.walletBalanceAfter.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold">User Management</h2>
            <Link
              href={`/dashboard/users/new?organizationId=${tenantId}`}
              className="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700"
            >
              Add User
            </Link>
          </div>

          {users && users.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white border border-gray-200">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {users.map((user) => (
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
                        <Link
                          href={`/dashboard/users/${user.userId}`}
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
          ) : (
            <div className="p-8 text-center text-gray-500">No users found</div>
          )}
        </div>
      )}

      {/* Consumption Tab */}
      {activeTab === 'consumption' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold">Consumption Overview</h2>
            <select
              value={timePeriod}
              onChange={(e) => setTimePeriod(e.target.value as typeof timePeriod)}
              className="px-4 py-2 border rounded"
            >
              <option value="today">Today</option>
              <option value="week">Last 7 Days</option>
              <option value="month">Last 30 Days</option>
              <option value="all">All Time</option>
            </select>
          </div>

          {pieData.length > 0 && (
            <div className="p-6 bg-white border rounded-lg">
              <h3 className="text-lg font-semibold mb-4">Consumption by Assistant</h3>
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
            </div>
          )}

          <div className="p-6 bg-white border rounded-lg">
            <Link
              href={`/dashboard/consumption?organizationId=${tenantId}`}
              className="text-primary-600 hover:text-primary-800"
            >
              View Full Consumption History →
            </Link>
          </div>
        </div>
      )}

      {/* Billing Tab */}
      {activeTab === 'billing' && (
        <div className="space-y-6">
          <h2 className="text-2xl font-semibold">Billing History</h2>
          {tenantDetails.billingHistory && tenantDetails.billingHistory.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white border border-gray-200">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Period</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tokens</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cost</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Balance After</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {tenantDetails.billingHistory.map((billing: any) => (
                    <tr key={billing.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {new Date(billing.billingDate).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {new Date(billing.periodStart).toLocaleDateString()} - {new Date(billing.periodEnd).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">{billing.totalTokens.toLocaleString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap">${billing.totalCost.toFixed(2)}</td>
                      <td className="px-6 py-4 whitespace-nowrap">${billing.walletBalanceAfter.toFixed(2)}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 text-xs rounded ${
                            billing.status === 'completed'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {billing.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 text-center text-gray-500">No billing history found</div>
          )}
        </div>
      )}

      {/* Settings Tab */}
      {activeTab === 'settings' && (
        <div className="space-y-6">
          <h2 className="text-2xl font-semibold">Settings</h2>
          
          <div className="p-6 bg-white border rounded-lg">
            <h3 className="text-lg font-semibold mb-4">Consumption Limits</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Monthly Limit (tokens)
                </label>
                <input
                  type="number"
                  value={limits.monthlyLimit}
                  onChange={(e) => setLimits({ ...limits, monthlyLimit: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-2 border rounded"
                  placeholder="0 = unlimited"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Daily Limit (tokens)
                </label>
                <input
                  type="number"
                  value={limits.dailyLimit}
                  onChange={(e) => setLimits({ ...limits, dailyLimit: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-2 border rounded"
                  placeholder="0 = unlimited"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Per User Limit (tokens)
                </label>
                <input
                  type="number"
                  value={limits.perUserLimit}
                  onChange={(e) => setLimits({ ...limits, perUserLimit: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-2 border rounded"
                  placeholder="0 = unlimited"
                />
              </div>
              <button 
                onClick={() => limitsMutation.mutate(limits)}
                disabled={limitsMutation.isPending}
                className="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700 disabled:bg-gray-400"
              >
                {limitsMutation.isPending ? 'Saving...' : 'Save Limits'}
              </button>
            </div>
          </div>

          <div className="p-6 bg-white border rounded-lg">
            <h3 className="text-lg font-semibold mb-4">Auto-Top-Up Settings</h3>
            <div className="space-y-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={autoTopUp.enabled}
                  onChange={(e) => setAutoTopUp({ ...autoTopUp, enabled: e.target.checked })}
                  className="mr-2"
                />
                <label className="text-sm font-medium text-gray-700">Enable Auto-Top-Up</label>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Threshold ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={autoTopUp.threshold}
                  onChange={(e) => setAutoTopUp({ ...autoTopUp, threshold: parseFloat(e.target.value) || 0 })}
                  className="w-full px-4 py-2 border rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Top-Up Amount ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={autoTopUp.amount}
                  onChange={(e) => setAutoTopUp({ ...autoTopUp, amount: parseFloat(e.target.value) || 0 })}
                  className="w-full px-4 py-2 border rounded"
                />
              </div>
              <button 
                onClick={() => autoTopUpMutation.mutate(autoTopUp)}
                disabled={autoTopUpMutation.isPending}
                className="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700 disabled:bg-gray-400"
              >
                {autoTopUpMutation.isPending ? 'Saving...' : 'Save Auto-Top-Up Settings'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
