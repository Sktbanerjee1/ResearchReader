export interface Source {
  title: string;
  uri: string;
}

export interface ResearchUpdate {
  id: string;
  timestamp: number;
  content: string; // Markdown content
  sources: Source[];
}

export interface Feed {
  id: string;
  title: string;
  description: string;
  lastFetched?: number;
  updates: ResearchUpdate[];
  icon: string; // Emoji or icon name
  searchWindowDays?: number;
}

export interface LoadingState {
  status: 'idle' | 'loading' | 'success' | 'error';
  message?: string;
}

export enum ViewState {
  DASHBOARD = 'DASHBOARD',
  FEED = 'FEED',
}