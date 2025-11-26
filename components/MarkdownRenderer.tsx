import React from 'react';
import { ExternalLink, ArrowUpRight } from 'lucide-react';

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
      parts.push(
        <a 
          key={i++} 
          href={linkUrl} 
          target="_blank" 
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-800 font-semibold hover:underline decoration-indigo-300 underline-offset-2 transition-colors"
          onClick={(e) => e.stopPropagation()}
        >
          {linkText}
          <ArrowUpRight size={14} className="inline-block opacity-70 mb-0.5" />
        </a>
      );
    } else if (bestMatch.type === 'bold') {
      parts.push(<strong key={i++} className="font-semibold text-slate-900">{bestMatch.match[1]}</strong>);
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
    <div className="space-y-4 text-slate-700 leading-relaxed font-light">
      {lines.map((line, index) => {
        // Headers
        if (line.startsWith('# ')) {
          return <h1 key={index} className="text-3xl font-bold text-slate-900 mt-8 mb-6 pb-2 border-b border-slate-100">{line.replace('# ', '')}</h1>;
        }
        if (line.startsWith('## ')) {
          return <h2 key={index} className="text-xl font-bold text-slate-800 mt-8 mb-4 flex items-center gap-2">
             {parseInline(line.replace('## ', ''))}
          </h2>;
        }
        if (line.startsWith('### ')) {
          // Headers might contain links now, so we parse them. 
          // The link styling in parseInline will handle the visual weight.
          return <h3 key={index} className="text-lg font-semibold text-slate-900 mt-6 mb-2 flex items-center gap-2">
            {parseInline(line.replace('### ', ''))}
          </h3>;
        }

        // Blockquotes
        if (line.startsWith('> ')) {
          return (
            <div key={index} className="border-l-4 border-indigo-200 pl-4 py-1 my-4 bg-indigo-50/50 rounded-r-lg italic text-slate-600 text-sm">
              {parseInline(line.replace('> ', ''))}
            </div>
          );
        }

        // List items
        if (line.startsWith('- ') || line.startsWith('* ')) {
          return (
            <div key={index} className="flex gap-3 ml-2 mb-2">
              <span className="text-indigo-400 mt-1.5">•</span>
              <div className="flex-1">{parseInline(line.replace(/^[-*]\s+/, ''))}</div>
            </div>
          );
        }

        // Separator
        if (line.trim() === '---') {
            return <hr key={index} className="border-slate-200 my-8" />;
        }

        // Empty lines
        if (line.trim() === '') {
          return <div key={index} className="h-2"></div>;
        }

        // Paragraphs
        return (
          <p key={index} className="mb-2">
            {parseInline(line)}
          </p>
        );
      })}
    </div>
  );
};