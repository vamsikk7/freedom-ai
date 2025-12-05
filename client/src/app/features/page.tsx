import Link from 'next/link'
import { FeatureIcon } from '@/components/FeatureIcons'

export default function FeaturesPage() {
  const features = [
    {
      title: 'Real-Time Consumption Tracking',
      description: 'Monitor token consumption in real-time with live dashboards. Track usage by user, organization, assistant type, and project.',
      icon: 'analytics' as const,
    },
    {
      title: 'Consumption-Based Billing',
      description: 'Pay only for what you use. No per-seat fees, no monthly minimums. Transparent, usage-based pricing that scales with your needs.',
      icon: 'billing' as const,
    },
    {
      title: 'Multi-Tenant Architecture',
      description: 'Manage multiple organizations from a single dashboard. Complete data isolation with role-based access control.',
      icon: 'tenant' as const,
    },
    {
      title: 'Advanced Analytics',
      description: 'Comprehensive analytics including consumption trends, peak usage times, revenue tracking, and usage patterns by day of week.',
      icon: 'insights' as const,
    },
    {
      title: 'Project-Level Tracking',
      description: 'Track consumption by project, document, or conversation. Perfect for cost allocation and budget management.',
      icon: 'project' as const,
    },
    {
      title: 'Auto Top-Up System',
      description: 'Automatically top up your wallet when balance runs low. Set custom thresholds and amounts for seamless operation.',
      icon: 'auto' as const,
    },
    {
      title: 'Stripe Integration',
      description: 'Secure payment processing with Stripe. Support for credit cards and ACH payments with automated billing.',
      icon: 'stripe' as const,
    },
    {
      title: 'Consumption Limits',
      description: 'Set monthly, daily, and per-user consumption limits to control costs and prevent overages.',
      icon: 'limits' as const,
    },
    {
      title: 'Detailed Reporting',
      description: 'Generate monthly reports with breakdowns by assistant, user, and project. Export to CSV, JSON, or PDF.',
      icon: 'report' as const,
    },
    {
      title: 'User Management',
      description: 'Manage users across organizations with role-based permissions. Track individual consumption and activity.',
      icon: 'users' as const,
    },
    {
      title: 'Usage Patterns Analysis',
      description: 'Understand when and how your team uses AI assistants. Identify peak times and optimize workflows.',
      icon: 'patterns' as const,
    },
    {
      title: 'API Access',
      description: 'Full REST API for programmatic access to consumption data, billing information, and analytics.',
      icon: 'api' as const,
    },
  ]

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
              <Link href="/features" className="text-blue-600 font-semibold">Features</Link>
              <Link href="/assistants" className="text-gray-600 hover:text-gray-900">Assistants</Link>
              <Link href="/pricing" className="text-gray-600 hover:text-gray-900">Pricing</Link>
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
          <h1 className="text-5xl font-bold mb-6">Powerful Features</h1>
          <p className="text-xl text-blue-100 max-w-3xl mx-auto">
            Everything you need to manage, monitor, and optimize your AI assistant usage
          </p>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="p-6 border rounded-lg hover:shadow-lg transition bg-white">
                <div className="flex justify-center mb-4">
                  <FeatureIcon icon={feature.icon} size={80} />
                </div>
                <h3 className="text-xl font-semibold mb-2 text-gray-900 text-center">{feature.title}</h3>
                <p className="text-gray-600 text-center">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold mb-6 text-gray-900">Ready to Experience These Features?</h2>
          <Link
            href="/pricing"
            className="inline-block px-8 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
          >
            View Pricing
          </Link>
        </div>
      </section>
    </div>
  )
}

