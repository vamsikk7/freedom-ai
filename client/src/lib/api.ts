import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Important for SuperTokens cookies
})

// Add request interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Redirect to login if unauthorized
      if (typeof window !== 'undefined' && !window.location.pathname.includes('/auth')) {
        window.location.href = '/auth/signin'
      }
    }
    return Promise.reject(error)
  }
)

export interface Organization {
  id: string
  orgId: string
  name: string
  contactEmail: string
  billingEmail: string
  walletBalance: number
  creditLimit: number
  status: string
  createdAt: string
  updatedAt: string
  userCount?: number
  autoTopUp?: {
    enabled: boolean
    threshold: number
    amount: number
  }
  consumptionLimits?: {
    monthlyLimit: number
    dailyLimit: number
    perUserLimit: number
  }
}

export interface TokenConsumption {
  id: string
  requestId: string
  timestamp: string
  userId: string
  organizationId: string
  assistantType: string
  documentId: string
  conversationId: string
  projectId: string
  model: string
  totalTokens: number
  cost: number
  status: string
}

export interface User {
  id: string
  userId: string
  name: string
  email: string
  role: 'developer' | 'tenant_admin' | 'tenant_user'
  organizationId?: string
  status: string
  createdAt: string
  lastActive?: string
}

export interface CurrentUser {
  id: string
  email: string
  role?: 'developer' | 'tenant_admin' | 'tenant_user'
  organizationId?: string
}

// Auth API - OTP based
export const authAPI = {
  sendOTP: (email: string) =>
    api.post<{ status: string; deviceId: string; preAuthSessionId: string }>('/api/v1/auth/send-otp', { email }),
  verifyOTP: (data: { deviceId: string; preAuthSessionId: string; userInputCode: string }) =>
    api.post<{ status: string; user: { id: string; email: string; createdNewUser: boolean } }>('/api/v1/auth/verify-otp', data),
  resendOTP: (email: string) =>
    api.post<{ status: string; deviceId: string; preAuthSessionId: string }>('/api/v1/auth/resend-otp', { email }),
  signOut: () => api.post('/api/v1/auth/signout'),
  getCurrentUser: () => api.get<{ user: CurrentUser }>('/api/v1/auth/user'),
}

// Tenant API
export const tenantAPI = {
  list: () => api.get<Organization[]>('/api/v1/admin/tenants'),
  get: (id: string) => api.get<Organization>(`/api/v1/admin/tenants/${id}`),
  getDetails: (id: string) => api.get(`/api/v1/admin/tenants/${id}/details`),
  create: (data: Partial<Organization>) => api.post('/api/v1/admin/tenants', data),
  update: (id: string, data: Partial<Organization>) =>
    api.put(`/api/v1/admin/tenants/${id}`, data),
  delete: (id: string) => api.delete(`/api/v1/admin/tenants/${id}`),
}

// User API
export const userAPI = {
  list: (params?: { organizationId?: string }) =>
    api.get<User[]>('/api/v1/organization/users', { params }),
  get: (id: string) => api.get<User>(`/api/v1/organization/users/${id}`),
  create: (data: Partial<User>) => api.post('/api/v1/organization/users', data),
  update: (id: string, data: Partial<User>) =>
    api.put(`/api/v1/organization/users/${id}`, data),
  delete: (id: string) => api.delete(`/api/v1/organization/users/${id}`),
  getConsumption: (id: string, params?: { startDate?: string; endDate?: string }) =>
    api.get(`/api/v1/organization/users/${id}/consumption`, { params }),
}

// Consumption API
export const consumptionAPI = {
  history: (params?: {
    organizationId?: string
    userId?: string
    assistantType?: string
    startDate?: string
    endDate?: string
    minTokens?: string
    maxTokens?: string
  }) => api.get<TokenConsumption[]>('/api/v1/consumption/history', { params }),
  byAssistant: (params?: {
    organizationId?: string
    userId?: string
    startDate?: string
    endDate?: string
  }) => api.get('/api/v1/consumption/by-assistant', { params }),
  byUser: (params?: {
    organizationId?: string
    startDate?: string
    endDate?: string
  }) => api.get('/api/v1/consumption/by-user', { params }),
  realTime: (params?: { organizationId?: string; userId?: string }) =>
    api.get<{ totalTokensToday: number }>('/api/v1/consumption/real-time', { params }),
}

