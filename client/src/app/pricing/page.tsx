'use client'

import Link from 'next/link'
import { useState, useMemo } from 'react'
import { FeatureIcon } from '@/components/FeatureIcons'

// Average tokens per character (rough estimate: ~4 characters per token)
const CHARS_PER_TOKEN = 4
const CHARS_PER_MESSAGE = 1000 // Each message has 1000 characters

// Internal pricing (not shown to users) - average across models
const INTERNAL_PROMPT_PRICE = 0.015 // Average of GPT-4 models
const INTERNAL_COMPLETION_PRICE = 0.03 // Average of GPT-4 models

// Uniform price per message (calculated from internal pricing)
const PRICE_PER_MESSAGE = (() => {
  const charsPerMessage = CHARS_PER_MESSAGE
  const tokensPerMessage = charsPerMessage / CHARS_PER_TOKEN
  const promptTokens = tokensPerMessage * 0.7
  const completionTokens = tokensPerMessage * 0.3
  return (promptTokens / 1000) * INTERNAL_PROMPT_PRICE + (completionTokens / 1000) * INTERNAL_COMPLETION_PRICE
})()

// Marketplace competitors pricing (per user per month)
const COMPETITORS = {
  'ChatGPT Plus': 20, // $20/user/month
  'Microsoft Copilot Pro': 21, // $21/user/month
  'Claude Pro': 20, // $20/user/month
  'Gemini Advanced': 17.5, // $17.5/user/month (Google)
}

