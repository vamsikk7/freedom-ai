'use client'

import { useQuery } from '@tanstack/react-query'
import { userAPI, consumptionAPI } from '@/lib/api'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { useState } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8']

export default function UserDetailsPage() {
  const params = useParams()
  const userId = params.id as string
  const [timePeriod, setTimePeriod] = useState<'week' | 'month' | 'all'>('month')

  const { data: user, isLoading } = useQuery({
    queryKey: ['user', userId],
    queryFn: async () => {
      const response = await userAPI.get(userId)
      return response.data
    },
  })

  const { data: consumption } = useQuery({
    queryKey: ['user-consumption', userId, timePeriod],
    queryFn: async () => {
      const now = new Date()
      let startDate = ''
      if (timePeriod === 'week') {
        startDate = new Date(now.setDate(now.getDate() - 7)).toISOString()
      } else if (timePeriod === 'month') {
        startDate = new Date(now.setMonth(now.getMonth() - 1)).toISOString()
      }
      const response = await consumptionAPI.history({
        userId: userId,
        startDate: startDate || undefined,
      })
      return response.data
    },
  })

  const { data: consumptionByAssistant } = useQuery({
    queryKey: ['user-consumption-by-assistant', userId, timePeriod],
    queryFn: async () => {
      const now = new Date()
      let startDate = ''
      if (timePeriod === 'week') {
        startDate = new Date(now.setDate(now.getDate() - 7)).toISOString()
      } else if (timePeriod === 'month') {
        startDate = new Date(now.setMonth(now.getMonth() - 1)).toISOString()
      }
      const response = await consumptionAPI.byAssistant({
        userId: userId,
        startDate: startDate || undefined,
      })
      return response.data
    },
  })

  if (isLoading) return <div className="p-8">Loading...</div>
  if (!user) return <div className="p-8">User not found</div>

  // Prepare chart data
  const dailyData = consumption?.reduce((acc: any, record: any) => {
    const date = new Date(record.timestamp).toLocaleDateString()
    if (!acc[date]) {
      acc[date] = { date, tokens: 0, cost: 0 }
    }
    acc[date].tokens += record.totalTokens
    acc[date].cost += record.cost
    return acc
  }, {}) || {}

  const chartData = Object.values(dailyData).sort((a: any, b: any) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  )

  const pieData = consumptionByAssistant?.map((item: any) => ({
    name: item._id || 'Unknown',
    value: item.tokens || 0,
  })) || []

  return (
    <div className="p-8">
      <div className="mb-6">
        <Link href="/dashboard/users" className="text-primary-600 hover:text-primary-800">
          ← Back to Users
        </Link>
      </div>

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">{user.name || user.email}</h1>
        <Link
          href={`/dashboard/users/${userId}/edit`}
          className="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700"
        >
          Edit User
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="p-6 bg-white border rounded-lg">
          <h2 className="text-xl font-semibold mb-4">User Information</h2>
          <dl className="space-y-2">
            <div>
              <dt className="text-sm text-gray-500">Email</dt>
              <dd className="text-lg">{user.email}</dd>
            </div>
            <div>
              <dt className="text-sm text-gray-500">Role</dt>
              <dd>
                <span className="px-2 py-1 text-xs rounded bg-blue-100 text-blue-800">
                  {user.role}
                </span>
              </dd>
            </div>
            <div>
              <dt className="text-sm text-gray-500">Status</dt>
              <dd>
                <span
                  className={`px-2 py-1 text-xs rounded ${
                    user.status === 'active'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {user.status}
                </span>
              </dd>
            </div>
            <div>
              <dt className="text-sm text-gray-500">Created Date</dt>
              <dd className="text-lg">
                {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-gray-500">Last Active</dt>
              <dd className="text-lg">
                {user.lastActive ? new Date(user.lastActive).toLocaleDateString() : 'Never'}
              </dd>
            </div>
          </dl>
        </div>

        <div className="p-6 bg-white border rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Consumption Summary</h2>
          <dl className="space-y-2">
            <div>
              <dt className="text-sm text-gray-500">Total Tokens ({timePeriod})</dt>
              <dd className="text-lg">
                {consumption?.reduce((sum: number, r: any) => sum + r.totalTokens, 0).toLocaleString() || 0}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-gray-500">Total Cost ({timePeriod})</dt>
              <dd className="text-lg">
                ${consumption?.reduce((sum: number, r: any) => sum + r.cost, 0).toFixed(2) || '0.00'}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-gray-500">Request Count</dt>
              <dd className="text-lg">{consumption?.length || 0}</dd>
            </div>
          </dl>
        </div>
      </div>

      <div className="mb-6">
        <select
          value={timePeriod}
          onChange={(e) => setTimePeriod(e.target.value as typeof timePeriod)}
          className="px-4 py-2 border rounded"
        >
          <option value="week">Last 7 Days</option>
          <option value="month">Last 30 Days</option>
          <option value="all">All Time</option>
        </select>
      </div>

      {chartData.length > 0 && (
        <div className="p-6 bg-white border rounded-lg mb-6">
          <h2 className="text-xl font-semibold mb-4">Consumption Over Time</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="tokens" stroke="#8884d8" name="Tokens" />
              <Line type="monotone" dataKey="cost" stroke="#82ca9d" name="Cost ($)" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {pieData.length > 0 && (
        <div className="p-6 bg-white border rounded-lg mb-6">
          <h2 className="text-xl font-semibold mb-4">Consumption by Assistant</h2>
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

      {consumption && consumption.length > 0 && (
        <div className="p-6 bg-white border rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Recent Consumption History</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b">
                  <th className="px-4 py-2 text-left">Date</th>
                  <th className="px-4 py-2 text-left">Assistant</th>
                  <th className="px-4 py-2 text-left">Tokens</th>
                  <th className="px-4 py-2 text-left">Cost</th>
                </tr>
              </thead>
              <tbody>
                {consumption.slice(0, 20).map((record: any) => (
                  <tr key={record.id} className="border-b">
                    <td className="px-4 py-2">
                      {new Date(record.timestamp).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-2">{record.assistantType || 'N/A'}</td>
                    <td className="px-4 py-2">{record.totalTokens.toLocaleString()}</td>
                    <td className="px-4 py-2">${record.cost.toFixed(4)}</td>
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

