'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { userAPI, User } from '@/lib/api'
import { useMutation, useQueryClient } from '@tanstack/react-query'

type NewUserFormData = {
  name: string
  email: string
  role: User['role']
  organizationId: string
  status: string
}

function NewUserPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const organizationId = searchParams.get('organizationId') || ''
  const queryClient = useQueryClient()
  
  const [formData, setFormData] = useState<NewUserFormData>({
    name: '',
    email: '',
    role: 'tenant_user',
    organizationId: organizationId,
    status: 'active',
  })

  const mutation = useMutation({
    mutationFn: (data: NewUserFormData) => userAPI.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      router.push(`/dashboard/users?organizationId=${organizationId}`)
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    mutation.mutate(formData)
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Add New User</h1>

      <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Name *
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
            Email *
          </label>
          <input
            type="email"
            required
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="w-full px-4 py-2 border rounded"
          />
          <p className="text-sm text-gray-500 mt-1">
            An invitation email will be sent to this address
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Role *
          </label>
          <select
            value={formData.role}
            onChange={(e) => setFormData({ ...formData, role: e.target.value as User['role'] })}
            className="w-full px-4 py-2 border rounded"
          >
            <option value="tenant_user">User</option>
            <option value="tenant_admin">Admin</option>
          </select>
        </div>

        {organizationId && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Organization ID
            </label>
            <input
              type="text"
              value={organizationId}
              disabled
              className="w-full px-4 py-2 border rounded bg-gray-100"
            />
          </div>
        )}

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
          </select>
        </div>

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={mutation.isPending}
            className="px-6 py-2 bg-primary-600 text-white rounded hover:bg-primary-700 disabled:bg-gray-400"
          >
            {mutation.isPending ? 'Creating...' : 'Create User'}
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
            Error: {mutation.error instanceof Error ? mutation.error.message : 'Failed to create user'}
          </div>
        )}
      </form>
    </div>
  )
}

export default function NewUserPage() {
  return (
    <Suspense fallback={<div className="p-8">Loading...</div>}>
      <NewUserPageContent />
    </Suspense>
  )
}

