'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { tenantAPI } from '@/lib/api'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

export default function EditTenantPage() {
  const router = useRouter()
  const params = useParams()
  const tenantId = params.id as string
  const queryClient = useQueryClient()

  const { data: tenant, isLoading } = useQuery({
    queryKey: ['tenant', tenantId],
    queryFn: async () => {
      const response = await tenantAPI.get(tenantId)
      return response.data
    },
  })

  const [formData, setFormData] = useState({
    name: '',
    orgId: '',
    contactEmail: '',
    billingEmail: '',
    walletBalance: 0,
    status: 'active',
  })

  useEffect(() => {
    if (tenant) {
      setFormData({
        name: tenant.name || '',
        orgId: tenant.orgId || '',
        contactEmail: tenant.contactEmail || '',
        billingEmail: tenant.billingEmail || '',
        walletBalance: tenant.walletBalance || 0,
        status: tenant.status || 'active',
      })
    }
  }, [tenant])

  const mutation = useMutation({
    mutationFn: (data: typeof formData) => tenantAPI.update(tenantId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenants'] })
      queryClient.invalidateQueries({ queryKey: ['tenant', tenantId] })
      router.push(`/dashboard/tenants/${tenantId}`)
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    mutation.mutate(formData)
  }

  if (isLoading) return <div className="p-8">Loading...</div>

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Edit Tenant</h1>

      <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tenant Name *
          </label>
          <input
            type="text"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-4 py-2 border rounded"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Organization ID
          </label>
          <input
            type="text"
            value={formData.orgId}
            disabled
            className="w-full px-4 py-2 border rounded bg-gray-100"
          />
          <p className="text-sm text-gray-500 mt-1">
            Organization ID cannot be changed
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Contact Email *
          </label>
          <input
            type="email"
            required
            value={formData.contactEmail}
            onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
            className="w-full px-4 py-2 border rounded"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Billing Email *
          </label>
          <input
            type="email"
            required
            value={formData.billingEmail}
            onChange={(e) => setFormData({ ...formData, billingEmail: e.target.value })}
            className="w-full px-4 py-2 border rounded"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Wallet Balance
          </label>
          <input
            type="number"
            step="0.01"
            value={formData.walletBalance}
            onChange={(e) => setFormData({ ...formData, walletBalance: parseFloat(e.target.value) || 0 })}
            className="w-full px-4 py-2 border rounded"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Status
          </label>
          <select
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            className="w-full px-4 py-2 border rounded"
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="suspended">Suspended</option>
          </select>
        </div>

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={mutation.isPending}
            className="px-6 py-2 bg-primary-600 text-white rounded hover:bg-primary-700 disabled:bg-gray-400"
          >
            {mutation.isPending ? 'Updating...' : 'Update Tenant'}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
          >
            Cancel
          </button>
        </div>

        {mutation.isError && (
          <div className="p-4 bg-red-50 text-red-700 rounded">
            Error: {mutation.error instanceof Error ? mutation.error.message : 'Failed to update tenant'}
          </div>
        )}
      </form>
    </div>
  )
}

