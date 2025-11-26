import React from 'react';
import { ExternalLink, ArrowRight, Quote } from 'lucide-react';

interface MarkdownRendererProps {
  content: string;
}

// Simple parser for links: [text](url) and bold: **text**
const parseInline = (text: string) => {
  const parts: React.ReactNode[] = [];
  let remaining = text;

  // Regex for links [text](url)
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/;
  // Regex for bold **text**
  const boldRegex = /\*\*([^*]+)\*\*/;
  // Regex for italic *text*
  const italicRegex = /\*([^*]+)\*/;

  let i = 0;
  while (remaining) {
    // Find earliest match
    const linkMatch = remaining.match(linkRegex);
    const boldMatch = remaining.match(boldRegex);
    const italicMatch = remaining.match(italicRegex);

    let bestMatch: { type: 'link' | 'bold' | 'italic', index: number, length: number, match: RegExpMatchArray } | null = null;

    if (linkMatch && (bestMatch === null || linkMatch.index! < bestMatch.index)) {
      bestMatch = { type: 'link', index: linkMatch.index!, length: linkMatch[0].length, match: linkMatch };
    }
    if (boldMatch && (bestMatch === null || boldMatch.index! < bestMatch.index)) {
      bestMatch = { type: 'bold', index: boldMatch.index!, length: boldMatch[0].length, match: boldMatch };
    }
    if (italicMatch && (bestMatch === null || italicMatch.index! < bestMatch.index)) {
      bestMatch = { type: 'italic', index: italicMatch.index!, length: italicMatch[0].length, match: italicMatch };
    }

    if (!bestMatch) {
      parts.push(<span key={i++}>{remaining}</span>);
      break;
    }

    // Push text before match
    if (bestMatch.index > 0) {
      parts.push(<span key={i++}>{remaining.substring(0, bestMatch.index)}</span>);
    }

    // Push match
    if (bestMatch.type === 'link') {
      const [_, linkText, linkUrl] = bestMatch.match;
      
      // Check if it's an "action" link (e.g. "Read Full Paper")
      const isActionLink = linkText.toLowerCase().includes('read') || linkText.toLowerCase().includes('paper');
      
      if (isActionLink) {
         // We handle action links in the block parser mostly, but if one appears inline:
         parts.push(
            <a 
              key={i++} 
              href={linkUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-indigo-600 font-bold hover:text-indigo-800 transition-colors"
            >
              {linkText} <ArrowRight size={14} />
            </a>
         );
      } else {
        parts.push(
            <a 
            key={i++} 
            href={linkUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-indigo-600 hover:underline decoration-indigo-300 underline-offset-2"
            >
            {linkText}
            </a>
        );
      }
    } else if (bestMatch.type === 'bold') {
      parts.push(<strong key={i++} className="font-bold text-slate-800">{bestMatch.match[1]}</strong>);
    } else if (bestMatch.type === 'italic') {
      parts.push(<em key={i++} className="italic text-slate-600">{bestMatch.match[1]}</em>);
    }

    remaining = remaining.substring(bestMatch.index + bestMatch.length);
  }

  return parts;
};

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  const lines = content.split('\n');
  
  return (
    <div className="space-y-3 text-slate-600 leading-relaxed font-light">
      {lines.map((line, index) => {
        const trimmed = line.trim();

        // Headers
        if (line.startsWith('# ')) {
          return (
            <div key={index} className="pb-4 mb-6 border-b border-slate-100">
               <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
                {parseInline(line.replace('# ', ''))}
               </h1>
            </div>
          );
        }
        
        // Article Titles (Card Headers)
        if (line.startsWith('## ')) {
          // If the title contains a link, extract the URL for the header wrapper
          const linkMatch = line.match(/\[([^\]]+)\]\(([^)]+)\)/);
          if (linkMatch) {
             const [_, text, url] = linkMatch;
             return (
               <a key={index} href={url} target="_blank" rel="noopener noreferrer" className="block mt-10 mb-3 group">
                 <h2 className="text-xl font-bold text-slate-800 group-hover:text-indigo-600 transition-colors leading-tight">
                   {text}
                 </h2>
               </a>
             );
          }
          return <h2 key={index} className="text-xl font-bold text-slate-800 mt-10 mb-3 leading-tight">
             {parseInline(line.replace('## ', ''))}
          </h2>;
        }

        // Subheaders
        if (line.startsWith('### ')) {
          return <h3 key={index} className="text-lg font-semibold text-slate-900 mt-4 mb-2">
            {parseInline(line.replace('### ', ''))}
          </h3>;
        }

        // Blockquotes (Context/Scanning text)
        if (line.startsWith('> ')) {
          return (
            <div key={index} className="flex gap-3 text-slate-500 italic text-sm my-4 pl-2">
              <Quote size={16} className="flex-shrink-0 opacity-40 mt-1" />
              <div>{parseInline(line.replace('> ', ''))}</div>
            </div>
          );
        }

        // Action Buttons (Standalone links like [Read Full Paper ->](url))
        // Regex checks if line matches exactly [text](url)
        const exactLinkMatch = trimmed.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
        if (exactLinkMatch) {
            const [_, text, url] = exactLinkMatch;
            return (
                <div key={index} className="mt-4 mb-8">
                    <a 
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-indigo-600 text-white text-sm font-medium rounded-lg transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5"
                    >
                        {text} <ExternalLink size={14} />
                    </a>
                </div>
            );
        }

        // Metadata lines (Starts with bold **Source** etc)
        if (trimmed.startsWith('**Source**') || trimmed.startsWith('**Published')) {
            return (
                <div key={index} className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-3 flex items-center gap-2">
                     <span className="w-1 h-4 bg-indigo-400 rounded-full"></span>
                     {parseInline(line)}
                </div>
            );
        }

        // List items
        if (line.startsWith('- ') || line.startsWith('* ')) {
          return (
            <div key={index} className="flex gap-3 ml-1 mb-2">
              <span className="text-indigo-400 mt-2 text-xs">●</span>
              <div className="flex-1">{parseInline(line.replace(/^[-*]\s+/, ''))}</div>
            </div>
          );
        }

        // Separator
        if (trimmed === '---') {
            return <hr key={index} className="border-slate-100 my-8" />;
        }

        // Empty lines
        if (trimmed === '') {
          return <div key={index} className="h-2"></div>;
        }

        // Paragraphs
        return (
          <p key={index} className="mb-2 text-slate-600">
            {parseInline(line)}
          </p>
        );
      })}
    </div>
  );
};