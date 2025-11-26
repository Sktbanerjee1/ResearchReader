import React, { useEffect, useState } from 'react';
import { Feed, LoadingState } from '../types';
import { fetchResearchBriefing } from '../services/gemini';
import { MarkdownRenderer } from './MarkdownRenderer';
import { DeleteConfirmationModal } from './DeleteConfirmationModal';
import { RefreshCw, ExternalLink, Clock, AlertCircle, ArrowLeft, FileText, ScrollText, Calendar, Trash2, ChevronDown } from 'lucide-react';

interface FeedViewProps {
  feed: Feed;
  onUpdateFeed: (updatedFeed: Feed) => void;
  onBack: () => void;
  onDelete: (id: string) => void;
}

export const FeedView: React.FC<FeedViewProps> = ({ feed, onUpdateFeed, onBack, onDelete }) => {
  const [loading, setLoading] = useState<LoadingState>({ status: 'idle' });
  const [showDaysDropdown, setShowDaysDropdown] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Auto-fetch if no updates exist or if it's been more than 24 hours
  useEffect(() => {
    const shouldFetch = feed.updates.length === 0 || 
      (feed.lastFetched && Date.now() - feed.lastFetched > 24 * 60 * 60 * 1000);

    if (shouldFetch) {
      handleRefresh();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [feed.id]);

  const handleRefresh = async (overrideDays?: number) => {
    const days = overrideDays || feed.searchWindowDays || 30;
    
    // Update feed preference if overridden
    if (overrideDays && overrideDays !== feed.searchWindowDays) {
       onUpdateFeed({ ...feed, searchWindowDays: overrideDays });
    }

    setLoading({ status: 'loading', message: `Scanning journals (Last ${days} days)...` });
    try {
      const result = await fetchResearchBriefing(feed.title + (feed.description ? ` ${feed.description}` : ''), days);
      
      const newUpdate = {
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        ...result
      };

      const updatedFeed: Feed = {
        ...feed,
        lastFetched: Date.now(),
        searchWindowDays: days,
        updates: [newUpdate, ...feed.updates] // Prepend new update
      };

      onUpdateFeed(updatedFeed);
      setLoading({ status: 'success' });
    } catch (error) {
      setLoading({ status: 'error', message: 'Failed to fetch research updates. Please try again.' });
    }
  };

  const latestUpdate = feed.updates[0];
  const currentDays = feed.searchWindowDays || 30;

  return (
    <div className="flex flex-col h-full bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10 px-6 py-4 flex items-center justify-between shadow-sm flex-wrap gap-4">
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <button 
            onClick={onBack}
            className="md:hidden p-2 -ml-2 text-slate-500 hover:bg-slate-100 rounded-lg flex-shrink-0"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-2xl flex-shrink-0">{feed.icon}</span>
              <h1 className="text-xl font-bold text-slate-900 truncate">{feed.title}</h1>
            </div>
            {feed.description && (
              <p className="text-sm text-slate-500 mt-0.5 truncate">{feed.description}</p>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Time Window Dropdown */}
          <div className="relative">
             <button 
               onClick={() => setShowDaysDropdown(!showDaysDropdown)}
               className="flex items-center gap-2 px-3 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 transition-colors"
             >
               <Calendar size={16} />
               {currentDays} Days
               <ChevronDown size={14} className="opacity-50" />
             </button>
             
             {showDaysDropdown && (
               <>
                 <div className="fixed inset-0 z-10" onClick={() => setShowDaysDropdown(false)}></div>
                 <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-slate-100 z-20 overflow-hidden">
                    {[30, 60, 90, 180].map(days => (
                      <button
                        key={days}
                        onClick={() => {
                          setShowDaysDropdown(false);
                          handleRefresh(days);
                        }}
                        className={`w-full text-left px-4 py-3 text-sm hover:bg-indigo-50 transition-colors flex items-center justify-between ${currentDays === days ? 'text-indigo-600 font-medium bg-indigo-50/50' : 'text-slate-700'}`}
                      >
                        Last {days} Days
                        {currentDays === days && <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>}
                      </button>
                    ))}
                 </div>
               </>
             )}
          </div>

          <button
            onClick={() => handleRefresh(currentDays)}
            disabled={loading.status === 'loading'}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
              loading.status === 'loading'
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm'
            }`}
          >
            <RefreshCw size={18} className={loading.status === 'loading' ? 'animate-spin' : ''} />
            <span className="hidden sm:inline">{loading.status === 'loading' ? 'Scanning...' : 'Scan'}</span>
          </button>
          
          <div className="w-px h-8 bg-slate-200 mx-2 hidden sm:block"></div>

          <button 
            onClick={() => setIsDeleteModalOpen(true)}
            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Delete Feed"
          >
            <Trash2 size={20} />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4 md:p-8 scroll-smooth">
        <div className="max-w-4xl mx-auto space-y-6">
          
          {loading.status === 'error' && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl flex items-center gap-3">
              <AlertCircle size={20} />
              <p>{loading.message}</p>
            </div>
          )}

          {!latestUpdate && loading.status !== 'loading' && (
            <div className="text-center py-16 text-slate-500 max-w-md mx-auto">
              <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <ScrollText size={40} className="opacity-40" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">No research found yet</h3>
              <p className="mb-8">
                We couldn't find any articles in the last <strong className="text-slate-900">{currentDays} days</strong>. 
                Try extending the search window.
              </p>
              
              <div className="flex justify-center gap-3">
                 <button 
                   onClick={() => handleRefresh(60)}
                   className="px-4 py-2 bg-white border border-slate-200 hover:border-indigo-300 hover:text-indigo-600 rounded-lg text-sm font-medium transition-colors shadow-sm"
                 >
                   Try 60 Days
                 </button>
                 <button 
                   onClick={() => handleRefresh(90)}
                   className="px-4 py-2 bg-white border border-slate-200 hover:border-indigo-300 hover:text-indigo-600 rounded-lg text-sm font-medium transition-colors shadow-sm"
                 >
                   Try 90 Days
                 </button>
              </div>
            </div>
          )}

          {latestUpdate && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="bg-slate-50/50 border-b border-slate-100 px-6 py-3 flex items-center justify-between text-xs text-slate-500 font-medium uppercase tracking-wide">
                <div className="flex items-center gap-2">
                   <span className="w-2 h-2 rounded-full bg-green-500"></span>
                   Latest Research Briefing ({currentDays} Days)
                </div>
                <div className="flex items-center gap-1">
                  <Clock size={14} />
                  {new Date(latestUpdate.timestamp).toLocaleDateString()}
                </div>
              </div>

              <div className="p-8">
                <MarkdownRenderer content={latestUpdate.content} />
              </div>

              {/* Sources Section - kept as a bibliography */}
              {latestUpdate.sources && latestUpdate.sources.length > 0 && (
                <div className="bg-slate-50 border-t border-slate-200 p-6">
                  <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                    <div className="w-1 h-4 bg-indigo-500 rounded-full"></div>
                    Source Bibliography
                  </h3>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {latestUpdate.sources.map((source, idx) => (
                      <a
                        key={idx}
                        href={source.uri}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-start gap-3 p-3 rounded-lg bg-white border border-slate-200 hover:border-indigo-300 hover:shadow-md transition-all group"
                      >
                        <div className="mt-1 min-w-[16px]">
                          <FileText size={16} className="text-slate-400 group-hover:text-indigo-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-700 truncate group-hover:text-indigo-700 transition-colors">
                            {source.title}
                          </p>
                          <p className="text-xs text-slate-400 truncate mt-0.5">
                            {new URL(source.uri).hostname}
                          </p>
                        </div>
                        <ExternalLink size={14} className="text-slate-300 group-hover:text-indigo-400" />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          
          {/* History */}
          {feed.updates.length > 1 && (
             <div className="relative py-4">
                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                  <div className="w-full border-t border-slate-200"></div>
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-slate-50 px-3 text-sm text-slate-500">Previous Briefings</span>
                </div>
             </div>
          )}

          {feed.updates.slice(1).map(update => (
             <div key={update.id} className="opacity-75 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-300">
                <div className="bg-white rounded-xl p-6 border border-slate-200">
                    <div className="flex justify-between items-center mb-4">
                        <span className="text-sm text-slate-500">{new Date(update.timestamp).toLocaleDateString()}</span>
                        <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded">Archived</span>
                    </div>
                    <div className="h-32 overflow-hidden relative">
                         <div className="absolute inset-0 bg-gradient-to-t from-white via-white/50 to-transparent top-16"></div>
                         <MarkdownRenderer content={update.content} />
                    </div>
                </div>
             </div>
          ))}

        </div>
      </div>

      <DeleteConfirmationModal 
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={() => onDelete(feed.id)}
        feedTitle={feed.title}
      />
    </div>
  );
};