export default function PricingPage() {
  const [messages, setMessages] = useState(100000)
  const [employees, setEmployees] = useState(300)

  // Calculate monthly cost for Freedom AI (capped at 100,000 messages)
  const freedomAICost = useMemo(() => {
    const cappedMessages = Math.min(messages, 300000)
    return cappedMessages * PRICE_PER_MESSAGE
  }, [messages])

  // Calculate competitor costs (per employee per month)
  const competitorCosts = useMemo(() => {
    const competitorMonthlyCosts: Record<string, number> = {}
    Object.entries(COMPETITORS).forEach(([name, pricePerUser]) => {
      competitorMonthlyCosts[name] = employees * pricePerUser
    })
    return competitorMonthlyCosts
  }, [employees])

  // Calculate savings vs competitors
  const savings = useMemo(() => {
    const savingsData: Record<string, { amount: number; percentage: number }> = {}
    Object.entries(competitorCosts).forEach(([name, cost]) => {
      const amount = cost - freedomAICost
      const percentage = (amount / cost) * 100
      savingsData[name] = { amount, percentage }
    })
    return savingsData
  }, [competitorCosts, freedomAICost])

  // Calculate cost per employee
  const costPerEmployee = useMemo(() => {
    return freedomAICost / employees
  }, [freedomAICost, employees])

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <Link href="/" className="text-2xl font-bold text-blue-600">
              Freedom AI
            </Link>
            <nav className="flex items-center gap-4 md:gap-6">
              <Link href="/features" className="text-gray-600 hover:text-gray-900">Features</Link>
              <Link href="/assistants" className="text-gray-600 hover:text-gray-900">Assistants</Link>
              <Link href="/pricing" className="text-blue-600 font-semibold">Pricing</Link>
              <Link href="/contact" className="text-gray-600 hover:text-gray-900">Contact</Link>
              <div className="flex gap-3">
                <Link
                  href="/auth/signin"
                  className="px-4 py-2 text-blue-600 hover:text-blue-700 font-medium"
                >
                  Log In
                </Link>
                <Link
                  href="/auth/signup"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition"
                >
                  Sign Up
                </Link>
              </div>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-gradient-to-br from-blue-600 to-purple-700 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl font-bold mb-6">Simple, Transparent Pricing</h1>
          <p className="text-3xl mb-4 font-semibold">No More Billing by Seat</p>
          <p className="text-xl text-blue-100 max-w-3xl mx-auto">
            We bill by consumption. Pay only for what you use. No per-seat fees, no hidden costs.
          </p>
        </div>
      </section>

      {/* Simple Pricing */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-6 text-gray-900">Simple, Per-Message Pricing</h2>
          <p className="text-xl text-gray-600 mb-8">
            One transparent price per message. No model selection, no complexity.
          </p>
          <div className="bg-white p-8 rounded-lg border-2 border-blue-200 shadow-lg">
            <div className="text-5xl font-bold text-blue-600 mb-2">
              ${PRICE_PER_MESSAGE.toFixed(6)}
            </div>
            <p className="text-lg text-gray-600">per message</p>
            <p className="text-sm text-gray-500 mt-4">
              Each message = {CHARS_PER_MESSAGE.toLocaleString()} characters (assumed)
            </p>
          </div>
        </div>
      </section>

      {/* Cost Calculator with Employee Count */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-center mb-12 text-gray-900">Cost Calculator</h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left: Inputs */}
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 p-8 rounded-lg border-2 border-blue-200">
              <div className="mb-8">
                <label className="block text-lg font-semibold mb-4 text-gray-900">
                  Number of Employees
                </label>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min="100"
                    max="1000"
                    value={employees}
                    onChange={(e) => setEmployees(Number(e.target.value))}
                    className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
                  <input
                    type="number"
                    min="100"
                    max="1000"
                    value={employees}
                    onChange={(e) => setEmployees(Math.max(100, Math.min(1000, Number(e.target.value))))}
                    className="w-24 px-4 py-2 border border-gray-300 rounded-lg text-center font-semibold text-gray-900 bg-white"
                  />
                </div>
              </div>

              <div className="mb-8">
                <label className="block text-lg font-semibold mb-4 text-gray-900">
                  Messages per Month
                </label>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min="100"
                    max="300000"
                    step="100"
                    value={Math.min(messages, 300000)}
                    onChange={(e) => setMessages(Number(e.target.value))}
                    className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
                  <input
                    type="number"
                    min="100"
                    max="300000"
                    step="100"
                    value={messages}
                    onChange={(e) => {
                      const value = Number(e.target.value)
                      if (value > 300000) {
                        setMessages(300000)
                      } else {
                        setMessages(Math.max(100, value))
                      }
                    }}
                    className="w-32 px-4 py-2 border border-gray-300 rounded-lg text-center font-semibold text-gray-900 bg-white"
                  />
                </div>
                {messages > 300000 && (
                  <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-yellow-800 font-semibold">
                      For volumes above 100,000 messages/month, please{' '}
                      <Link href="/contact" className="underline hover:text-yellow-900">
                        contact sales
                      </Link>{' '}
                      for custom pricing.
                    </p>
                  </div>
                )}
                <p className="text-sm text-gray-600 mt-2">
                  ~{Math.round(Math.min(messages, 300000) / employees).toLocaleString()} messages per employee per month
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Each message = {CHARS_PER_MESSAGE.toLocaleString()} characters (assumed)
                </p>
              </div>

              {/* Freedom AI Cost Display */}
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-lg border-2 border-blue-400 shadow-lg">
                <h3 className="text-xl font-bold text-blue-800 text-center mb-4">Freedom AI Plan</h3>
                <div className="text-center">
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="bg-white p-4 rounded-lg">
                      <div className="text-3xl font-bold text-blue-600 mb-1">
                        ${freedomAICost.toFixed(2)}
                      </div>
                      <p className="text-gray-600 font-semibold text-sm">Monthly Cost</p>
                    </div>
                    <div className="bg-white p-4 rounded-lg">
                      <div className="text-3xl font-bold text-blue-600 mb-1">
                        ${(freedomAICost * 12).toLocaleString()}
                      </div>
                      <p className="text-gray-600 font-semibold text-sm">Yearly Cost</p>
                    </div>
                  </div>
                  <div className="bg-white p-3 rounded-lg space-y-1">
                    <p className="text-sm text-gray-600">
                      <span className="font-semibold">${costPerEmployee.toFixed(2)}</span> per employee / month
                    </p>
                    <p className="text-sm text-gray-600">
                      <span className="font-semibold">${(costPerEmployee * 12).toFixed(2)}</span> per employee / year
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Comparison */}
            <div className="bg-white p-8 rounded-lg border-2 border-gray-200">
              <h3 className="text-2xl font-bold mb-6 text-gray-900 text-center">Compare with Competitors (Yearly)</h3>
              <div className="space-y-4">
                {Object.entries(competitorCosts).map(([name, cost]) => {
                  const saving = savings[name]
                  const yearlyCost = cost * 12
                  const yearlySaving = saving.amount * 12
                  return (
                    <div key={name} className="p-4 border rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-semibold text-gray-900">{name}</span>
                        <span className="text-xl font-bold text-gray-900">${yearlyCost.toLocaleString()}/yr</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-600">${cost.toFixed(2)}/mo · ${(cost / employees).toFixed(2)}/employee</span>
                        {saving.amount > 0 && (
                          <span className="text-green-600 font-semibold">
                            Save ${yearlySaving.toLocaleString()}/yr ({saving.percentage.toFixed(0)}%)
                          </span>
                        )}
                        {saving.amount <= 0 && (
                          <span className="text-red-600 font-semibold">
                            ${Math.abs(yearlySaving).toLocaleString()}/yr more
                          </span>
                        )}
                      </div>
                      {saving.amount > 0 && (
                        <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-green-500 transition-all"
                            style={{ width: `${Math.min(100, saving.percentage)}%` }}
                          />
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
              <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-gray-900">Minimum Savings (Monthly):</span>
                  <span className="text-xl font-bold text-green-600">
                    ${Math.min(...Object.values(savings).map(s => s.amount > 0 ? s.amount : Infinity)).toLocaleString()}/mo
                  </span>
                </div>
                <div className="flex items-center justify-between border-t pt-3">
                  <span className="font-semibold text-gray-900">Minimum Savings (Yearly):</span>
                  <span className="text-2xl font-bold text-green-600">
                    ${(Math.min(...Object.values(savings).map(s => s.amount > 0 ? s.amount : Infinity)) * 12).toLocaleString()}/yr
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Comparison */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-center mb-4 text-gray-900">Feature Comparison</h2>
          <p className="text-xl text-gray-600 text-center mb-12 max-w-3xl mx-auto">
            See how Freedom AI stacks up against Microsoft Copilot across all Office applications
          </p>

          {/* Word / Documents */}
          <div className="mb-12">
            <h3 className="text-2xl font-bold mb-6 text-gray-900 flex items-center gap-3">
              <span className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white text-lg">W</span>
              Word / Documents
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full bg-white rounded-lg border">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="px-6 py-4 text-left font-semibold text-gray-900">Feature</th>
                    <th className="px-6 py-4 text-center font-semibold text-blue-600">Freedom AI</th>
                    <th className="px-6 py-4 text-center font-semibold text-gray-700">Microsoft Copilot</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  <tr><td className="px-6 py-3 text-gray-700">Custom Playbooks/Templates</td><td className="px-6 py-3 text-center text-green-600">✓</td><td className="px-6 py-3 text-center text-red-400">✗</td></tr>
                  <tr className="bg-gray-50"><td className="px-6 py-3 text-gray-700">Consumption-Based Pricing</td><td className="px-6 py-3 text-center text-green-600">✓</td><td className="px-6 py-3 text-center text-red-400">✗</td></tr>
                  <tr><td className="px-6 py-3 text-gray-700">AI Writing Assistant</td><td className="px-6 py-3 text-center text-green-600">✓</td><td className="px-6 py-3 text-center text-green-600">✓</td></tr>
                  <tr className="bg-gray-50"><td className="px-6 py-3 text-gray-700">Document Summarization</td><td className="px-6 py-3 text-center text-green-600">✓</td><td className="px-6 py-3 text-center text-green-600">✓</td></tr>
                  <tr><td className="px-6 py-3 text-gray-700">Grammar & Style Proofreading</td><td className="px-6 py-3 text-center text-green-600">✓</td><td className="px-6 py-3 text-center text-green-600">✓</td></tr>
                  <tr className="bg-gray-50"><td className="px-6 py-3 text-gray-700">Context-Aware Suggestions</td><td className="px-6 py-3 text-center text-green-600">✓</td><td className="px-6 py-3 text-center text-green-600">✓</td></tr>
                  <tr><td className="px-6 py-3 text-gray-700">Multi-Document Analysis</td><td className="px-6 py-3 text-center text-green-600">✓</td><td className="px-6 py-3 text-center text-green-600">✓</td></tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Excel / Sheets */}
          <div className="mb-12">
            <h3 className="text-2xl font-bold mb-6 text-gray-900 flex items-center gap-3">
              <span className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center text-white text-lg">X</span>
              Excel / Spreadsheets
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full bg-white rounded-lg border">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="px-6 py-4 text-left font-semibold text-gray-900">Feature</th>
                    <th className="px-6 py-4 text-center font-semibold text-blue-600">Freedom AI</th>
                    <th className="px-6 py-4 text-center font-semibold text-gray-700">Microsoft Copilot</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  <tr><td className="px-6 py-3 text-gray-700">Custom Analysis Playbooks</td><td className="px-6 py-3 text-center text-green-600">✓</td><td className="px-6 py-3 text-center text-red-400">✗</td></tr>
                  <tr className="bg-gray-50"><td className="px-6 py-3 text-gray-700">Consumption-Based Pricing</td><td className="px-6 py-3 text-center text-green-600">✓</td><td className="px-6 py-3 text-center text-red-400">✗</td></tr>
                  <tr><td className="px-6 py-3 text-gray-700">Formula Generation</td><td className="px-6 py-3 text-center text-green-600">✓</td><td className="px-6 py-3 text-center text-green-600">✓</td></tr>
                  <tr className="bg-gray-50"><td className="px-6 py-3 text-gray-700">Data Analysis & Insights</td><td className="px-6 py-3 text-center text-green-600">✓</td><td className="px-6 py-3 text-center text-green-600">✓</td></tr>
                  <tr><td className="px-6 py-3 text-gray-700">Chart & Visualization Creation</td><td className="px-6 py-3 text-center text-green-600">✓</td><td className="px-6 py-3 text-center text-green-600">✓</td></tr>
                  <tr className="bg-gray-50"><td className="px-6 py-3 text-gray-700">Python/VBA Code Generation</td><td className="px-6 py-3 text-center text-green-600">✓</td><td className="px-6 py-3 text-center text-green-600">✓</td></tr>
                  <tr><td className="px-6 py-3 text-gray-700">Data Cleaning Assistance</td><td className="px-6 py-3 text-center text-green-600">✓</td><td className="px-6 py-3 text-center text-green-600">✓</td></tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* PowerPoint / Slides */}
          <div className="mb-12">
            <h3 className="text-2xl font-bold mb-6 text-gray-900 flex items-center gap-3">
              <span className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center text-white text-lg">P</span>
              PowerPoint / Presentations
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full bg-white rounded-lg border">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="px-6 py-4 text-left font-semibold text-gray-900">Feature</th>
                    <th className="px-6 py-4 text-center font-semibold text-blue-600">Freedom AI</th>
                    <th className="px-6 py-4 text-center font-semibold text-gray-700">Microsoft Copilot</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  <tr><td className="px-6 py-3 text-gray-700">Custom Presentation Playbooks</td><td className="px-6 py-3 text-center text-green-600">✓</td><td className="px-6 py-3 text-center text-red-400">✗</td></tr>
                  <tr className="bg-gray-50"><td className="px-6 py-3 text-gray-700">Consumption-Based Pricing</td><td className="px-6 py-3 text-center text-green-600">✓</td><td className="px-6 py-3 text-center text-red-400">✗</td></tr>
                  <tr><td className="px-6 py-3 text-gray-700">Slide Generation from Prompt</td><td className="px-6 py-3 text-center text-green-600">✓</td><td className="px-6 py-3 text-center text-green-600">✓</td></tr>
                  <tr className="bg-gray-50"><td className="px-6 py-3 text-gray-700">Presentation Summarization</td><td className="px-6 py-3 text-center text-green-600">✓</td><td className="px-6 py-3 text-center text-green-600">✓</td></tr>
                  <tr><td className="px-6 py-3 text-gray-700">Speaker Notes Generation</td><td className="px-6 py-3 text-center text-green-600">✓</td><td className="px-6 py-3 text-center text-green-600">✓</td></tr>
                  <tr className="bg-gray-50"><td className="px-6 py-3 text-gray-700">Design Suggestions</td><td className="px-6 py-3 text-center text-green-600">✓</td><td className="px-6 py-3 text-center text-green-600">✓</td></tr>
                  <tr><td className="px-6 py-3 text-gray-700">Image Generation for Slides</td><td className="px-6 py-3 text-center text-green-600">✓</td><td className="px-6 py-3 text-center text-green-600">✓</td></tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Outlook / Email */}
          <div className="mb-12">
            <h3 className="text-2xl font-bold mb-6 text-gray-900 flex items-center gap-3">
              <span className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center text-white text-lg">✉</span>
              Outlook / Email
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full bg-white rounded-lg border">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="px-6 py-4 text-left font-semibold text-gray-900">Feature</th>
                    <th className="px-6 py-4 text-center font-semibold text-blue-600">Freedom AI</th>
                    <th className="px-6 py-4 text-center font-semibold text-gray-700">Microsoft Copilot</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  <tr><td className="px-6 py-3 text-gray-700">Email Style Learning</td><td className="px-6 py-3 text-center text-green-600">✓</td><td className="px-6 py-3 text-center text-red-400">✗</td></tr>
                  <tr className="bg-gray-50"><td className="px-6 py-3 text-gray-700">Consumption-Based Pricing</td><td className="px-6 py-3 text-center text-green-600">✓</td><td className="px-6 py-3 text-center text-red-400">✗</td></tr>
                  <tr><td className="px-6 py-3 text-gray-700">Email Composition</td><td className="px-6 py-3 text-center text-green-600">✓</td><td className="px-6 py-3 text-center text-green-600">✓</td></tr>
                  <tr className="bg-gray-50"><td className="px-6 py-3 text-gray-700">Email Summarization</td><td className="px-6 py-3 text-center text-green-600">✓</td><td className="px-6 py-3 text-center text-green-600">✓</td></tr>
                  <tr><td className="px-6 py-3 text-gray-700">Smart Reply Suggestions</td><td className="px-6 py-3 text-center text-green-600">✓</td><td className="px-6 py-3 text-center text-green-600">✓</td></tr>
                  <tr className="bg-gray-50"><td className="px-6 py-3 text-gray-700">Priority Inbox Analysis</td><td className="px-6 py-3 text-center text-green-600">✓</td><td className="px-6 py-3 text-center text-green-600">✓</td></tr>
                  <tr><td className="px-6 py-3 text-gray-700">Follow-up Reminders</td><td className="px-6 py-3 text-center text-green-600">✓</td><td className="px-6 py-3 text-center text-green-600">✓</td></tr>
                  <tr className="bg-gray-50"><td className="px-6 py-3 text-gray-700">Task Extraction from Emails</td><td className="px-6 py-3 text-center text-green-600">✓</td><td className="px-6 py-3 text-center text-green-600">✓</td></tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Teams / Chat */}
          <div className="mb-12">
            <h3 className="text-2xl font-bold mb-6 text-gray-900 flex items-center gap-3">
              <span className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center text-white text-lg">T</span>
              Teams / Chat & Collaboration
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full bg-white rounded-lg border">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="px-6 py-4 text-left font-semibold text-gray-900">Feature</th>
                    <th className="px-6 py-4 text-center font-semibold text-blue-600">Freedom AI</th>
                    <th className="px-6 py-4 text-center font-semibold text-gray-700">Microsoft Copilot</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  <tr><td className="px-6 py-3 text-gray-700">PII Detection & Privacy</td><td className="px-6 py-3 text-center text-green-600">✓</td><td className="px-6 py-3 text-center text-yellow-500">Limited</td></tr>
                  <tr className="bg-gray-50"><td className="px-6 py-3 text-gray-700">Custom Meeting Playbooks</td><td className="px-6 py-3 text-center text-green-600">✓</td><td className="px-6 py-3 text-center text-red-400">✗</td></tr>
                  <tr><td className="px-6 py-3 text-gray-700">Consumption-Based Pricing</td><td className="px-6 py-3 text-center text-green-600">✓</td><td className="px-6 py-3 text-center text-red-400">✗</td></tr>
                  <tr className="bg-gray-50"><td className="px-6 py-3 text-gray-700">Meeting Summarization</td><td className="px-6 py-3 text-center text-green-600">✓</td><td className="px-6 py-3 text-center text-green-600">✓</td></tr>
                  <tr><td className="px-6 py-3 text-gray-700">Chat Thread Summary</td><td className="px-6 py-3 text-center text-green-600">✓</td><td className="px-6 py-3 text-center text-green-600">✓</td></tr>
                  <tr className="bg-gray-50"><td className="px-6 py-3 text-gray-700">Action Item Extraction</td><td className="px-6 py-3 text-center text-green-600">✓</td><td className="px-6 py-3 text-center text-green-600">✓</td></tr>
                  <tr><td className="px-6 py-3 text-gray-700">Message Drafting</td><td className="px-6 py-3 text-center text-green-600">✓</td><td className="px-6 py-3 text-center text-green-600">✓</td></tr>
                  <tr className="bg-gray-50"><td className="px-6 py-3 text-gray-700">Real-time Transcription</td><td className="px-6 py-3 text-center text-green-600">✓</td><td className="px-6 py-3 text-center text-green-600">✓</td></tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* OneNote / Notes */}
          <div className="mb-12">
            <h3 className="text-2xl font-bold mb-6 text-gray-900 flex items-center gap-3">
              <span className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center text-white text-lg">N</span>
              OneNote / Notes
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full bg-white rounded-lg border">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="px-6 py-4 text-left font-semibold text-gray-900">Feature</th>
                    <th className="px-6 py-4 text-center font-semibold text-blue-600">Freedom AI</th>
                    <th className="px-6 py-4 text-center font-semibold text-gray-700">Microsoft Copilot</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  <tr><td className="px-6 py-3 text-gray-700">Custom Note Templates</td><td className="px-6 py-3 text-center text-green-600">✓</td><td className="px-6 py-3 text-center text-red-400">✗</td></tr>
                  <tr className="bg-gray-50"><td className="px-6 py-3 text-gray-700">Consumption-Based Pricing</td><td className="px-6 py-3 text-center text-green-600">✓</td><td className="px-6 py-3 text-center text-red-400">✗</td></tr>
                  <tr><td className="px-6 py-3 text-gray-700">Note Summarization</td><td className="px-6 py-3 text-center text-green-600">✓</td><td className="px-6 py-3 text-center text-green-600">✓</td></tr>
                  <tr className="bg-gray-50"><td className="px-6 py-3 text-gray-700">Content Organization</td><td className="px-6 py-3 text-center text-green-600">✓</td><td className="px-6 py-3 text-center text-green-600">✓</td></tr>
                  <tr><td className="px-6 py-3 text-gray-700">To-Do List Generation</td><td className="px-6 py-3 text-center text-green-600">✓</td><td className="px-6 py-3 text-center text-green-600">✓</td></tr>
                  <tr className="bg-gray-50"><td className="px-6 py-3 text-gray-700">Voice Note Transcription</td><td className="px-6 py-3 text-center text-green-600">✓</td><td className="px-6 py-3 text-center text-green-600">✓</td></tr>
                  <tr><td className="px-6 py-3 text-gray-700">Cross-Notebook Search</td><td className="px-6 py-3 text-center text-green-600">✓</td><td className="px-6 py-3 text-center text-green-600">✓</td></tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* OneDrive / Storage */}
          <div className="mb-12">
            <h3 className="text-2xl font-bold mb-6 text-gray-900 flex items-center gap-3">
              <span className="w-10 h-10 bg-blue-400 rounded-lg flex items-center justify-center text-white text-lg">☁</span>
              OneDrive / Cloud Storage
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full bg-white rounded-lg border">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="px-6 py-4 text-left font-semibold text-gray-900">Feature</th>
                    <th className="px-6 py-4 text-center font-semibold text-blue-600">Freedom AI</th>
                    <th className="px-6 py-4 text-center font-semibold text-gray-700">Microsoft Copilot</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  <tr><td className="px-6 py-3 text-gray-700">Document Comparison</td><td className="px-6 py-3 text-center text-green-600">✓</td><td className="px-6 py-3 text-center text-yellow-500">Limited</td></tr>
                  <tr className="bg-gray-50"><td className="px-6 py-3 text-gray-700">Automatic File Organization</td><td className="px-6 py-3 text-center text-green-600">✓</td><td className="px-6 py-3 text-center text-yellow-500">Limited</td></tr>
                  <tr><td className="px-6 py-3 text-gray-700">Custom Organization Rules</td><td className="px-6 py-3 text-center text-green-600">✓</td><td className="px-6 py-3 text-center text-red-400">✗</td></tr>
                  <tr className="bg-gray-50"><td className="px-6 py-3 text-gray-700">Consumption-Based Pricing</td><td className="px-6 py-3 text-center text-green-600">✓</td><td className="px-6 py-3 text-center text-red-400">✗</td></tr>
                  <tr><td className="px-6 py-3 text-gray-700">Smart File Search</td><td className="px-6 py-3 text-center text-green-600">✓</td><td className="px-6 py-3 text-center text-green-600">✓</td></tr>
                  <tr className="bg-gray-50"><td className="px-6 py-3 text-gray-700">File Content Summarization</td><td className="px-6 py-3 text-center text-green-600">✓</td><td className="px-6 py-3 text-center text-green-600">✓</td></tr>
                  <tr><td className="px-6 py-3 text-gray-700">Cross-File Q&A</td><td className="px-6 py-3 text-center text-green-600">✓</td><td className="px-6 py-3 text-center text-green-600">✓</td></tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Legend */}
          <div className="flex justify-center gap-8 mt-8 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-green-600">✓</span>
              <span className="text-gray-600">Full Support</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-yellow-500">Limited</span>
              <span className="text-gray-600">Partial Support</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-red-400">✗</span>
              <span className="text-gray-600">Not Available</span>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-900">Why Consumption-Based Pricing?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 bg-white border rounded-lg">
              <div className="flex justify-center mb-4">
                <FeatureIcon icon="billing" size={64} />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900 text-center">Pay Only for What You Use</h3>
              <p className="text-gray-600 text-center">
                No monthly minimums or per-seat fees. You only pay for actual AI consumption.
              </p>
            </div>
            <div className="p-6 bg-white border rounded-lg">
              <div className="flex justify-center mb-4">
                <FeatureIcon icon="analytics" size={64} />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900 text-center">Transparent Pricing</h3>
              <p className="text-gray-600 text-center">
                See exactly what you're paying for with detailed consumption tracking and billing.
              </p>
            </div>
            <div className="p-6 bg-white border rounded-lg">
              <div className="flex justify-center mb-4">
                <FeatureIcon icon="insights" size={64} />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900 text-center">Scale as You Grow</h3>
              <p className="text-gray-600 text-center">
                Costs scale naturally with your usage. No need to upgrade plans or add seats.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-blue-600 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold mb-6">Ready to Get Started?</h2>
          <p className="text-xl mb-8 text-blue-100">
            Start using Freedom AI today. No credit card required for trial.
          </p>
          <Link
            href="/dashboard"
            className="inline-block px-8 py-3 bg-white text-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition"
          >
            Access Dashboard
          </Link>
        </div>
      </section>
    </div>
  )
}

