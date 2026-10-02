import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Link, useNavigate } from "react-router-dom";
import { 
 ClipboardList, 
 AlertTriangle, 
 Wifi,
 ChevronRight,
 PlaySquare,
 Box,
 FileText,
 CheckCircle2,
 AlertCircle,
 Download,
 X,
 FileOutput,
 Activity
} from "lucide-react";
import { 
 LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
 BarChart, Bar, Cell
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { api, InspectionHistoryItem } from "@/services/api";
import { motion } from "framer-motion";
import { staggerContainer, staggerItem } from "@/lib/motion";

const COLORS = ['#1d4ed8', '#FF9C00', '#dc2626', '#64748b', '#16a34a'];

export function Dashboard() {
 const [history, setHistory] = useState<InspectionHistoryItem[]>([]);
 const [loading, setLoading] = useState(true);
 const [apiError, setApiError] = useState(false);
 const [previewReport, setPreviewReport] = useState<InspectionHistoryItem | null>(null);
 const navigate = useNavigate();

 useEffect(() => {
 api.getHistory(50).then(data => {
 setHistory(data);
 setLoading(false);
 setApiError(false);
 }).catch(err => {
 console.error(err);
 setLoading(false);
 setApiError(true);
 });
 }, []);

 // 1. Data Mapping & Calculations
 const totalInspections = history.length;
 const defectsFound = history.filter(h => h.primary_defect && h.primary_defect !== 'none' && h.primary_defect.toLowerCase() !== 'no defects detected.').length;
 const criticalDefects = history.filter(h => h.severity === 'high' || h.severity === 'critical').length;
 
 // Trend Data (Group by date, last 7 days of actual records)
 const trendMap: Record<string, { inspections: number, defects: number }> = {};
 history.forEach(h => {
 const dateStr = new Date(h.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
 if (!trendMap[dateStr]) trendMap[dateStr] = { inspections: 0, defects: 0 };
 trendMap[dateStr].inspections += 1;
 if (h.primary_defect && h.primary_defect !== 'none' && h.primary_defect.toLowerCase() !== 'no defects detected.') {
 trendMap[dateStr].defects += 1;
 }
 });
 
 const trendData = Object.entries(trendMap)
 .sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime())
 .map(([name, data]) => ({
 name,
 inspections: data.inspections,
 defects: data.defects
 })).slice(-7);

 // Defect Distribution Data
 const defectCount: Record<string, number> = {};
 history.forEach(h => {
 if (h.primary_defect && h.primary_defect !== 'none' && h.primary_defect.toLowerCase() !== 'no defects detected.') {
 const type = h.primary_defect;
 defectCount[type] = (defectCount[type] || 0) + 1;
 }
 });
 
 const defectDistData = Object.entries(defectCount)
 .sort((a,b) => b[1] - a[1])
 .map(([name, value]) => ({ name: name.toUpperCase(), value }));

 const recentDefects = history.filter(h => h.primary_defect && h.primary_defect !== 'none' && h.primary_defect.toLowerCase() !== 'no defects detected.').slice(0, 4);
 const recentLog = history.slice(0, 5);

 const handleRefresh = () => {
 setLoading(true);
 api.getHistory(50).then(data => {
 setHistory(data);
 setLoading(false);
 setApiError(false);
 }).catch(() => {
 setLoading(false);
 setApiError(true);
 });
 };

 const handleDownload = (id: number) => {
 window.open(`${api.getReportUrl(id)}?download=true`, "_blank");
 };

 if (loading) {
 return (
 <div className="flex flex-col gap-6 max-w-[1600px] mx-auto p-8 h-full animate-pulse">
 <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
 <div className="grid grid-cols-4 gap-6">
 <div className="h-32 bg-gray-100 rounded-xl"></div>
 <div className="h-32 bg-gray-100 rounded-xl"></div>
 <div className="h-32 bg-gray-100 rounded-xl"></div>
 <div className="h-32 bg-gray-100 rounded-xl"></div>
 </div>
 <div className="grid grid-cols-3 gap-6">
 <div className="h-64 bg-gray-100 rounded-xl col-span-2"></div>
 <div className="h-64 bg-gray-100 rounded-xl"></div>
 </div>
 </div>
 );
 }

 return (
 <div className="flex flex-col gap-8 font-sans max-w-[1600px] mx-auto px-8 pb-12 pt-8 min-h-screen">
 
 {/* Dashboard Header */}
 <div className="flex justify-between items-center">
 <div>
 <h1 className="text-3xl font-medium text-text-primary tracking-tight">Overview</h1>
 </div>
 <div className="flex items-center gap-3 bg-surface p-1.5 rounded-full shadow-sm border border-border-subtle">
 <div className="flex items-center gap-2 text-[11px] font-bold tracking-widest uppercase px-4 py-2 bg-surface-secondary rounded-full text-text-secondary">
 <Activity size={14} className={apiError ? "text-red-500" : "text-blue-500"} />
 {apiError ? "Unavailable" : "Standalone"}
 </div>
 <Button variant="ghost" size="sm" onClick={handleRefresh} className="rounded-full h-9 text-xs font-semibold hover:bg-surface-secondary px-4 text-text-secondary">
 Refresh Data
 </Button>
 <Button variant="default" onClick={() => navigate('/inspection')} size="sm" className="rounded-full h-9 text-xs font-semibold px-5 flex items-center gap-2 shadow-md">
 <PlaySquare size={14} />
 + New Inspection
 </Button>
 </div>
 </div>

 {apiError && (
 <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4 flex items-center justify-between">
 <div className="flex items-center gap-3">
 <AlertTriangle size={20} className="text-red-500" />
 <span className="text-sm font-medium">Unable to connect to the backend system. Data may be stale.</span>
 </div>
 <Button variant="outline" size="sm" onClick={handleRefresh} className="bg-surface text-red-600 border-red-200 hover:bg-red-50">Retry Connection</Button>
 </div>
 )}

 {/* Top KPI Row */}
 <motion.div 
 variants={staggerContainer}
 initial="initial"
 animate="animate"
 className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
 >
 <motion.div variants={staggerItem}>
 <StatCard 
 title="Total Inspections" 
 value={totalInspections} 
 icon={ClipboardList} 
 />
 </motion.div>
 <motion.div variants={staggerItem}>
 <StatCard 
 title="Defects Found" 
 value={defectsFound} 
 icon={AlertTriangle} 
 />
 </motion.div>
 <motion.div variants={staggerItem}>
 <StatCard 
 title="High-Severity" 
 value={criticalDefects} 
 icon={AlertCircle} 
 />
 </motion.div>
 <motion.div variants={staggerItem}>
 <StatCard 
 title="System Status" 
 value={apiError ? "Error" : "Active"} 
 subValue="Local Mode"
 icon={Activity} 
 iconColor={apiError ? "text-red-500" : "text-blue-500"}
 />
 </motion.div>
 </motion.div>

 {/* Analytics Section */}
 <motion.div 
 variants={staggerContainer}
 initial="initial"
 animate="animate"
 className="grid grid-cols-12 gap-6 mt-2"
 >
 <motion.div variants={staggerItem} className="col-span-12 lg:col-span-8 flex flex-col">
 <Card className="flex-1 shadow-card rounded-xl bg-surface overflow-hidden">
 <CardHeader className="pb-2 pt-6 px-8">
 <CardTitle className="text-[15px] font-medium text-text-primary">Inspection Trend</CardTitle>
 </CardHeader>
 <CardContent className="px-6 pb-6">
 <div className="h-64 w-full">
 {trendData.length > 0 ? (
 <ResponsiveContainer width="100%" height="100%">
 <LineChart data={trendData} margin={{ top: 15, right: 10, left: -20, bottom: 0 }}>
 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
 <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} dy={10} />
 <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} />
 <RechartsTooltip 
 contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)', fontSize: '12px', fontWeight: '500', color: '#0f172a' }}
 />
 <Line type="monotone" dataKey="inspections" stroke="#2563eb" strokeWidth={3} dot={{ r: 0 }} activeDot={{ r: 6, strokeWidth: 0, fill: '#2563eb' }} name="Inspections" animationDuration={1000} />
 <Line type="monotone" dataKey="defects" stroke="#f59e0b" strokeWidth={3} dot={{ r: 0 }} activeDot={{ r: 6, strokeWidth: 0, fill: '#f59e0b' }} name="Defects Found" animationDuration={1000} />
 </LineChart>
 </ResponsiveContainer>
 ) : (
 <div className="w-full h-full flex items-center justify-center text-sm text-text-disabled border border-dashed border-border-subtle rounded-2xl">
 No trend data available.
 </div>
 )}
 </div>
 </CardContent>
 </Card>
 </motion.div>

 <motion.div variants={staggerItem} className="col-span-12 lg:col-span-4 flex flex-col">
 <Card className="flex-1 shadow-card rounded-xl bg-surface flex flex-col overflow-hidden">
 <CardHeader className="pb-2 pt-6 px-8">
 <CardTitle className="text-[15px] font-medium text-text-primary">Defect Distribution</CardTitle>
 </CardHeader>
 <CardContent className="px-5 pb-5 flex-1">
 <div className="h-64 w-full">
 {defectDistData.length > 0 ? (
 <ResponsiveContainer width="100%" height="100%">
 <BarChart data={defectDistData} layout="vertical" margin={{ top: 5, right: 30, left: 10, bottom: 5 }} barCategoryGap="20%">
 <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
 <XAxis type="number" hide />
 <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b', fontWeight: 700 }} width={80} />
 <RechartsTooltip 
 cursor={{fill: '#f8fafc'}}
 contentStyle={{ borderRadius: '6px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)', fontSize: '12px', fontWeight: '500' }} 
 />
 <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={16} animationDuration={800} name="Count">
 {defectDistData.map((entry, index) => (
 <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
 ))}
 </Bar>
 </BarChart>
 </ResponsiveContainer>
 ) : (
 <div className="w-full h-full flex items-center justify-center text-sm text-text-disabled border-2 border-dashed border-border-subtle rounded-lg">
 No defects recorded.
 </div>
 )}
 </div>
 </CardContent>
 </Card>
 </motion.div>
 </motion.div>

 {/* Activity Section */}
 <motion.div 
 variants={staggerContainer}
 initial="initial"
 animate="animate"
 className="grid grid-cols-12 gap-6 mt-2"
 >
 <motion.div variants={staggerItem} className="col-span-12 lg:col-span-4">
 <Card className="h-full shadow-card rounded-xl bg-surface overflow-hidden">
 <CardHeader className="pb-3 pt-6 px-8">
 <CardTitle className="text-[15px] font-medium text-text-primary">Recent Defects</CardTitle>
 </CardHeader>
 <CardContent className="p-0">
 <div className="flex flex-col divide-y divide-gray-50">
 {recentDefects.length > 0 ? recentDefects.map((h, i) => (
 <div 
 key={h.id} 
 onClick={() => setPreviewReport(h)}
 className="flex items-center justify-between group cursor-pointer hover:bg-surface-secondary/50 px-8 py-4 transition-colors rounded-2xl mx-2 mb-1"
 >
 <div className="flex items-center gap-4">
 <div className="w-10 h-10 bg-surface-secondary rounded-full flex items-center justify-center border border-border-subtle object-cover overflow-hidden shrink-0">
 {h.image_path ? (
 <img src={api.getImageUrl(h.image_path)} alt="defect" className="w-full h-full object-cover" onError={(e) => e.currentTarget.style.display = 'none'} />
 ) : (
 <AlertTriangle size={16} className="text-text-disabled" />
 )}
 </div>
 <div className="flex flex-col">
 <span className="font-semibold text-[14px] text-text-primary capitalize">{h.primary_defect}</span>
 <span className="text-[12px] text-text-disabled">INSP-{h.id}</span>
 </div>
 </div>
 <div className="flex items-center gap-4">
 <div className="flex items-center gap-2">
 <span className={`w-2 h-2 rounded-full ${h.severity === 'high' || h.severity === 'critical' ? 'bg-red-500' : h.severity === 'medium' ? 'bg-amber-500' : 'bg-green-500'}`}></span>
 <span className="text-[12px] font-medium text-text-secondary capitalize">{h.severity}</span>
 </div>
 <ChevronRight size={16} className="text-gray-300 group-hover:text-text-primary transition-colors" />
 </div>
 </div>
 )) : (
 <div className="py-10 text-center text-sm text-text-disabled">No defects found in history.</div>
 )}
 </div>
 </CardContent>
 </Card>
 </motion.div>

 <motion.div variants={staggerItem} className="col-span-12 lg:col-span-8">
 <Card className="h-full shadow-card rounded-xl bg-surface overflow-hidden">
 <CardHeader className="pb-3 pt-6 px-8">
 <CardTitle className="text-[15px] font-medium text-text-primary">Recent Inspection Log</CardTitle>
 </CardHeader>
 <CardContent className="p-0">
 <div className="overflow-x-auto px-4 pb-4">
 <table className="w-full text-left">
 <thead>
 <tr>
 <th className="px-4 py-3 text-[12px] font-medium text-text-disabled">ID</th>
 <th className="px-4 py-3 text-[12px] font-medium text-text-disabled">Primary Finding</th>
 <th className="px-4 py-3 text-[12px] font-medium text-text-disabled">Severity</th>
 <th className="px-4 py-3 text-[12px] font-medium text-text-disabled">Timestamp</th>
 <th className="px-4 py-3 text-[12px] font-medium text-text-disabled text-right">Action</th>
 </tr>
 </thead>
 <tbody className="bg-surface">
 {recentLog.length > 0 ? recentLog.map((h) => (
 <tr key={h.id} className="hover:bg-surface-secondary/50 transition-colors group border-b border-gray-50 last:">
 <td className="px-4 py-4 font-semibold text-[14px] text-text-primary">INSP-{h.id}</td>
 <td className="px-4 py-4 text-text-primary font-medium text-[14px] capitalize">{h.primary_defect}</td>
 <td className="px-4 py-4">
 <div className="flex items-center gap-2">
 <span className={`w-2 h-2 rounded-full ${h.severity === 'high' || h.severity === 'critical' ? 'bg-red-500' : h.severity === 'medium' ? 'bg-amber-500' : h.severity === 'none' ? 'bg-green-500' : 'bg-gray-400'}`}></span>
 <span className="text-[13px] font-medium text-text-secondary capitalize">{h.severity === 'none' ? 'Clean' : h.severity}</span>
 </div>
 </td>
 <td className="px-4 py-4 text-text-muted text-[13px]">
 {new Date(h.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
 </td>
 <td className="px-4 py-4 text-right">
 <Button 
 variant="ghost" 
 size="sm" 
 onClick={() => setPreviewReport(h)}
 className="rounded-full text-text-secondary hover:text-text-primary hover:bg-gray-100 h-8 text-[12px] px-4 font-semibold transition-all"
 >
 View Report
 </Button>
 </td>
 </tr>
 )) : (
 <tr>
 <td colSpan={5} className="px-4 py-12 text-center text-[14px] text-text-disabled">
 No inspections logged yet. Awaiting data.
 </td>
 </tr>
 )}
 </tbody>
 </table>
 </div>
 </CardContent>
 </Card>
 </motion.div>
 </motion.div>

 {/* PDF Viewer Modal */}
 {previewReport && createPortal(
 <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 md:p-8 animate-in fade-in duration-200">
 <div className="bg-surface rounded-xl shadow-2xl overflow-hidden w-full h-full max-w-[1400px] flex border border-border-subtle flex-col animate-in zoom-in-95 duration-300">
 
 {/* Modal Header */}
 <div className="px-6 py-4 border-b border-border-subtle flex justify-between items-center bg-surface-secondary">
 <div className="flex items-center gap-3">
 <div className="w-10 h-10 bg-red-100 text-red-600 rounded-lg flex items-center justify-center border border-red-200 shadow-sm">
 <FileOutput size={20} />
 </div>
 <div className="flex flex-col">
 <h3 className="font-bold text-text-primary text-base">AeroEdge_Inspection_{previewReport.id}.pdf</h3>
 <p className="text-[11px] text-text-muted font-bold uppercase tracking-wider mt-0.5">Inspection #{previewReport.id} • {new Date(previewReport.timestamp).toLocaleString()}</p>
 </div>
 </div>
 <div className="flex gap-3">
 <Button variant="outline" className="border-border-subtle shadow-sm font-semibold text-text-secondary" onClick={() => handleDownload(previewReport.id)}>
 <Download size={16} className="mr-2 text-text-muted" /> Download PDF
 </Button>
 <Button variant="ghost" size="icon" className="text-text-disabled hover:text-red-500 hover:bg-red-50 transition-colors" onClick={() => setPreviewReport(null)}>
 <X size={24} />
 </Button>
 </div>
 </div>

 {/* Modal Content */}
 <div className="flex flex-1 overflow-hidden bg-gray-100/50">
 
 {/* PDF Viewer */}
 <div className="flex-1 h-full p-6">
 <div className="w-full h-full bg-surface rounded-xl shadow-sm border border-border-subtle overflow-hidden flex flex-col">
 <iframe 
 src={`${api.getReportUrl(previewReport.id)}#toolbar=0&navpanes=0`} 
 title={`Report ${previewReport.id}`}
 className="w-full flex-1 bg-gray-100"
 />
 </div>
 </div>

 {/* Info Sidebar */}
 <div className="w-80 h-full border-l border-border-subtle bg-surface p-6 overflow-y-auto hidden md:flex flex-col gap-6">
 <h4 className="text-xs font-bold text-text-primary uppercase tracking-widest border-b border-border-subtle pb-2 flex items-center gap-2">
 <Activity size={14} className="text-brand"/> Report Details
 </h4>

 <div className="flex flex-col gap-4">
 <div>
 <span className="text-[10px] text-text-muted font-bold uppercase tracking-wider block mb-1">Status</span>
 <span className="flex items-center gap-1.5 text-sm font-semibold text-success"><CheckCircle2 size={14}/> Available</span>
 </div>
 
 <div>
 <span className="text-[10px] text-text-muted font-bold uppercase tracking-wider block mb-1">Primary Finding</span>
 <span className="text-sm font-bold text-text-primary capitalize">{previewReport.primary_defect || 'None'}</span>
 </div>
 
 <div>
 <span className="text-[10px] text-text-muted font-bold uppercase tracking-wider block mb-1">Severity</span>
 <Badge variant={previewReport.severity === 'high' || previewReport.severity === 'critical' ? 'destructive' : previewReport.severity === 'medium' ? 'warning' : 'success'} className="shadow-sm uppercase text-[10px]">
 {previewReport.severity}
 </Badge>
 </div>

 <div className="bg-surface-secondary rounded-lg p-3 border border-border-subtle">
 <span className="text-[10px] text-text-muted font-bold uppercase tracking-wider block mb-1">Maintenance Ref.</span>
 <span className="text-sm font-medium text-brand break-all">{previewReport.source ? previewReport.source.split('\\').pop() : 'None'}</span>
 {previewReport.page && <span className="text-xs font-semibold text-teal block mt-1">Page {previewReport.page}</span>}
 </div>
 </div>

 <div className="mt-auto pt-6 border-t border-border-subtle">
 <Button className="w-full bg-surface hover:bg-surface-secondary text-text-primary border border-border-subtle shadow-sm font-bold" onClick={() => navigate('/digital-twin')}>
 Open Inspection Record
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

// Subcomponents
function StatCard({ title, value, subValue, icon: Icon, trend, iconColor = "text-text-primary", trendColor = "text-text-disabled" }: any) {
 return (
 <div className={`bg-surface rounded-xl p-7 shadow-card flex flex-col justify-between hover:shadow-card-hover transition-all relative overflow-hidden group`}>
 <div className="flex justify-between items-start mb-6">
 <div className="flex items-center justify-center w-12 h-12 rounded-full bg-surface-secondary border border-border-subtle group-hover:scale-105 transition-transform">
 <Icon size={20} className={iconColor} strokeWidth={2} />
 </div>
 {trend && (
 <span className={`text-[13px] font-medium ${trendColor}`}>{trend}</span>
 )}
 </div>
 <div>
 <div className="text-[32px] font-medium text-text-primary leading-none tracking-tight mb-2">{value}</div>
 <div className="text-[14px] font-medium text-text-muted flex items-center gap-2">
 {title}
 {subValue && <span className="px-2 py-0.5 bg-gray-100 text-text-secondary rounded-full text-[11px] font-semibold">{subValue}</span>}
 </div>
 </div>
 </div>
 );
}
