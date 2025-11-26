import React, { useState, useEffect } from 'react';
import { Feed, ViewState } from './types';
import { CreateFeedModal } from './components/CreateFeedModal';
import { FeedView } from './components/FeedView';
import { 
  Layout, 
  Plus, 
  Search, 
  Github, 
  Menu, 
  X, 
  Radar, 
  Newspaper, 
  Atom, 
  Microscope,
  Cpu
} from 'lucide-react';

const LOCAL_STORAGE_KEY = 'research_radar_feeds_v1';

// Initial demo data if empty
const DEMO_FEEDS: Feed[] = [
  {
    id: '1',
    title: 'Generative AI',
    description: 'LLMs, Diffusion models, and multi-modal architectures.',
    updates: [],
    icon: '🤖',
    lastFetched: 0,
    searchWindowDays: 30
  },
  {
    id: '2',
    title: 'Quantum Computing',
    description: 'Qubits, Error Correction, and Quantum Advantage.',
    updates: [],
    icon: '⚛️',
    lastFetched: 0,
    searchWindowDays: 30
  }
];

const getRandomIcon = (title: string) => {
  const icons = ['🔬', '🧬', '🔭', '📡', '🧪', '🦾', '🧠', '🔋', '🌍'];
  return icons[Math.floor(Math.random() * icons.length)];
};

