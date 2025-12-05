import Link from 'next/link'
import { MicrosoftIcon } from '@/components/MicrosoftIcons'

export default function AssistantsPage() {
  const assistants = [
    {
      name: 'Word Assistant',
      app: 'Word' as const,
      description: 'AI-powered writing assistant for Microsoft Word. Get help with document creation, editing, formatting, and content suggestions.',
      capabilities: [
        'Document writing and editing',
        'Content suggestions and improvements',
        'Formatting assistance',
        'Grammar and style checking',
        'Document summarization',
      ],
    },
    {
      name: 'Excel Assistant',
      app: 'Excel' as const,
      description: 'Intelligent spreadsheet assistant for Microsoft Excel. Analyze data, create formulas, generate insights, and automate tasks.',
      capabilities: [
        'Data analysis and insights',
        'Formula generation and optimization',
        'Chart and graph creation',
        'Data cleaning and transformation',
        'Automated calculations',
      ],
    },
    {
      name: 'PowerPoint Assistant',
      app: 'PowerPoint' as const,
      description: 'Creative presentation assistant for Microsoft PowerPoint. Design slides, generate content, and create compelling presentations.',
      capabilities: [
        'Slide design and layout',
        'Content generation',
        'Visual suggestions',
        'Presentation structure',
        'Template recommendations',
      ],
    },
    {
      name: 'OneNote Assistant',
      app: 'OneNote' as const,
      description: 'Smart note-taking assistant for Microsoft OneNote. Organize notes, extract information, and enhance your note-taking workflow.',
      capabilities: [
        'Note organization',
        'Information extraction',
        'Content summarization',
        'Search and retrieval',
        'Note enhancement',
      ],
    },
    {
      name: 'OneDrive Assistant',
      app: 'OneDrive' as const,
      description: 'File management assistant for Microsoft OneDrive. Organize files, manage storage, and optimize your cloud workflow.',
      capabilities: [
        'File organization',
        'Storage optimization',
        'File search and discovery',
        'Content analysis',
        'Sharing recommendations',
      ],
    },
    {
      name: 'Teams Assistant',
      app: 'Teams' as const,
      description: 'Collaboration assistant for Microsoft Teams. Enhance meetings, manage conversations, and improve team productivity.',
      capabilities: [
        'Meeting summaries',
        'Action item extraction',
        'Conversation insights',
        'Team collaboration',
        'Communication optimization',
      ],
    },
    {
      name: 'Outlook Assistant',
      app: 'Outlook' as const,
      description: 'Email productivity assistant for Microsoft Outlook. Compose emails, manage inbox, and optimize your email workflow.',
      capabilities: [
        'Email composition',
        'Inbox management',
        'Email prioritization',
        'Response suggestions',
        'Calendar integration',
      ],
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
              <Link href="/features" className="text-gray-600 hover:text-gray-900">Features</Link>
              <Link href="/assistants" className="text-blue-600 font-semibold">Assistants</Link>
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
          <h1 className="text-5xl font-bold mb-6">AI Assistants for Microsoft 365</h1>
          <p className="text-xl text-blue-100 max-w-3xl mx-auto">
            Intelligent assistants that enhance your productivity across all Microsoft 365 applications
          </p>
        </div>
      </section>

      {/* Assistants Grid */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {assistants.map((assistant, index) => (
              <div key={index} className="p-8 border rounded-lg hover:shadow-lg transition bg-white">
                <div className="flex justify-center mb-4">
                  <MicrosoftIcon app={assistant.app} size={80} />
                </div>
                <h3 className="text-2xl font-semibold mb-3 text-gray-900 text-center">{assistant.name}</h3>
                <p className="text-gray-600 mb-4 text-center">{assistant.description}</p>
                <div className="border-t pt-4">
                  <h4 className="font-semibold mb-2 text-gray-900 text-center">Capabilities:</h4>
                  <ul className="space-y-1 text-sm text-gray-600 text-center">
                    {assistant.capabilities.map((cap, i) => (
                      <li key={i}>{cap}</li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold mb-6 text-gray-900">Ready to Get Started?</h2>
          <p className="text-lg text-gray-600 mb-8">
            See how much it costs with our consumption calculator
          </p>
          <Link
            href="/pricing"
            className="inline-block px-8 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
          >
            View Pricing & Calculator
          </Link>
        </div>
      </section>
    </div>
  )
}

