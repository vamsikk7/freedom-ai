import Link from 'next/link'
import { MicrosoftIcon } from '@/components/MicrosoftIcons'
import { FeatureIcon } from '@/components/FeatureIcons'

export default function Home() {
  return (
    <main className="min-h-screen">
      {/* Header with Login/Signup */}
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <Link href="/" className="text-2xl font-bold text-blue-600">
              Freedom AI
            </Link>
            <nav className="flex items-center gap-4 md:gap-6">
              <Link href="/features" className="hidden md:inline text-gray-600 hover:text-gray-900">Features</Link>
              <Link href="/assistants" className="hidden md:inline text-gray-600 hover:text-gray-900">Assistants</Link>
              <Link href="/pricing" className="hidden md:inline text-gray-600 hover:text-gray-900">Pricing</Link>
              <Link href="/contact" className="hidden md:inline text-gray-600 hover:text-gray-900">Contact</Link>
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

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-600 to-purple-700 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              Freedom AI
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-blue-100">
              AI Assistants for Microsoft 365 - Word, Excel, PowerPoint, OneNote, OneDrive, Teams, Outlook
            </p>
            <p className="text-lg mb-12 text-blue-200 max-w-3xl mx-auto">
              Transform your Microsoft 365 workflow with intelligent AI assistants. 
              No more billing by seat - pay only for what you use.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/pricing"
                className="px-8 py-3 bg-white text-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition"
              >
                View Pricing
              </Link>
              <Link
                href="/features"
                className="px-8 py-3 border-2 border-white text-white rounded-lg font-semibold hover:bg-white/10 transition"
              >
                Explore Features
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Preview */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-center mb-12 text-gray-900">Powerful Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 border rounded-lg hover:shadow-lg transition bg-white">
              <div className="flex justify-center mb-4">
                <FeatureIcon icon="analytics" size={64} />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900 text-center">Real-Time Analytics</h3>
              <p className="text-gray-600 text-center">
                Track consumption, usage patterns, and costs in real-time with comprehensive dashboards.
              </p>
            </div>
            <div className="p-6 border rounded-lg hover:shadow-lg transition bg-white">
              <div className="flex justify-center mb-4">
                <FeatureIcon icon="billing" size={64} />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900 text-center">Consumption-Based Billing</h3>
              <p className="text-gray-600 text-center">
                Pay only for what you use. No per-seat fees, no hidden costs. Transparent pricing.
              </p>
            </div>
            <div className="p-6 border rounded-lg hover:shadow-lg transition bg-white">
              <div className="flex justify-center mb-4">
                <FeatureIcon icon="security" size={64} />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900 text-center">Enterprise Security</h3>
              <p className="text-gray-600 text-center">
                Multi-tenant architecture with role-based access control and data isolation.
              </p>
            </div>
            <div className="p-6 border rounded-lg hover:shadow-lg transition bg-white">
              <div className="flex justify-center mb-4">
                <FeatureIcon icon="insights" size={64} />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900 text-center">Usage Insights</h3>
              <p className="text-gray-600 text-center">
                Detailed reports by user, project, assistant type, and time period.
              </p>
            </div>
            <div className="p-6 border rounded-lg hover:shadow-lg transition bg-white">
              <div className="flex justify-center mb-4">
                <FeatureIcon icon="auto" size={64} />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900 text-center">Auto Top-Up</h3>
              <p className="text-gray-600 text-center">
                Automatic wallet top-ups when balance runs low. Never run out of credits.
              </p>
            </div>
            <div className="p-6 border rounded-lg hover:shadow-lg transition bg-white">
              <div className="flex justify-center mb-4">
                <FeatureIcon icon="project" size={64} />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900 text-center">Project Tracking</h3>
              <p className="text-gray-600 text-center">
                Track consumption by project, document, or conversation for better cost allocation.
              </p>
            </div>
          </div>
          <div className="text-center mt-12">
            <Link
              href="/features"
              className="text-blue-600 font-semibold hover:underline"
            >
              View All Features →
            </Link>
          </div>
        </div>
      </section>

      {/* Assistants Preview */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-center mb-12 text-gray-900">AI Assistants for Every Task</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {(['Word', 'Excel', 'PowerPoint', 'OneNote', 'OneDrive', 'Teams', 'Outlook'] as const).map((assistant) => (
              <div key={assistant} className="p-6 bg-white border rounded-lg text-center hover:shadow-lg transition">
                <div className="flex justify-center mb-3">
                  <MicrosoftIcon app={assistant} size={64} />
                </div>
                <h3 className="font-semibold text-gray-900">{assistant}</h3>
              </div>
            ))}
          </div>
          <div className="text-center mt-12">
            <Link
              href="/assistants"
              className="text-blue-600 font-semibold hover:underline"
            >
              Learn More About Assistants →
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-blue-600 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold mb-6">Ready to Get Started?</h2>
          <p className="text-xl mb-8 text-blue-100">
            Start using Freedom AI today. No credit card required for trial.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/dashboard"
              className="inline-block px-8 py-3 bg-white text-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition"
            >
              Sign Up Free
            </Link>
            <Link
              href="/pricing"
              className="inline-block px-8 py-3 border-2 border-white text-white rounded-lg font-semibold hover:bg-white/10 transition"
            >
              View Pricing
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4">Freedom AI</h3>
              <p className="text-gray-400">
                AI Assistants for Microsoft 365
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/features" className="hover:text-white">Features</Link></li>
                <li><Link href="/assistants" className="hover:text-white">Assistants</Link></li>
                <li><Link href="/pricing" className="hover:text-white">Pricing</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/contact" className="hover:text-white">Contact</Link></li>
                <li><Link href="/privacy" className="hover:text-white">Privacy Policy</Link></li>
                <li><Link href="/terms" className="hover:text-white">Terms & Conditions</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Resources</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/dashboard" className="hover:text-white">Dashboard</Link></li>
                <li><Link href="/pricing" className="hover:text-white">Calculator</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; {new Date().getFullYear()} Freedom AI. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </main>
  )
}
