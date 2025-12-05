'use client'

import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { reportsAPI, exportAPI } from '@/lib/api'

export default function ReportsPage() {
  const [orgId, setOrgId] = useState('')
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7)) // YYYY-MM

  const { data: monthlyReport } = useQuery({
    queryKey: ['monthly-report', orgId, month],
    queryFn: async () => {
      if (!orgId || !month) return null
      const response = await reportsAPI.monthly({ organizationId: orgId, month })
      return response.data
    },
    enabled: !!orgId && !!month,
  })

  const handleExportPDF = async () => {
    if (!orgId || !month) return
    try {
      const response = await exportAPI.monthlyReportPDF({ organizationId: orgId, month })
      const blob = new Blob([response.data], { type: 'application/pdf' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `monthly-report-${month}.pdf`
      a.click()
    } catch (error) {
      console.error('Failed to export PDF', error)
    }
  }

  return (
    <div className="p-8 bg-gray-50">
      <h1 className="text-3xl font-bold mb-6 text-gray-900">Monthly Reports</h1>

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
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="px-4 py-2 border rounded"
          />
          <button
            onClick={handleExportPDF}
            disabled={!orgId || !month}
            className="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700 disabled:bg-gray-400"
          >
            Export PDF
          </button>
        </div>
      </div>

      {monthlyReport && (
        <div className="space-y-6">
          <div className="p-6 bg-white border rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Summary</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-gray-500">Total Tokens</p>
                <p className="text-2xl font-bold">
                  {(monthlyReport.current?.totalTokens || 0).toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Cost</p>
                <p className="text-2xl font-bold">
                  ${(monthlyReport.current?.totalCost || 0).toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Previous Month Tokens</p>
                <p className="text-2xl font-bold">
                  {(monthlyReport.previous?.totalTokens || 0).toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Change</p>
                <p
                  className={`text-2xl font-bold ${
                    (monthlyReport.comparison?.tokenChangePercent || 0) >= 0
                      ? 'text-green-600'
                      : 'text-red-600'
                  }`}
                >
                  {monthlyReport.comparison?.tokenChangePercent
                    ? `${monthlyReport.comparison.tokenChangePercent.toFixed(1)}%`
                    : '0%'}
                </p>
              </div>
            </div>
          </div>

          {monthlyReport.breakdown && (
            <div className="p-6 bg-white border rounded-lg">
              <h2 className="text-xl font-semibold mb-4">Breakdown by Assistant</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="px-4 py-2 text-left">Assistant</th>
                      <th className="px-4 py-2 text-left">Tokens</th>
                      <th className="px-4 py-2 text-left">Cost</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(monthlyReport.breakdown.byAssistant || {}).map(([assistant, data]: [string, any]) => (
                      <tr key={assistant} className="border-b">
                        <td className="px-4 py-2">{assistant}</td>
                        <td className="px-4 py-2">{data.tokens.toLocaleString()}</td>
                        <td className="px-4 py-2">${data.cost.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

