'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { userAPI, User } from '@/lib/api'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

type UserFormData = Pick<User, 'name' | 'email' | 'role' | 'status'>

export default function EditUserPage() {
  const router = useRouter()
  const params = useParams()
  const userId = params.id as string
  const queryClient = useQueryClient()

  const { data: user, isLoading } = useQuery({
    queryKey: ['user', userId],
    queryFn: async () => {
      const response = await userAPI.get(userId)
      return response.data
    },
  })

  const [formData, setFormData] = useState<UserFormData>({
    name: '',
    email: '',
    role: 'tenant_user',
    status: 'active',
  })

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        role: user.role || 'tenant_user',
        status: user.status || 'active',
      })
    }
  }, [user])

  const mutation = useMutation({
    mutationFn: (data: UserFormData) => userAPI.update(userId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      queryClient.invalidateQueries({ queryKey: ['user', userId] })
      router.push(`/dashboard/users/${userId}`)
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    mutation.mutate(formData)
  }

  if (isLoading) return <div className="p-8">Loading...</div>

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Edit User</h1>

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
            {mutation.isPending ? 'Updating...' : 'Update User'}
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
            Error: {mutation.error instanceof Error ? mutation.error.message : 'Failed to update user'}
          </div>
        )}
      </form>
    </div>
  )
}

