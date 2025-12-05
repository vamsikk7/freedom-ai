'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { billingAPI, tenantAPI, consumptionAPI, organizationAPI } from '@/lib/api'
import { useState, useEffect } from 'react'

interface BillingRecord {
  id: string
  billingDate: string
  periodStart: string
  periodEnd: string
  totalTokens: number
  totalCost: number
  walletBalanceAfter: number
  status: string
}

export default function BillingPage() {
  const [orgId, setOrgId] = useState('')
  const [topUpAmount, setTopUpAmount] = useState('')
  const [showTopUpModal, setShowTopUpModal] = useState(false)
  const [autoTopUp, setAutoTopUp] = useState({
    enabled: false,
    threshold: 0,
    amount: 0,
  })
  const queryClient = useQueryClient()

  const { data: balance } = useQuery({
    queryKey: ['walletBalance', orgId],
    queryFn: async () => {
      if (!orgId) return null
      const response = await billingAPI.walletBalance(orgId)
      return response.data
    },
    enabled: !!orgId,
  })

  const { data: history } = useQuery({
    queryKey: ['billingHistory', orgId],
    queryFn: async () => {
      if (!orgId) return null
      const response = await billingAPI.history(orgId)
      return response.data
    },
    enabled: !!orgId,
  })

  const { data: tenant } = useQuery({
    queryKey: ['tenant', orgId],
    queryFn: async () => {
      if (!orgId) return null
      const response = await tenantAPI.get(orgId)
      return response.data
    },
    enabled: !!orgId,
  })

  // Calculate projected monthly cost
  const { data: projectedCost } = useQuery({
    queryKey: ['projected-cost', orgId],
    queryFn: async () => {
      if (!orgId) return null
      const now = new Date()
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
      const response = await consumptionAPI.history({
        organizationId: orgId,
        startDate: monthStart.toISOString(),
      })
      const data = response.data
      const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
      const daysElapsed = now.getDate()
      const currentCost = data.reduce((sum: number, r: any) => sum + r.cost, 0)
      const dailyAverage = currentCost / daysElapsed
      const projected = dailyAverage * daysInMonth
      return { current: currentCost, projected }
    },
    enabled: !!orgId,
  })

  const topUpMutation = useMutation({
    mutationFn: async (amount: number) => {
      const response = await billingAPI.createCheckoutSession({
        organizationId: orgId,
        amount,
      })
      if (response.data.url) {
        window.location.href = response.data.url
      }
    },
  })

  const handleTopUp = () => {
    const amount = parseFloat(topUpAmount)
    if (amount >= 10 && amount <= 10000) {
      topUpMutation.mutate(amount)
    }
  }

  // Initialize auto-top-up from tenant data
  useEffect(() => {
    if (tenant) {
      setAutoTopUp({
        enabled: tenant.autoTopUp?.enabled || false,
        threshold: tenant.autoTopUp?.threshold || 0,
        amount: tenant.autoTopUp?.amount || 0,
      })
    }
  }, [tenant])

  const autoTopUpMutation = useMutation({
    mutationFn: (data: typeof autoTopUp) => organizationAPI.updateAutoTopUp(orgId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenant', orgId] })
      alert('Auto-top-up settings updated successfully')
    },
  })

  return (
    <div className="p-8 bg-gray-50">
      <h1 className="text-3xl font-bold mb-6 text-gray-900">Billing Dashboard</h1>

      <div className="mb-6">
        <input
          type="text"
          placeholder="Organization ID"
          value={orgId}
          onChange={(e) => setOrgId(e.target.value)}
          className="px-4 py-2 border rounded"
        />
      </div>

      {balance && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="p-6 bg-white border rounded-lg">
            <h2 className="text-xl font-semibold mb-2 text-gray-900">Wallet Balance</h2>
            <p className="text-3xl font-bold text-primary-600">${balance.balance.toFixed(2)}</p>
            <button
              onClick={() => setShowTopUpModal(true)}
              className="mt-4 px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700"
            >
              Top Up Wallet
            </button>
          </div>

          {projectedCost && (
            <div className="p-6 bg-white border rounded-lg">
              <h2 className="text-xl font-semibold mb-2 text-gray-900">Projected Monthly Cost</h2>
              <p className="text-3xl font-bold text-gray-900">${projectedCost.projected.toFixed(2)}</p>
              <p className="text-sm text-gray-500 mt-2">
                Current: ${projectedCost.current.toFixed(2)}
              </p>
            </div>
          )}

          {tenant && (
            <div className="p-6 bg-white border rounded-lg">
              <h2 className="text-xl font-semibold mb-2 text-gray-900">Monthly Spending</h2>
              <p className="text-2xl font-bold text-gray-900">
                {history && history.length > 0
                  ? `$${history.slice(0, 1)[0].totalCost.toFixed(2)}`
                  : '$0.00'}
              </p>
              <p className="text-sm text-gray-500 mt-2">Current month</p>
            </div>
          )}
        </div>
      )}

      {/* Auto-Top-Up Settings */}
      {tenant && (
        <div className="p-6 bg-white border rounded-lg mb-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-900">Auto-Top-Up Settings</h2>
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
            <div className="grid grid-cols-2 gap-4">
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
            </div>
            <button 
              onClick={() => autoTopUpMutation.mutate(autoTopUp)}
              disabled={autoTopUpMutation.isPending || !orgId}
              className="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700 disabled:bg-gray-400"
            >
              {autoTopUpMutation.isPending ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </div>
      )}

      {/* Top-Up Modal */}
      {showTopUpModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full">
            <h2 className="text-2xl font-semibold mb-4 text-gray-900">Top Up Wallet</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Amount ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="10"
                  max="10000"
                  value={topUpAmount}
                  onChange={(e) => setTopUpAmount(e.target.value)}
                  className="w-full px-4 py-2 border rounded"
                  placeholder="10.00 - 10,000.00"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Minimum: $10.00, Maximum: $10,000.00
                </p>
              </div>
              <div className="flex gap-4">
                <button
                  onClick={handleTopUp}
                  disabled={!topUpAmount || parseFloat(topUpAmount) < 10 || parseFloat(topUpAmount) > 10000}
                  className="flex-1 px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700 disabled:bg-gray-400"
                >
                  Proceed to Payment
                </button>
                <button
                  onClick={() => {
                    setShowTopUpModal(false)
                    setTopUpAmount('')
                  }}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {history && history.length > 0 && (
        <div>
          <h2 className="text-2xl font-semibold mb-4 text-gray-900">Billing History</h2>
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
                {history.map((record: BillingRecord) => (
                  <tr key={record.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {new Date(record.billingDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {new Date(record.periodStart).toLocaleDateString()} - {new Date(record.periodEnd).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">{record.totalTokens.toLocaleString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap">${record.totalCost.toFixed(2)}</td>
                    <td className="px-6 py-4 whitespace-nowrap">${record.walletBalanceAfter.toFixed(2)}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs rounded ${
                          record.status === 'completed'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {record.status}
                      </span>
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
