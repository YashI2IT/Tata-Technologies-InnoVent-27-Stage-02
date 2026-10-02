import { useEffect, useState, useMemo } from "react";
import { createPortal } from "react-dom";
import { Download, FileText, Search, X, Maximize2, ExternalLink, Calendar, AlertTriangle, BookOpen, CheckCircle2, FileOutput, Activity } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { api, InspectionHistoryItem } from "@/services/api";
import { useNavigate } from "react-router-dom";

export function Reports() {
 const [history, setHistory] = useState<InspectionHistoryItem[]>([]);
 const [loading, setLoading] = useState(true);
 const [error, setError] = useState(false);
 const navigate = useNavigate();

 // Filters
 const [searchQuery, setSearchQuery] = useState("");
 const [severityFilter, setSeverityFilter] = useState<string>("all");

 // Preview State
 const [previewReport, setPreviewReport] = useState<InspectionHistoryItem | null>(null);

 useEffect(() => {
 api.getHistory(50).then(data => {
 setHistory(data);
 setLoading(false);
 }).catch(err => {
 console.error(err);
 setError(true);
 setLoading(false);
 });
 }, []);

 // Filtered Results
 const filteredReports = useMemo(() => {
 return history.filter(item => {
 const matchesSeverity = severityFilter === "all" || item.severity.toLowerCase() === severityFilter;
 const searchString = `${item.id} ${item.primary_defect} ${item.source}`.toLowerCase();
 const matchesSearch = searchString.includes(searchQuery.toLowerCase());
 return matchesSeverity && matchesSearch;
 });
 }, [history, searchQuery, severityFilter]);

 // Metrics
 const totalReports = history.length;
 const highSeverityCount = history.filter(item => item.severity === 'high').length;

 const handleDownload = (id: number) => {
 window.open(`${api.getReportUrl(id)}?download=true`, "_blank");
 };

 const handleOpenInspection = (id: number) => {
 navigate(`/digital-twin`); // Ideally we'd pass ID to state, but routing there is fine for this demo
 };

 return (
 <div className="flex flex-col gap-6 max-w-[1600px] mx-auto font-sans px-8 pt-8 pb-32 animate-in fade-in duration-700">
 
 {/* Header Context */}
 <div className="mb-2 flex items-center justify-between">
 <div>
 <div className="flex items-center gap-2 text-[11px] font-semibold text-text-disabled uppercase tracking-widest mb-3">
 <span>Home</span> <span className="text-gray-300">/</span> <span className="text-text-primary">Reports</span>
 </div>
 <h1 className="text-3xl font-medium text-text-primary tracking-tight">Inspection Reports</h1>
 <p className="text-sm font-medium text-text-muted mt-2">Generated inspection records and maintenance evidence</p>
 </div>
 </div>

 {/* Control Bar & Summary Metrics */}
 <div className="grid grid-cols-12 gap-8">
 {/* Summary Cards */}
 <div className="col-span-3">
 <Card className="h-full shadow-card rounded-xl bg-surface">
 <CardContent className="p-8 flex flex-col justify-center h-full">
 <span className="text-[11px] font-semibold text-text-disabled uppercase tracking-widest mb-3">Total Reports</span>
 <div className="flex items-end gap-3">
 <span className="text-4xl font-bold text-text-primary leading-none">{totalReports}</span>
 <span className="text-[13px] font-medium text-text-disabled mb-1">Generated</span>
 </div>
 </CardContent>
 </Card>
 </div>
 <div className="col-span-3">
 <Card className="h-full shadow-card rounded-xl bg-surface">
 <CardContent className="p-8 flex flex-col justify-center h-full">
 <span className="text-[11px] font-semibold text-text-disabled uppercase tracking-widest mb-3">High Severity</span>
 <div className="flex items-end gap-3">
 <span className="text-4xl font-bold text-red-500 leading-none">{highSeverityCount}</span>
 <span className="text-[13px] font-medium text-text-disabled mb-1">Findings</span>
 </div>
 </CardContent>
 </Card>
 </div>

 {/* Filters */}
 <div className="col-span-6 flex flex-col justify-end">
 <div className="flex gap-4 items-center justify-end w-full">
 <div className="relative w-72">
 <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-disabled" size={18} />
 <input 
 type="text" 
 placeholder="Search ID, Defect, Manual..." 
 className="w-full h-12 pl-12 pr-6 rounded-full border border-border-subtle shadow-sm text-[14px] font-medium focus:outline-none focus:ring-2 focus:ring-gray-200 transition-all"
 value={searchQuery}
 onChange={(e) => setSearchQuery(e.target.value)}
 />
 </div>
 <select 
 className="h-12 px-6 rounded-full border border-border-subtle shadow-sm text-[14px] font-bold text-text-secondary bg-surface focus:outline-none focus:ring-2 focus:ring-gray-200 cursor-pointer appearance-none pr-10 bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23131313%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E')] bg-[length:10px_10px] bg-no-repeat bg-[position:right_1.2rem_center]"
 value={severityFilter}
 onChange={(e) => setSeverityFilter(e.target.value)}
 >
 <option value="all">All Severities</option>
 <option value="high">High</option>
 <option value="medium">Medium</option>
 <option value="low">Low</option>
 <option value="none">Clean / None</option>
 </select>
 </div>
 </div>
 </div>

 {/* Report Table List */}
 <div className="flex flex-col gap-3">
 {loading ? (
 <div className="p-12 text-center text-text-muted font-semibold bg-surface-secondary/50 rounded-xl border border-dashed border-border-subtle">
 Loading inspection records...
 </div>
 ) : error ? (
 <div className="p-12 text-center text-danger font-semibold bg-danger-light/20 rounded-xl border border-danger-light">
 Failed to connect to backend database. Please ensure the local server is running.
 </div>
 ) : filteredReports.length === 0 ? (
 <div className="p-16 text-center text-text-muted font-semibold bg-surface-secondary/50 rounded-xl border border-dashed border-border-subtle flex flex-col items-center">
 <FileText size={48} className="text-gray-300 mb-4" />
 <p className="text-text-primary text-lg">No matching reports</p>
 <p className="text-sm font-normal mt-1 text-text-muted">
 {history.length === 0 ? "Complete an inspection to generate the first report." : "Adjust your search or filter settings."}
 </p>
 </div>
 ) : (
 <div className="shadow-card rounded-xl bg-surface overflow-hidden mt-2">
 {/* Table Header */}
 <div className="grid grid-cols-12 gap-4 px-8 py-5 border-b border-gray-50 bg-surface text-[11px] font-semibold text-text-disabled uppercase tracking-widest">
 <div className="col-span-4">Report Identity</div>
 <div className="col-span-2">Finding & Severity</div>
 <div className="col-span-3">Maintenance Reference</div>
 <div className="col-span-3 text-right pr-4">Actions</div>
 </div>

 {/* Table Rows */}
 <div className="flex flex-col divide-y divide-gray-50">
 {filteredReports.map((item) => (
 <div key={item.id} className="grid grid-cols-12 gap-4 px-8 py-5 items-center hover:bg-surface-secondary/50 transition-colors group">
 
 {/* Column 1: Identity */}
 <div className="col-span-4 flex items-center gap-5">
 <div className="w-12 h-12 bg-surface-secondary text-text-muted rounded-full flex items-center justify-center shrink-0 border border-border-subtle group-hover:bg-gray-900 group-hover:text-white transition-colors">
 <FileText size={20} />
 </div>
 <div className="flex flex-col overflow-hidden">
 <span className="font-bold text-text-primary text-[15px] truncate">AeroEdge_Inspection_{item.id}.pdf</span>
 <div className="flex items-center gap-3 mt-1 text-[12px] text-text-disabled font-medium">
 <span className="text-text-muted font-bold">INSP-#{item.id}</span>
 <span>•</span>
 <span className="flex items-center gap-1.5"><Calendar size={12}/> {new Date(item.timestamp).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}</span>
 </div>
 </div>
 </div>

 {/* Column 2: Finding */}
 <div className="col-span-2 flex flex-col justify-center gap-2">
 <div className="flex items-center gap-1.5">
 <span className="font-bold capitalize text-text-primary text-[14px] truncate" title={item.primary_defect || 'None'}>
 {item.primary_defect || 'None'}
 </span>
 </div>
 <div className="flex items-center gap-2">
 <span className={`w-2 h-2 rounded-full ${item.severity === 'high' ? 'bg-red-500' : item.severity === 'medium' ? 'bg-amber-500' : 'bg-green-500'}`}></span>
 <span className="text-[12px] font-bold text-text-secondary capitalize">{item.severity}</span>
 </div>
 </div>

 {/* Column 3: Reference */}
 <div className="col-span-3 flex flex-col justify-center">
 <div className="flex flex-col gap-1.5">
 <span className="flex items-center gap-1.5 text-[14px] font-bold text-text-primary truncate" title={item.source}>
 <span className="truncate">{item.source && item.source !== 'N/A' ? item.source.split('\\').pop() : 'No Manual Reference'}</span>
 </span>
 {item.page ? <span className="text-[12px] text-text-muted font-medium">Page {item.page}</span> : null}
 </div>
 </div>

 {/* Column 4: Actions */}
 <div className="col-span-3 flex items-center justify-end gap-3">
 <Button 
 variant="ghost" 
 className="text-text-secondary hover:text-text-primary hover:bg-gray-100 font-bold rounded-full h-10 px-4"
 onClick={() => setPreviewReport(item)}
 >
 <Maximize2 size={16} className="mr-2" /> View
 </Button>
 <Button 
 variant="ghost" 
 className="text-text-secondary hover:text-text-primary hover:bg-gray-100 font-bold rounded-full h-10 px-4 border border-border-subtle shadow-sm"
 onClick={() => handleDownload(item.id)}
 >
 <Download size={16} className="mr-2 text-text-muted" /> Download
 </Button>
 </div>
 </div>
 ))}
 </div>
 </div>
 )}
 </div>

 {/* PDF Viewer Modal */}
 {previewReport && createPortal(
 <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 md:p-8 animate-in fade-in duration-300">
 <div className="bg-surface rounded-xl shadow-2xl overflow-hidden w-full h-full max-w-[1400px] flex flex-col relative scale-in-95 duration-300">
 
 {/* Modal Header */}
 <div className="px-8 py-5 border-b border-gray-50 flex justify-between items-center bg-surface">
 <div className="flex items-center gap-4">
 <div className="w-12 h-12 bg-surface-secondary text-text-muted rounded-full flex items-center justify-center border border-border-subtle">
 <FileOutput size={20} />
 </div>
 <div className="flex flex-col">
 <h3 className="font-bold text-text-primary text-lg tracking-tight">AeroEdge_Inspection_{previewReport.id}.pdf</h3>
 <p className="text-[11px] text-text-disabled font-semibold uppercase tracking-widest mt-0.5">Inspection #{previewReport.id} • {new Date(previewReport.timestamp).toLocaleString()}</p>
 </div>
 </div>
 <div className="flex gap-4">
 <Button variant="ghost" className="rounded-full h-11 px-5 border border-border-subtle shadow-sm font-bold text-text-secondary hover:bg-surface-secondary" onClick={() => handleDownload(previewReport.id)}>
 <Download size={18} className="mr-2 text-text-muted" /> Download PDF
 </Button>
 <Button variant="ghost" size="icon" className="h-11 w-11 rounded-full text-text-disabled hover:text-text-primary hover:bg-gray-100 transition-colors" onClick={() => setPreviewReport(null)}>
 <X size={24} />
 </Button>
 </div>
 </div>

 {/* Modal Content */}
 <div className="flex flex-1 overflow-hidden bg-surface-secondary">
 
 {/* PDF Viewer */}
 <div className="flex-1 h-full p-8">
 <div className="w-full h-full bg-surface rounded-2xl shadow-sm border border-border-subtle overflow-hidden flex flex-col">
 <iframe 
 src={`${api.getReportUrl(previewReport.id)}#toolbar=0&navpanes=0`} 
 title={`Report ${previewReport.id}`}
 className="w-full flex-1 bg-gray-100"
 />
 </div>
 </div>

 {/* Info Sidebar */}
 <div className="w-80 h-full border-l border-border-subtle bg-surface p-8 overflow-y-auto hidden md:flex flex-col gap-6">
 <h4 className="text-[13px] font-bold text-text-primary flex items-center gap-2">
 <Activity size={18} /> Report Details
 </h4>

 <div className="flex flex-col gap-5 mt-2">
 <div>
 <span className="text-[11px] text-text-disabled font-semibold uppercase tracking-widest block mb-1.5">Status</span>
 <span className="flex items-center gap-2 text-[14px] font-bold text-green-500"><CheckCircle2 size={16}/> Available</span>
 </div>
 
 <div>
 <span className="text-[11px] text-text-disabled font-semibold uppercase tracking-widest block mb-1.5">Primary Finding</span>
 <span className="text-[15px] font-bold text-text-primary capitalize">{previewReport.primary_defect || 'None'}</span>
 </div>
 
 <div>
 <span className="text-[11px] text-text-disabled font-semibold uppercase tracking-widest block mb-1.5">Severity</span>
 <div className="flex items-center gap-2">
 <span className={`w-2 h-2 rounded-full ${previewReport.severity === 'high' ? 'bg-red-500' : previewReport.severity === 'medium' ? 'bg-amber-500' : 'bg-green-500'}`}></span>
 <span className="text-[13px] font-bold text-text-secondary capitalize">{previewReport.severity}</span>
 </div>
 </div>

 <div className="bg-surface-secondary rounded-[1rem] p-5 border border-border-subtle mt-2">
 <span className="text-[11px] text-text-disabled font-semibold uppercase tracking-widest block mb-1.5">Maintenance Ref.</span>
 <span className="text-[14px] font-bold text-text-primary break-all">{previewReport.source ? previewReport.source.split('\\').pop() : 'None'}</span>
 {previewReport.page && <span className="text-[13px] font-medium text-text-muted block mt-1">Page {previewReport.page}</span>}
 </div>
 </div>

 <div className="mt-auto pt-6 border-t border-gray-50">
 <Button className="w-full h-12 rounded-full bg-primary hover:bg-primary-dark text-white shadow-[0_4px_15px_-4px_rgba(0,0,0,0.15)] font-bold transition-all" onClick={() => handleOpenInspection(previewReport.id)}>
 Open Digital Twin
 </Button>
 </div>
 </div>

 </div>
 </div>
 </div>,
 document.body
 )}

 </div>
 );
}
