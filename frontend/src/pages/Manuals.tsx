import { useNavigate } from "react-router-dom";
import { ArrowRight, BookOpen, FileText, Search, Database, HardDrive, Cpu, Network, ChevronRight, FileSearch, Library } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useInspection } from "@/hooks/useInspection";

export function Manuals() {
 const { currentAnalysis } = useInspection();
 const navigate = useNavigate();

 if (!currentAnalysis) {
 return (
 <div className="flex flex-col items-center justify-center h-full gap-4 max-w-[1440px] mx-auto px-6 py-8">
 <FileSearch size={48} className="text-[#FF9C00]" />
 <h2 className="text-2xl font-bold text-text-primary">No Manual Data</h2>
 <p className="text-text-muted font-medium text-sm text-center max-w-md">Please start an inspection to retrieve relevant manuals and technical data.</p>
 <Button onClick={() => navigate("/inspection")} className="mt-4 bg-brand hover:bg-[#000080] text-white">Go to Setup</Button>
 </div>
 );
 }

 const { rag } = currentAnalysis;

 return (
 <div className="flex flex-col min-h-screen font-sans max-w-[1440px] mx-auto px-6 pt-8 pb-32 animate-in fade-in slide-in-from-bottom-4 duration-500">
 
 {/* Header Context */}
 <div className="flex items-center justify-between mb-6">
 <div>
 <div className="flex items-center gap-2 text-xs font-semibold text-text-muted uppercase tracking-widest mb-2">
 <span>Home</span> <ChevronRight size={14} /> <span>Inspection</span> <ChevronRight size={14} /> <span className="text-brand">RAG Retrieval</span>
 </div>
 <h1 className="text-[30px] font-bold text-text-primary tracking-tight">Smart Manual Retrieval</h1>
 <p className="text-sm font-medium text-text-muted mt-1">AI-powered extraction of relevant maintenance procedures from offline documentation</p>
 </div>
 <Button onClick={() => navigate("/recommendation")} className="flex items-center gap-2 px-8 h-10 bg-brand hover:bg-[#000080] text-white font-bold tracking-wide shadow-sm rounded-md">
 View Repair Steps <ArrowRight size={16} />
 </Button>
 </div>

 {/* Stepper */}
 <div className="flex items-center justify-between border-b border-border-subtle pb-4 mb-8 relative">
 <div className="absolute bottom-[-1px] left-2/4 w-1/4 border-b-2 border-[#12C6B3] z-10 transition-all"></div>
 
 <div className="flex items-center gap-3 text-text-disabled font-semibold cursor-pointer hover:text-text-secondary transition-colors" onClick={() => navigate('/inspection')}>
 <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-xs">01</div>
 <span className="text-sm tracking-wide">Setup</span>
 </div>
 <div className="flex items-center gap-3 text-text-disabled font-semibold cursor-pointer hover:text-text-secondary transition-colors" onClick={() => navigate('/analysis')}>
 <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-xs">02</div>
 <span className="text-sm tracking-wide">AI Analysis</span>
 </div>
 <div className="flex items-center gap-3 text-teal font-bold">
 <div className="w-7 h-7 rounded-full bg-teal/10 text-teal border border-[#12C6B3]/30 flex items-center justify-center text-xs">03</div>
 <span className="text-sm tracking-wide">RAG & Reasoning</span>
 </div>
 <div className="flex items-center gap-3 text-text-disabled font-semibold">
 <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-xs">04</div>
 <span className="text-sm tracking-wide">Report & Sync</span>
 </div>
 </div>

 {/* Search Context Bar */}
 <div className="mb-8 flex">
 <div className="relative flex-1 max-w-4xl flex items-center bg-surface border border-border-subtle rounded-full overflow-hidden shadow-sm hover:shadow-md transition-shadow">
 <div className="pl-6 pr-4 py-3.5 flex items-center justify-center text-text-disabled">
 <Search size={18} />
 </div>
 <div className="flex-1 px-2 py-3.5 text-[14px] font-medium text-text-primary flex items-center gap-2">
 <span className="text-text-disabled font-normal">Query Context:</span> 
 <span className="font-semibold text-text-primary">
 "{rag.query} on aircraft skin metal structure"
 </span>
 </div>
 <div className="bg-teal/10 text-teal px-6 py-3.5 font-bold text-[11px] tracking-widest uppercase flex items-center rounded-r-full border-l border-[#12C6B3]/20">
 Completed
 </div>
 </div>
 </div>

 {/* Summary Cards */}
 <div className="grid grid-cols-12 gap-6 mb-8">
 <Card className="col-span-12 lg:col-span-3 border-border-subtle shadow-sm rounded-xl">
 <CardHeader className="bg-surface-secondary/50 border-b border-border-subtle pb-3 pt-4 px-5">
 <CardTitle className="text-[11px] font-bold text-text-muted uppercase tracking-widest flex items-center gap-2">
 <BookOpen size={14}/> Reference Source
 </CardTitle>
 </CardHeader>
 <CardContent className="p-5 flex items-center">
 <span className="font-bold text-text-primary text-sm truncate" title={rag.source || 'N/A'}>{rag.source || 'N/A'}</span>
 </CardContent>
 </Card>
 
 <Card className="col-span-12 lg:col-span-2 border-border-subtle shadow-sm rounded-xl">
 <CardHeader className="bg-surface-secondary/50 border-b border-border-subtle pb-3 pt-4 px-5">
 <CardTitle className="text-[11px] font-bold text-text-muted uppercase tracking-widest flex items-center gap-2">
 <FileText size={14}/> Location
 </CardTitle>
 </CardHeader>
 <CardContent className="p-5 flex items-center">
 <span className="font-bold text-text-primary text-sm">Page {rag.page || 0}</span>
 </CardContent>
 </Card>

 <Card className="col-span-12 lg:col-span-7 border-border-subtle shadow-sm rounded-xl">
 <CardHeader className="bg-surface-secondary/50 border-b border-border-subtle pb-3 pt-4 px-5">
 <CardTitle className="text-[11px] font-bold text-text-muted uppercase tracking-widest flex items-center gap-2">
 <FileSearch size={14}/> Extracted Procedure Snippet
 </CardTitle>
 </CardHeader>
 <CardContent className="p-5">
 <p className="text-[13px] text-text-primary font-medium italic border-l-2 border-[#12C6B3] pl-3 line-clamp-2">
 "{rag.procedure}"
 </p>
 </CardContent>
 </Card>
 </div>

 <div className="grid grid-cols-12 gap-6">
 {/* Retrieved Chunks list */}
 <div className="col-span-12 lg:col-span-8 flex flex-col gap-4">
 <div className="flex items-center gap-2 mb-2">
 <Library size={18} className="text-text-disabled" />
 <h3 className="font-bold text-text-primary text-lg">Retrieved Document Chunks</h3>
 </div>
 
 <div className="space-y-4">
 {rag.chunks && rag.chunks.length > 0 ? rag.chunks.map((chunk, i) => (
 <Card key={i} className="border-border-subtle shadow-sm rounded-xl overflow-hidden group">
 <CardHeader className="py-2.5 px-5 bg-surface-secondary/80 border-b border-border-subtle flex flex-row items-center justify-between">
 <span className="font-bold text-[12px] text-text-secondary tracking-wide">{chunk.source} <span className="text-text-disabled font-normal ml-2">Page {chunk.page}</span></span>
 <Badge variant="outline" className={`text-[10px] font-bold px-2 py-0 ${i === 0 ? 'bg-teal/10 text-teal border-[#12C6B3]/30' : 'bg-gray-100 text-text-muted border-border-subtle'}`}>
 RANK {i + 1}
 </Badge>
 </CardHeader>
 <CardContent className="p-5">
 <p className="text-[13px] text-text-secondary leading-relaxed font-medium">
 {chunk.text}
 </p>
 </CardContent>
 </Card>
 )) : (
 <div className="p-12 flex flex-col items-center justify-center text-center bg-surface-secondary rounded-xl border border-dashed border-border-subtle">
 <FileSearch size={32} className="text-gray-300 mb-3" />
 <p className="text-[13px] font-bold text-text-muted">No relevant procedure chunks found.</p>
 </div>
 )}
 </div>
 </div>

 {/* Knowledge Base Status */}
 <div className="col-span-12 lg:col-span-4">
 <Card className="border-border-subtle shadow-sm rounded-xl sticky top-6">
 <CardHeader className="bg-surface-secondary/50 border-b border-border-subtle pb-3 pt-4 px-5">
 <CardTitle className="text-[11px] font-bold text-text-muted uppercase tracking-widest flex items-center gap-2">
 <Database size={14}/> Offline Knowledge Base
 </CardTitle>
 </CardHeader>
 <CardContent className="p-5 space-y-4">
 <div className="flex items-center justify-between">
 <div className="flex items-center gap-3">
 <Database className="text-text-disabled" size={16} />
 <span className="text-[13px] font-bold text-text-secondary">SQLite Database</span>
 </div>
 <span className="text-[11px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded border border-green-100 tracking-wide">CONNECTED</span>
 </div>
 <div className="flex items-center justify-between">
 <div className="flex items-center gap-3">
 <HardDrive className="text-text-disabled" size={16} />
 <span className="text-[13px] font-bold text-text-secondary">ChromaDB Vector Store</span>
 </div>
 <span className="text-[11px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded border border-green-100 tracking-wide">CONNECTED</span>
 </div>
 <div className="flex items-center justify-between">
 <div className="flex items-center gap-3">
 <Network className="text-text-disabled" size={16} />
 <span className="text-[13px] font-bold text-text-secondary">LangChain Framework</span>
 </div>
 <span className="text-[11px] font-bold text-brand bg-brand/5 px-2 py-0.5 rounded border border-brand/10 tracking-wide">ACTIVE</span>
 </div>
 <div className="flex items-center justify-between">
 <div className="flex items-center gap-3">
 <Cpu className="text-text-disabled" size={16} />
 <span className="text-[13px] font-bold text-text-secondary">Phi-3 Mini LLM</span>
 </div>
 <span className="text-[11px] font-bold text-teal bg-teal/10 px-2 py-0.5 rounded border border-[#12C6B3]/20 tracking-wide">READY</span>
 </div>
 </CardContent>
 </Card>
 </div>
 </div>
 </div>
 );
}
