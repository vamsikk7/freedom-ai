'use client'

import { useQuery } from '@tanstack/react-query'
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { analyticsAPI } from '@/lib/api'
import { useState } from 'react'

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#FF6B6B', '#4ECDC4']

export default function AnalyticsPage() {
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [orgId, setOrgId] = useState('')
  const [activeTab, setActiveTab] = useState<'overview' | 'consumption' | 'revenue' | 'patterns'>('overview')

  const { data: overview } = useQuery({
    queryKey: ['analytics-overview'],
    queryFn: async () => {
      const response = await analyticsAPI.overview()
      return response.data
    },
  })

  const { data: trends } = useQuery({
    queryKey: ['consumption-trends', startDate, endDate, orgId],
    queryFn: async () => {
      if (!startDate || !endDate) return null
      const response = await analyticsAPI.consumptionTrends({ startDate, endDate, organizationId: orgId || undefined })
      return response.data
    },
    enabled: !!startDate && !!endDate,
  })

  const { data: topTenants } = useQuery({
    queryKey: ['top-tenants', startDate, endDate],
    queryFn: async () => {
      const response = await analyticsAPI.topTenants({ startDate: startDate || undefined, endDate: endDate || undefined })
      return response.data
    },
  })

  const { data: revenueTrends } = useQuery({
    queryKey: ['revenue-trends', startDate, endDate],
    queryFn: async () => {
      if (!startDate || !endDate) return null
      const response = await analyticsAPI.revenueTrends({ startDate, endDate })
      return response.data
    },
    enabled: !!startDate && !!endDate,
  })

  const { data: peakTimes } = useQuery({
    queryKey: ['peak-usage-times', orgId, startDate, endDate],
    queryFn: async () => {
      const response = await analyticsAPI.peakUsageTimes({ organizationId: orgId || undefined, startDate: startDate || undefined, endDate: endDate || undefined })
      return response.data
    },
    enabled: activeTab === 'patterns',
  })

  const { data: dayOfWeek } = useQuery({
    queryKey: ['usage-day-of-week', orgId, startDate, endDate],
    queryFn: async () => {
      const response = await analyticsAPI.usageByDayOfWeek({ organizationId: orgId || undefined, startDate: startDate || undefined, endDate: endDate || undefined })
      return response.data
    },
    enabled: activeTab === 'patterns',
  })

  const { data: topUpFrequency } = useQuery({
    queryKey: ['top-up-frequency', orgId, startDate, endDate],
    queryFn: async () => {
      const response = await analyticsAPI.topUpFrequency({ organizationId: orgId || undefined, startDate: startDate || undefined, endDate: endDate || undefined })
      return response.data
    },
    enabled: activeTab === 'revenue',
  })

  const { data: billingDeductions } = useQuery({
    queryKey: ['billing-deductions', orgId, startDate, endDate],
    queryFn: async () => {
      const response = await analyticsAPI.billingDeductions({ organizationId: orgId || undefined, startDate: startDate || undefined, endDate: endDate || undefined })
      return response.data
    },
    enabled: activeTab === 'revenue',
  })

  return (
    <div className="p-8 bg-gray-50">
      <h1 className="text-3xl font-bold mb-6 text-gray-900">Analytics Dashboard</h1>

      {/* Tabs */}
      <div className="border-b mb-6">
        <nav className="flex space-x-8">
          {(['overview', 'consumption', 'revenue', 'patterns'] as const).map((tab) => (
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

      {/* Filters */}
      <div className="mb-6 flex gap-4">
        <input
          type="text"
          placeholder="Organization ID (optional)"
          value={orgId}
          onChange={(e) => setOrgId(e.target.value)}
          className="px-4 py-2 border rounded"
        />
        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="px-4 py-2 border rounded"
        />
        <input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          className="px-4 py-2 border rounded"
        />
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && overview && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-4 bg-white border rounded-lg">
              <h3 className="text-sm text-gray-500">Total Tenants</h3>
              <p className="text-2xl font-bold text-gray-900">{overview.tenants?.total || 0}</p>
              <p className="text-sm text-green-600">{overview.tenants?.active || 0} active</p>
            </div>
            <div className="p-4 bg-white border rounded-lg">
              <h3 className="text-sm text-gray-500">Total Users</h3>
              <p className="text-2xl font-bold text-gray-900">{overview.users?.total || 0}</p>
              <p className="text-sm text-green-600">{overview.users?.active || 0} active</p>
            </div>
            <div className="p-4 bg-white border rounded-lg">
              <h3 className="text-sm text-gray-500">This Month Tokens</h3>
              <p className="text-2xl font-bold text-gray-900">{(overview.consumption?.thisMonth?.tokens || 0).toLocaleString()}</p>
              <p className="text-sm text-gray-600">${(overview.consumption?.thisMonth?.cost || 0).toFixed(2)}</p>
            </div>
            <div className="p-4 bg-white border rounded-lg">
              <h3 className="text-sm text-gray-500">Today Tokens</h3>
              <p className="text-2xl font-bold text-gray-900">{(overview.consumption?.today?.tokens || 0).toLocaleString()}</p>
              <p className="text-sm text-gray-600">${(overview.consumption?.today?.cost || 0).toFixed(2)}</p>
            </div>
          </div>

          {topTenants && topTenants.length > 0 && (
            <div className="p-6 bg-white border rounded-lg">
              <h2 className="text-xl font-semibold mb-4 text-gray-900">Top 10 Tenants by Consumption</h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={topTenants.map((t: any) => ({ org: t._id, tokens: t.totalTokens, cost: t.totalCost }))}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="org" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="tokens" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}

      {/* Consumption Tab */}
      {activeTab === 'consumption' && trends && trends.length > 0 && (
        <div className="p-6 bg-white border rounded-lg">
          <h2 className="text-xl font-semibold mb-4 text-gray-900">Consumption Trends</h2>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={trends.map((t: any) => ({ date: t._id, tokens: t.tokens, cost: t.cost }))}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip />
              <Legend />
              <Line yAxisId="left" type="monotone" dataKey="tokens" stroke="#8884d8" name="Tokens" />
              <Line yAxisId="right" type="monotone" dataKey="cost" stroke="#82ca9d" name="Cost ($)" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Revenue Tab */}
      {activeTab === 'revenue' && (
        <div className="space-y-6">
          {revenueTrends && revenueTrends.length > 0 && (
            <div className="p-6 bg-white border rounded-lg">
              <h2 className="text-xl font-semibold mb-4 text-gray-900">Revenue Trends</h2>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={revenueTrends.map((t: any) => ({ date: t._id, revenue: t.revenue }))}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="revenue" stroke="#82ca9d" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {topUpFrequency && topUpFrequency.length > 0 && (
            <div className="p-6 bg-white border rounded-lg">
              <h2 className="text-xl font-semibold mb-4 text-gray-900">Top-Up Frequency</h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={topUpFrequency.map((t: any) => ({ date: t._id, count: t.count, amount: t.totalAmount }))}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="count" fill="#8884d8" name="Count" />
                  <Bar dataKey="amount" fill="#82ca9d" name="Amount ($)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {billingDeductions && billingDeductions.length > 0 && (
            <div className="p-6 bg-white border rounded-lg">
              <h2 className="text-xl font-semibold mb-4 text-gray-900">Billing Deductions by Day</h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={billingDeductions.map((t: any) => ({ date: t._id, deductions: t.totalDeductions }))}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="deductions" fill="#FF8042" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}

      {/* Patterns Tab */}
      {activeTab === 'patterns' && (
        <div className="space-y-6">
          {peakTimes && peakTimes.length > 0 && (
            <div className="p-6 bg-white border rounded-lg">
              <h2 className="text-xl font-semibold mb-4 text-gray-900">Peak Usage Times (Hour of Day)</h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={peakTimes.map((t: any) => ({ hour: t._id, tokens: t.tokens, cost: t.cost }))}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="hour" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="tokens" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {dayOfWeek && dayOfWeek.length > 0 && (
            <div className="p-6 bg-white border rounded-lg">
              <h2 className="text-xl font-semibold mb-4 text-gray-900">Usage by Day of Week</h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={dayOfWeek.map((t: any) => ({ day: t._id, tokens: t.tokens, cost: t.cost }))}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="tokens" fill="#00C49F" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
