import { useState } from 'react'
import MerchantDashboard from './components/MerchantDashboard';
import ClientTracker from './components/ClientTracker';
import { LayoutDashboard, PackageSearch } from 'lucide-react';

function App() {
  // Simple state to toggle views
  const [view, setView] = useState<'merchant' | 'client'>('client');

  return (
    <div className="h-screen w-full relative overflow-hidden font-sans text-gray-900">

      {/* App View */}
      {view === 'merchant' ? <MerchantDashboard /> : <ClientTracker />}

      {/* Floating Navigation Switcher (Bottom Center) */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur shadow-xl border border-gray-200 p-1.5 rounded-full flex gap-1 z-50">
        <button
          onClick={() => setView('merchant')}
          className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${view === 'merchant'
            ? 'bg-gray-900 text-white shadow-md'
            : 'text-gray-500 hover:bg-gray-100'
            }`}
        >
          <LayoutDashboard size={16} />
          <span>Merchant</span>
        </button>
        <button
          onClick={() => setView('client')}
          className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${view === 'client'
            ? 'bg-blue-600 text-white shadow-md'
            : 'text-gray-500 hover:bg-gray-100'
            }`}
        >
          <PackageSearch size={16} />
          <span>Client Tracker</span>
        </button>
      </div>

    </div>
  );
}

export default App