// Billing API
export const billingAPI = {
  walletBalance: (organizationId: string) =>
    api.get<{ balance: number }>(`/api/v1/billing/wallet?organizationId=${organizationId}`),
  history: (organizationId: string, params?: { startDate?: string; endDate?: string }) =>
    api.get(`/api/v1/billing/history?organizationId=${organizationId}`, { params }),
  createTopUp: (data: { organizationId: string; amount: number }) =>
    api.post('/api/v1/billing/top-up', data),
  createCheckoutSession: (data: { organizationId: string; amount: number }) =>
    api.post('/api/v1/billing/stripe/checkout', data),
}

// Analytics API
export const analyticsAPI = {
  overview: () => api.get('/api/v1/analytics/overview'),
  consumptionTrends: (params: { startDate: string; endDate: string; organizationId?: string }) =>
    api.get('/api/v1/analytics/consumption-trends', { params }),
  topTenants: (params?: { startDate?: string; endDate?: string }) =>
    api.get('/api/v1/analytics/top-tenants', { params }),
  revenueTrends: (params: { startDate: string; endDate: string }) =>
    api.get('/api/v1/analytics/revenue-trends', { params }),
  peakUsageTimes: (params?: { organizationId?: string; startDate?: string; endDate?: string }) =>
    api.get('/api/v1/analytics/usage-patterns/peak-times', { params }),
  usageByDayOfWeek: (params?: { organizationId?: string; startDate?: string; endDate?: string }) =>
    api.get('/api/v1/analytics/usage-patterns/day-of-week', { params }),
  topUpFrequency: (params?: { organizationId?: string; startDate?: string; endDate?: string }) =>
    api.get('/api/v1/analytics/revenue/top-up-frequency', { params }),
  billingDeductions: (params?: { organizationId?: string; startDate?: string; endDate?: string }) =>
    api.get('/api/v1/analytics/revenue/billing-deductions', { params }),
}

// Project API
export const projectAPI = {
  list: (organizationId: string) =>
    api.get(`/api/v1/organization/projects?organizationId=${organizationId}`),
  getConsumption: (id: string, params?: { startDate?: string; endDate?: string }) =>
    api.get(`/api/v1/organization/projects/${id}/consumption`, { params }),
  getMonthlyConsumption: (organizationId: string, params?: { month?: string }) =>
    api.get(`/api/v1/organization/projects/consumption/monthly?organizationId=${organizationId}`, {
      params,
    }),
}

// Reports API
export const reportsAPI = {
  monthly: (params: { organizationId: string; month: string }) =>
    api.get('/api/v1/reports/monthly', { params }),
}

// Export API
export const exportAPI = {
  consumptionCSV: (params: {
    organizationId?: string
    userId?: string
    startDate?: string
    endDate?: string
  }) => api.get('/api/v1/export/consumption/csv', { params, responseType: 'blob' }),
  consumptionJSON: (params: {
    organizationId?: string
    userId?: string
    startDate?: string
    endDate?: string
  }) => api.get('/api/v1/export/consumption/json', { params, responseType: 'blob' }),
  monthlyReportPDF: (params: { organizationId: string; month: string }) =>
    api.get('/api/v1/export/reports/monthly/pdf', { params, responseType: 'blob' }),
}

// Organization API
export const organizationAPI = {
  updateConsumptionLimits: (id: string, limits: {
    monthlyLimit?: number
    dailyLimit?: number
    perUserLimit?: number
  }) => api.put(`/api/v1/organization/${id}/consumption-limits`, limits),
  updateAutoTopUp: (id: string, autoTopUp: {
    enabled: boolean
    threshold: number
    amount: number
  }) => api.put(`/api/v1/organization/${id}/auto-top-up`, autoTopUp),
}
