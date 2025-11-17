import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Layout } from '@/components/Layout';
import { Dashboard } from '@/components/Dashboard';
import { CampaignForm } from '@/components/CampaignForm';
import { Contacts } from '@/pages/Contacts';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

type Page = 'dashboard' | 'campaign' | 'contacts';

function App() {
  const [activePage, setActivePage] = useState<Page>('dashboard');

  return (
    <QueryClientProvider client={queryClient}>
      <Layout>
        {/* Tab Navigation - Responsive */}
        <div className="border-b border-gray-200 mb-6 overflow-x-auto overflow-y-hidden">
          <nav className="-mb-px flex space-x-4 sm:space-x-8 min-w-max sm:min-w-0">
            <button
              onClick={() => setActivePage('dashboard')}
              className={`py-4 px-2 sm:px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                activePage === 'dashboard'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => setActivePage('campaign')}
              className={`py-4 px-2 sm:px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                activePage === 'campaign'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Send Campaign
            </button>
            <button
              onClick={() => setActivePage('contacts')}
              className={`py-4 px-2 sm:px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                activePage === 'contacts'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Contacts
            </button>
          </nav>
        </div>

        {/* Page Content */}
        {activePage === 'dashboard' && (
          <div className="space-y-8">
            <Dashboard />
          </div>
        )}

        {activePage === 'campaign' && (
          <div>
            <h2 className="text-3xl font-bold tracking-tight mb-2">Send Campaign</h2>
            <p className="text-muted-foreground mb-6">
              Create and send WhatsApp campaign messages to your contacts
            </p>
            <CampaignForm />
          </div>
        )}

        {activePage === 'contacts' && <Contacts />}
      </Layout>
    </QueryClientProvider>
  );
}

export default App;
