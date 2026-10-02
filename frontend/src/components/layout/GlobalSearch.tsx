import React, { useState, useEffect, useRef } from 'react';
import { Search, Loader2, FileText, ArrowRight, Home, BarChart2, Activity } from 'lucide-react';
import { api, SearchResultItem } from '@/services/api';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { popIn, TRANSITION_FAST, TRANSITION_STANDARD } from '@/lib/motion';

interface GlobalSearchProps {
 isOpen: boolean;
 onClose: () => void;
}

export function GlobalSearch({ isOpen, onClose }: GlobalSearchProps) {
 const [query, setQuery] = useState('');
 const [results, setResults] = useState<SearchResultItem[]>([]);
 const [isLoading, setIsLoading] = useState(false);
 const [error, setError] = useState('');
 const [selectedIndex, setSelectedIndex] = useState(0);
 const inputRef = useRef<HTMLInputElement>(null);

 // Debounced search
 useEffect(() => {
 if (!query.trim()) {
 setResults([]);
 setIsLoading(false);
 return;
 }

 const timer = setTimeout(async () => {
 setIsLoading(true);
 try {
 setError('');
 const data = await api.search(query);
 setResults(data);
 } catch (err: any) {
 console.error('Search failed', err);
 setError(err.message === 'Failed to fetch' || err.status === 401 ? 'Session expired or server unreachable. Please refresh and log in again.' : 'Search failed. Please try again.');
 setResults([]);
 } finally {
 setIsLoading(false);
 }
 }, 300);

 return () => clearTimeout(timer);
 }, [query]);

 // Focus input on open
 useEffect(() => {
 if (isOpen) {
 setTimeout(() => inputRef.current?.focus(), 50);
 setQuery('');
 setSelectedIndex(0);
 }
 }, [isOpen]);

 const totalItems = results.length;

 const handleKeyDown = (e: React.KeyboardEvent) => {
 if (e.key === 'Escape') {
 onClose();
 } else if (e.key === 'ArrowDown') {
 e.preventDefault();
 setSelectedIndex((prev) => (prev + 1) % totalItems || 0);
 } else if (e.key === 'ArrowUp') {
 e.preventDefault();
 setSelectedIndex((prev) => (prev - 1 + totalItems) % totalItems);
 } else if (e.key === 'Enter') {
 e.preventDefault();
 if (totalItems === 0) return;
 
 const result = results[selectedIndex];
 window.open(api.getReportUrl(result.id), '_blank');
 onClose();
 }
 };

 return (
 <AnimatePresence>
 {isOpen && (
 <motion.div 
 initial={{ opacity: 0 }}
 animate={{ opacity: 1, transition: TRANSITION_STANDARD }}
 exit={{ opacity: 0, transition: TRANSITION_FAST }}
 className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh] bg-black/40 backdrop-blur-sm" 
 onClick={onClose}
 >
 <motion.div 
 variants={popIn}
 initial="initial"
 animate="animate"
 exit="exit"
 className="w-full max-w-[560px] bg-surface rounded-xl shadow-2xl border border-border-subtle overflow-hidden flex flex-col"
 onClick={(e) => e.stopPropagation()}
 >
 {/* Input area */}
 <div className="flex items-center px-4 py-3 border-b border-border-subtle">
 <Search className="text-text-disabled mr-3" size={20} />
 <input
 ref={inputRef}
 type="text"
 className="flex-1 text-[15px] outline-none text-text-primary placeholder-gray-400 bg-transparent"
 placeholder="Search inspections, manuals, or assets..."
 value={query}
 onChange={(e) => setQuery(e.target.value)}
 onKeyDown={handleKeyDown}
 />
 {isLoading && <Loader2 className="animate-spin text-brand ml-3" size={18} />}
 <div className="ml-3 flex gap-1">
 <span className="text-[10px] text-text-disabled border border-border-subtle rounded px-1.5 py-0.5 bg-surface-secondary">ESC</span>
 </div>
 </div>

 {/* Results area */}
 <div className="max-h-[60vh] overflow-y-auto">
 {!query.trim() && (
 <div className="py-12 text-center text-sm text-text-muted">
 Type to search actual database records...
 </div>
 )}

 {query.trim() && totalItems === 0 && !isLoading && !error && (
 <div className="py-12 text-center text-sm text-text-muted">
 {error && !isLoading && <div className="py-12 text-center text-sm text-red-500 font-medium px-4">{error}</div>} No matching AeroEdge-X records found in the database.
 </div>
 )}

 {results.length > 0 && (
 <div className="py-2">
 <div className="px-4 py-1.5 text-[11px] font-semibold text-text-disabled tracking-wider uppercase">Inspection Records</div>
 {results.map((result, idx) => {
 return (
 <div
 key={result.id}
 className={`flex items-center justify-between px-4 py-2.5 mx-2 rounded-md cursor-pointer transition-colors ${
 selectedIndex === idx ? 'bg-gray-100' : 'hover:bg-surface-secondary'
 }`}
 onClick={() => {
 window.open(api.getReportUrl(result.id), '_blank');
 onClose();
 }}
 onMouseEnter={() => setSelectedIndex(idx)}
 >
 <div className="flex flex-col">
 <span className="text-[13px] font-medium text-text-primary">
 Inspection #{result.id}
 </span>
 <div className="flex items-center text-[11px] text-text-muted mt-0.5 gap-1.5">
 <span className={`font-semibold ${
 result.severity.toLowerCase() === 'high' ? 'text-red-600' : 
 result.severity.toLowerCase() === 'medium' ? 'text-orange-500' : 'text-text-muted'
 }`}>
 {result.primary_defect.toUpperCase()} · {result.severity.toUpperCase()}
 </span>
 <span>•</span>
 <span>{new Date(result.timestamp).toLocaleDateString()}</span>
 </div>
 </div>
 <FileText size={14} className="text-text-disabled" />
 </div>
 );
 })}
 </div>
 )}
 </div>
 
 {/* Footer */}
 <div className="px-4 py-2 border-t border-border-subtle bg-surface-secondary flex items-center justify-between text-[11px] text-text-disabled">
 <div className="flex items-center gap-4">
 <span className="flex items-center gap-1"><span className="border border-border-subtle rounded px-1 bg-surface">↑</span><span className="border border-border-subtle rounded px-1 bg-surface">↓</span> navigate</span>
 <span className="flex items-center gap-1"><span className="border border-border-subtle rounded px-1 bg-surface">↵</span> open</span>
 </div>
 <span>AeroEdge-X Global Search</span>
 </div>
 </motion.div>
 </motion.div>
 )}
 </AnimatePresence>
 );
}
