'use client'

import { useQuery } from '@tanstack/react-query'
import { projectAPI } from '@/lib/api'
import { useState } from 'react'

export default function ProjectsPage() {
  const [orgId, setOrgId] = useState('')
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7)) // YYYY-MM

  const { data: projects } = useQuery({
    queryKey: ['projects', orgId],
    queryFn: async () => {
      if (!orgId) return []
      const response = await projectAPI.list(orgId)
      return response.data
    },
    enabled: !!orgId,
  })

  const { data: monthlyConsumption } = useQuery({
    queryKey: ['project-monthly-consumption', orgId, month],
    queryFn: async () => {
      if (!orgId || !month) return []
      const response = await projectAPI.getMonthlyConsumption(orgId, { month })
      return response.data
    },
    enabled: !!orgId && !!month,
  })

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Project Consumption</h1>

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
        </div>
      </div>

      {monthlyConsumption && monthlyConsumption.length > 0 && (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Project ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Tokens</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Cost</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Requests</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {monthlyConsumption.map((project: any) => (
                <tr key={project.id}>
                  <td className="px-6 py-4 whitespace-nowrap">{project.projectId}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{project.totalTokens.toLocaleString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap">${project.totalCost.toFixed(2)}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{project.requestCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

