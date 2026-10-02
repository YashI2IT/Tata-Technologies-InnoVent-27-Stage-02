import { useNavigate } from "react-router-dom";
import { CheckCircle2, FileText, Download, AlertTriangle, ArrowLeft, ChevronRight, FileDown, ShieldCheck, Clock, Check, FileCheck, HardDrive } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useInspection } from "@/hooks/useInspection";
import { api } from "@/services/api";

export function Result() {
 const { currentAnalysis } = useInspection();
 const navigate = useNavigate();

 if (!currentAnalysis) {
 return (
 <div className="flex flex-col items-center justify-center h-full gap-4 max-w-[1440px] mx-auto px-6 py-8">
 <AlertTriangle size={48} className="text-[#FF9C00]" />
 <h2 className="text-2xl font-bold text-text-primary">Inspection Session Expired</h2>
 <p className="text-text-muted font-medium text-sm text-center max-w-md">The inspection completion state is no longer active in memory. You can view past reports from the Dashboard.</p>
 <div className="flex gap-4 mt-4">
 <Button onClick={() => navigate("/inspection")} variant="outline" className="border-brand text-brand">New Inspection</Button>
 <Button onClick={() => navigate("/")} className="bg-brand hover:bg-[#000080] text-white">Return to Dashboard</Button>
 </div>
 </div>
 );
 }

 const handleFullReport = () => {
 if (currentAnalysis.inspection_id) {
 window.open(`${api.getReportUrl(currentAnalysis.inspection_id)}?download=true`, "_blank");
 }
 };

 const handleBriefReport = () => {
 if (!currentAnalysis) return;
 window.open(`${api.getReportUrl(currentAnalysis.inspection_id)}/csv`, "_blank");
 };

 const isDefect = currentAnalysis.vision.status === 'defect_found';
 const severity = isDefect && currentAnalysis.vision.detections[0] ? currentAnalysis.vision.detections[0].severity : 'none';

 return (
 <div className="flex flex-col min-h-screen font-sans max-w-[1600px] mx-auto px-8 pt-8 pb-32 animate-in fade-in duration-700">
 {/* Header Context */}
 <div className="flex items-center justify-between mb-8">
 <div>
 <div className="flex items-center gap-2 text-[11px] font-semibold text-text-disabled uppercase tracking-widest mb-3">
 <span>Home</span> <ChevronRight size={14} /> <span>Inspection</span> <ChevronRight size={14} /> <span className="text-text-primary">Sign-off</span>
 </div>
 <h1 className="text-3xl font-medium text-text-primary tracking-tight">Inspection Sign-off</h1>
 <p className="text-sm font-medium text-text-muted mt-2">Review finalized details and export documentation.</p>
 </div>
 </div>

 {/* Stepper */}
 <div className="flex items-center justify-between border-b border-border-subtle pb-4 mb-8 relative">
 <div className="absolute bottom-[-1px] left-3/4 w-1/4 border-b-2 border-[#12C6B3] z-10 transition-all"></div>
 
 <div className="flex items-center gap-3 text-text-disabled font-semibold cursor-pointer hover:text-text-secondary transition-colors" onClick={() => navigate('/inspection')}>
 <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-xs">01</div>
 <span className="text-sm tracking-wide">Setup</span>
 </div>
 <div className="flex items-center gap-3 text-text-disabled font-semibold cursor-pointer hover:text-text-secondary transition-colors" onClick={() => navigate('/analysis')}>
 <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-xs">02</div>
 <span className="text-sm tracking-wide">AI Analysis</span>
 </div>
 <div className="flex items-center gap-3 text-text-disabled font-semibold cursor-pointer hover:text-text-secondary transition-colors" onClick={() => navigate('/recommendation')}>
 <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-xs">03</div>
 <span className="text-sm tracking-wide">RAG & Reasoning</span>
 </div>
 <div className="flex items-center gap-3 text-teal font-bold">
 <div className="w-7 h-7 rounded-full bg-teal/10 text-teal border border-[#12C6B3]/30 flex items-center justify-center text-xs">04</div>
 <span className="text-sm tracking-wide">Report & Sync</span>
 </div>
 </div>

 <div className="grid grid-cols-12 gap-8">
 {/* LEFT: INSPECTION RECORD SUMMARY */}
 <div className="col-span-12 lg:col-span-8 flex flex-col gap-6">
 <Card className="shadow-card rounded-xl bg-surface overflow-hidden relative">
 <CardContent className="p-0">
 <div className="p-8 pb-6 border-b border-gray-50 flex items-start gap-6 bg-surface">
 <div className="w-16 h-16 bg-green-50 text-green-500 rounded-full flex items-center justify-center shrink-0 border border-green-100">
 <Check size={32} strokeWidth={2.5} />
 </div>
 <div className="flex flex-col pt-1">
 <h2 className="text-[22px] font-bold text-text-primary tracking-tight uppercase mb-1">Inspection Completed</h2>
 <p className="text-text-muted font-medium text-[15px]">Record <span className="font-bold text-text-primary">#INSP-{currentAnalysis.inspection_id}</span> has been successfully logged to the local database.</p>
 </div>
 </div>

 <div className="px-10 py-8 bg-surface">
 <h3 className="text-[11px] font-bold text-text-disabled uppercase tracking-widest mb-4">Final Record Summary</h3>
 
 <div className="grid grid-cols-2 gap-y-6 gap-x-12">
 <div className="flex flex-col gap-1 border-l-2 border-border-subtle pl-4">
 <span className="text-[11px] font-bold text-text-muted uppercase tracking-wider">Timestamp</span>
 <span className="text-[14px] font-semibold text-text-primary">{new Date(currentAnalysis.vision.timestamp).toLocaleString()}</span>
 </div>
 
 <div className="flex flex-col gap-1 border-l-2 border-[#12C6B3] pl-4">
 <span className="text-[11px] font-bold text-text-muted uppercase tracking-wider">Primary Finding</span>
 <span className="text-[14px] font-bold text-text-primary uppercase">
 {isDefect ? currentAnalysis.vision.primary_defect : 'No Defects Detected'}
 </span>
 </div>

 <div className="flex flex-col gap-1 border-l-2 border-border-subtle pl-4">
 <span className="text-[11px] font-bold text-text-muted uppercase tracking-wider">Severity Layer</span>
 <Badge variant={severity === 'high' ? 'destructive' : severity === 'medium' ? 'warning' : 'success'} className="w-fit mt-0.5 px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider">
 {severity}
 </Badge>
 </div>

 <div className="flex flex-col gap-1 border-l-2 border-border-subtle pl-4">
 <span className="text-[11px] font-bold text-text-muted uppercase tracking-wider">Reference Manual</span>
 <span className="text-[14px] font-medium text-text-primary truncate" title={currentAnalysis.rag.source || 'N/A'}>
 {currentAnalysis.rag.source ? currentAnalysis.rag.source.split('/').pop() : 'N/A'} (Page {currentAnalysis.rag.page || 0})
 </span>
 </div>
 
 <div className="flex flex-col gap-1 border-l-2 border-border-subtle pl-4 col-span-2">
 <span className="text-[11px] font-bold text-text-muted uppercase tracking-wider">Data Persistence</span>
 <div className="flex items-center gap-2 mt-0.5">
 <HardDrive size={14} className="text-teal" />
 <span className="text-[13px] font-semibold text-text-secondary">Saved to Local SQLite Database</span>
 </div>
 </div>
 </div>
 </div>
 </CardContent>
 </Card>
 </div>

 {/* RIGHT: ACTIONS */}
 <div className="col-span-12 lg:col-span-4 flex flex-col gap-6">
 <Card className="shadow-card rounded-xl bg-surface overflow-hidden">
 <CardHeader className="border-b border-border-subtle pb-4 pt-6 px-8">
 <CardTitle className="text-[14px] font-bold text-text-muted uppercase tracking-widest flex items-center gap-2">
 <FileCheck size={18}/> Export Actions
 </CardTitle>
 </CardHeader>
 <CardContent className="p-8 flex flex-col gap-4">
 <Button className="w-full bg-teal hover:bg-[#0f9f90] rounded-full text-text-primary h-12 text-sm font-bold shadow-sm flex items-center justify-center gap-2 transition-all" onClick={handleFullReport}>
 <FileDown size={18} /> Generate PDF Report
 </Button>
 
 <Button variant="outline" className="w-full bg-transparent rounded-full border-border-subtle text-text-secondary hover:bg-surface-secondary hover:text-text-primary h-12 text-sm font-semibold flex items-center justify-center gap-2 transition-all" onClick={handleBriefReport}>
 <Download size={18} /> Export Brief (CSV)
 </Button>
 </CardContent>
 </Card>

 <Card className="shadow-card rounded-xl bg-surface overflow-hidden">
 <CardContent className="p-6 flex flex-col gap-3 pt-6">
 <Button variant="ghost" className="w-full justify-start h-12 font-semibold rounded-full text-text-secondary hover:bg-surface-secondary border border-border-subtle shadow-sm transition-all" onClick={() => navigate("/")}>
 <ChevronRight size={16} className="mr-3 text-text-disabled" /> Return to Dashboard
 </Button>
 <Button variant="ghost" className="w-full justify-start h-12 font-semibold rounded-full text-text-secondary hover:bg-surface-secondary border border-border-subtle shadow-sm transition-all" onClick={() => { window.location.href = '/inspection'; }}>
 <ChevronRight size={16} className="mr-3 text-text-disabled" /> Start New Inspection
 </Button>
 </CardContent>
 </Card>
 </div>
 </div>
 </div>
 );
}
