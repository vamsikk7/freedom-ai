'use client'

import { useQuery } from '@tanstack/react-query'
import { consumptionAPI, exportAPI } from '@/lib/api'
import { useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

function ConsumptionPageContent() {
  const searchParams = useSearchParams()
  const [orgId, setOrgId] = useState(searchParams.get('organizationId') || '')
  const [userId, setUserId] = useState(searchParams.get('userId') || '')
  const [assistantType, setAssistantType] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [minTokens, setMinTokens] = useState('')
  const [maxTokens, setMaxTokens] = useState('')
  const [groupBy, setGroupBy] = useState<'none' | 'date' | 'assistant' | 'user'>('none')

  const { data: consumption, isLoading, refetch } = useQuery({
    queryKey: ['consumption', orgId, userId, assistantType, startDate, endDate],
    queryFn: async () => {
      const response = await consumptionAPI.history({
        organizationId: orgId || undefined,
        userId: userId || undefined,
        assistantType: assistantType || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      })
      return response.data
    },
    enabled: false, // Manual trigger
  })

  const handleSearch = () => {
    if (orgId || userId || (startDate && endDate)) {
      refetch()
    }
  }

  const handleExportCSV = async () => {
    try {
      const response = await exportAPI.consumptionCSV({
        organizationId: orgId || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      })
      const blob = new Blob([response.data], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `consumption-${new Date().toISOString()}.csv`
      a.click()
    } catch (error) {
      console.error('Failed to export CSV', error)
    }
  }

  const handleExportJSON = async () => {
    try {
      const response = await exportAPI.consumptionJSON({
        organizationId: orgId || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      })
      const blob = new Blob([response.data], { type: 'application/json' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `consumption-${new Date().toISOString()}.json`
      a.click()
    } catch (error) {
      console.error('Failed to export JSON', error)
    }
  }

  // Filter by token range
  let filteredConsumption = consumption || []
  if (minTokens) {
    filteredConsumption = filteredConsumption.filter((r: any) => r.totalTokens >= parseInt(minTokens))
  }
  if (maxTokens) {
    filteredConsumption = filteredConsumption.filter((r: any) => r.totalTokens <= parseInt(maxTokens))
  }

  // Group data
  let groupedData: any[] = []
  if (groupBy === 'date') {
    const grouped = filteredConsumption.reduce((acc: any, record: any) => {
      const date = new Date(record.timestamp).toLocaleDateString()
      if (!acc[date]) {
        acc[date] = { date, tokens: 0, cost: 0, count: 0 }
      }
      acc[date].tokens += record.totalTokens
      acc[date].cost += record.cost
      acc[date].count += 1
      return acc
    }, {})
    groupedData = Object.values(grouped)
  } else if (groupBy === 'assistant') {
    const grouped = filteredConsumption.reduce((acc: any, record: any) => {
      const assistant = record.assistantType || 'Unknown'
      if (!acc[assistant]) {
        acc[assistant] = { assistant, tokens: 0, cost: 0, count: 0 }
      }
      acc[assistant].tokens += record.totalTokens
      acc[assistant].cost += record.cost
      acc[assistant].count += 1
      return acc
    }, {})
    groupedData = Object.values(grouped)
  } else if (groupBy === 'user') {
    const grouped = filteredConsumption.reduce((acc: any, record: any) => {
      const user = record.userId
      if (!acc[user]) {
        acc[user] = { user, tokens: 0, cost: 0, count: 0 }
      }
      acc[user].tokens += record.totalTokens
      acc[user].cost += record.cost
      acc[user].count += 1
      return acc
    }, {})
    groupedData = Object.values(grouped)
  } else {
    groupedData = filteredConsumption
  }

  return (
    <div className="p-8 bg-gray-50">
      <h1 className="text-3xl font-bold mb-6 text-gray-900">Consumption Tracking</h1>

      <div className="mb-6 space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <input
            type="text"
            placeholder="Organization ID"
            value={orgId}
            onChange={(e) => setOrgId(e.target.value)}
            className="px-4 py-2 border rounded"
          />
          <input
            type="text"
            placeholder="User ID"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            className="px-4 py-2 border rounded"
          />
          <input
            type="text"
            placeholder="Assistant Type"
            value={assistantType}
            onChange={(e) => setAssistantType(e.target.value)}
            className="px-4 py-2 border rounded"
          />
          <select
            value={groupBy}
            onChange={(e) => setGroupBy(e.target.value as typeof groupBy)}
            className="px-4 py-2 border rounded"
          >
            <option value="none">No Grouping</option>
            <option value="date">Group by Date</option>
            <option value="assistant">Group by Assistant</option>
            <option value="user">Group by User</option>
          </select>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
          <input
            type="number"
            placeholder="Min Tokens"
            value={minTokens}
            onChange={(e) => setMinTokens(e.target.value)}
            className="px-4 py-2 border rounded"
          />
          <input
            type="number"
            placeholder="Max Tokens"
            value={maxTokens}
            onChange={(e) => setMaxTokens(e.target.value)}
            className="px-4 py-2 border rounded"
          />
        </div>
        <div className="flex gap-4">
          <button
            onClick={handleSearch}
            className="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700"
          >
            Search
          </button>
          <button
            onClick={handleExportCSV}
            disabled={!consumption || consumption.length === 0}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400"
          >
            Export CSV
          </button>
          <button
            onClick={handleExportJSON}
            disabled={!consumption || consumption.length === 0}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
          >
            Export JSON
          </button>
        </div>
      </div>

      {isLoading && <div>Loading...</div>}

      {groupedData && groupedData.length > 0 && (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200">
            <thead>
              <tr className="bg-gray-50">
                {groupBy === 'date' && (
                  <>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Requests</th>
                  </>
                )}
                {groupBy === 'assistant' && (
                  <>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Assistant</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Requests</th>
                  </>
                )}
                {groupBy === 'user' && (
                  <>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Requests</th>
                  </>
                )}
                {groupBy === 'none' && (
                  <>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Assistant</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Request ID</th>
                  </>
                )}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tokens</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cost</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {groupedData.map((record: any, index: number) => (
                <tr key={index}>
                  {groupBy === 'date' && (
                    <>
                      <td className="px-6 py-4 whitespace-nowrap">{record.date}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{record.count}</td>
                    </>
                  )}
                  {groupBy === 'assistant' && (
                    <>
                      <td className="px-6 py-4 whitespace-nowrap">{record.assistant}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{record.count}</td>
                    </>
                  )}
                  {groupBy === 'user' && (
                    <>
                      <td className="px-6 py-4 whitespace-nowrap">{record.user}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{record.count}</td>
                    </>
                  )}
                  {groupBy === 'none' && (
                    <>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {new Date(record.timestamp).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">{record.userId}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{record.assistantType || 'N/A'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-xs">{record.requestId}</td>
                    </>
                  )}
                  <td className="px-6 py-4 whitespace-nowrap">
                    {record.totalTokens ? record.totalTokens.toLocaleString() : record.tokens.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    ${(record.cost || record.totalCost || 0).toFixed(4)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {consumption && consumption.length === 0 && !isLoading && (
        <div className="p-8 text-center text-gray-500">No consumption data found</div>
      )}
    </div>
  )
}

export default function ConsumptionPage() {
  return (
    <Suspense fallback={<div className="p-8">Loading...</div>}>
      <ConsumptionPageContent />
    </Suspense>
  )
}