export default function App() {
  // Lazy initialize state to prevent overwriting with demo data on initial render
  const [feeds, setFeeds] = useState<Feed[]>(() => {
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
    return stored ? JSON.parse(stored) : DEMO_FEEDS;
  });
  
  const [selectedFeedId, setSelectedFeedId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewState, setViewState] = useState<ViewState>(ViewState.DASHBOARD);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Save to local storage on ANY change to feeds, including empty array
  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(feeds));
  }, [feeds]);

  const handleCreateFeed = (title: string, description: string) => {
    const newFeed: Feed = {
      id: crypto.randomUUID(),
      title,
      description,
      updates: [],
      icon: getRandomIcon(title),
      searchWindowDays: 30
    };
    setFeeds([newFeed, ...feeds]);
    setSelectedFeedId(newFeed.id);
    setViewState(ViewState.FEED);
  };

  const handleUpdateFeed = (updatedFeed: Feed) => {
    setFeeds(feeds.map(f => f.id === updatedFeed.id ? updatedFeed : f));
  };

  const handleDeleteFeed = (id: string) => {
    setFeeds(feeds.filter(f => f.id !== id));
    if (selectedFeedId === id) {
      setSelectedFeedId(null);
      setViewState(ViewState.DASHBOARD);
    }
  };

  const selectedFeed = feeds.find(f => f.id === selectedFeedId);

  const renderSidebar = () => (
    <div className="flex flex-col h-full bg-slate-900 text-slate-300">
      <div className="p-6 border-b border-slate-800 flex items-center gap-3">
        <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
          <Radar size={20} />
        </div>
        <span className="font-bold text-lg text-white tracking-tight">ResearchRadar</span>
      </div>

      <div className="p-4">
        <button
          onClick={() => setIsModalOpen(true)}
          className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white p-3 rounded-xl font-medium transition-all shadow-lg shadow-indigo-900/20 group"
        >
          <Plus size={18} className="group-hover:scale-110 transition-transform" />
          <span>Track New Topic</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
        <h3 className="px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Your Feeds</h3>
        {feeds.map(feed => (
          <button
            key={feed.id}
            onClick={() => {
              setSelectedFeedId(feed.id);
              setViewState(ViewState.FEED);
              setMobileMenuOpen(false);
            }}
            className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all text-left group ${
              selectedFeedId === feed.id
                ? 'bg-slate-800 text-white shadow-md'
                : 'hover:bg-slate-800/50 hover:text-white'
            }`}
          >
            <span className="text-xl group-hover:scale-110 transition-transform">{feed.icon}</span>
            <div className="min-w-0">
              <p className="font-medium truncate">{feed.title}</p>
              <p className="text-xs text-slate-500 truncate">{feed.description}</p>
            </div>
          </button>
        ))}
        
        {feeds.length === 0 && (
          <div className="p-4 text-center text-slate-500 text-sm">
            No feeds yet. Create one to start tracking.
          </div>
        )}
      </div>

      <div className="p-4 border-t border-slate-800">
        <div className="flex items-center gap-3 text-xs text-slate-500">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
          <span>Gemini System Online</span>
        </div>
      </div>
    </div>
  );

  const renderDashboard = () => (
    <div className="p-6 md:p-12 max-w-6xl mx-auto">
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Research Dashboard</h1>
        <p className="text-slate-500 text-lg">Track real-time developments across your scientific interests.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {feeds.map(feed => (
          <div 
            key={feed.id}
            onClick={() => {
              setSelectedFeedId(feed.id);
              setViewState(ViewState.FEED);
            }}
            className="group bg-white rounded-2xl p-6 shadow-sm border border-slate-200 hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer relative overflow-hidden"
          >
             <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50 rounded-full -mr-12 -mt-12 group-hover:scale-150 transition-transform duration-500 ease-out"></div>
            
            <div className="relative z-10">
              <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center text-2xl mb-4 group-hover:bg-white group-hover:shadow-sm transition-colors">
                {feed.icon}
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-indigo-600 transition-colors">{feed.title}</h3>
              <p className="text-slate-500 text-sm line-clamp-2 mb-4">{feed.description || "No description provided."}</p>
              
              <div className="flex items-center justify-between mt-4 text-xs font-medium text-slate-400">
                <span className="flex items-center gap-1">
                   <Newspaper size={14} />
                   {feed.updates.length} Briefings
                </span>
                {feed.lastFetched ? (
                  <span>Updated {new Date(feed.lastFetched).toLocaleDateString()}</span>
                ) : (
                   <span className="text-indigo-500">New</span>
                )}
              </div>
            </div>
          </div>
        ))}

        <button 
          onClick={() => setIsModalOpen(true)}
          className="border-2 border-dashed border-slate-300 rounded-2xl p-6 flex flex-col items-center justify-center text-slate-400 hover:border-indigo-400 hover:text-indigo-500 hover:bg-indigo-50/50 transition-all min-h-[200px]"
        >
           <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-3">
             <Plus size={24} />
           </div>
           <span className="font-semibold">Add Research Area</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex md:w-80 flex-col h-full shadow-xl z-20">
        {renderSidebar()}
      </div>

      {/* Mobile Sidebar (Drawer) */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="fixed inset-0 bg-black/50" onClick={() => setMobileMenuOpen(false)}></div>
          <div className="relative w-64 h-full bg-slate-900 animate-slide-in">
             <button onClick={() => setMobileMenuOpen(false)} className="absolute top-4 right-4 text-slate-400">
               <X size={24} />
             </button>
             {renderSidebar()}
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Mobile Header */}
        <div className="md:hidden bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between">
           <div className="flex items-center gap-2">
             <button onClick={() => setMobileMenuOpen(true)} className="p-2 -ml-2 text-slate-600">
               <Menu size={24} />
             </button>
             <span className="font-bold text-slate-900">ResearchRadar</span>
           </div>
        </div>

        {/* Content View */}
        <main className="flex-1 overflow-auto bg-slate-50 relative">
          {viewState === ViewState.DASHBOARD && renderDashboard()}
          
          {viewState === ViewState.FEED && selectedFeed && (
            <FeedView 
              feed={selectedFeed}
              onUpdateFeed={handleUpdateFeed}
              onBack={() => setViewState(ViewState.DASHBOARD)}
              onDelete={handleDeleteFeed}
            />
          )}
        </main>
      </div>

      <CreateFeedModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreate={handleCreateFeed}
      />
    </div>
  );
}