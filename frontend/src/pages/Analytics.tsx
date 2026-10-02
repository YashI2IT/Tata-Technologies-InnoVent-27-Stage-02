import React, { useEffect, useState, useMemo, useRef } from "react";
import { 
 BarChart3, 
 AlertTriangle,
 Activity,
 Calendar,
 CheckCircle2,
 Clock,
 ChevronRight
} from "lucide-react";
import { 
 AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
 BarChart, Bar, PieChart, Pie, Cell, Legend
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { api, InspectionHistoryItem } from "@/services/api";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { staggerContainer, staggerItem } from "@/lib/motion";

const SEVERITY_COLORS: Record<string, string> = {
 high: '#ef4444', // red
 medium: '#f97316', // orange
 low: '#10b981', // green
 none: '#94a3b8' // gray
};

const CHART_COLORS = ['#0000B3', '#12C6B3', '#FF9C00', '#6366f1', '#64748b'];

// Custom Select Component for Professional UI
function CustomSelect({ value, onChange, options, label }: { value: string, onChange: (v: string) => void, options: {value: string, label: string}[], label: string }) {
 const [isOpen, setIsOpen] = useState(false);
 const containerRef = React.useRef<HTMLDivElement>(null);

 useEffect(() => {
 function handleClickOutside(event: MouseEvent) {
 if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
 setIsOpen(false);
 }
 }
 document.addEventListener("mousedown", handleClickOutside);
 return () => document.removeEventListener("mousedown", handleClickOutside);
 }, []);

 const selectedOption = options.find(o => o.value === value) || options[0];

 return (
 <div className="flex flex-col gap-2 w-48 relative" ref={containerRef}>
 <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest pl-1">{label}</label>
 <div 
 className={`w-full h-11 px-4 rounded-xl border text-sm font-semibold text-text-primary bg-surface cursor-pointer flex items-center justify-between transition-all shadow-sm
 ${isOpen ? 'border-brand ring-4 ring-[#0000B3]/10' : 'border-border-subtle hover:border-brand/30'}
 `}
 onClick={() => setIsOpen(!isOpen)}
 >
 <span className="truncate">{selectedOption.label}</span>
 <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`text-text-disabled transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}><polyline points="6 9 12 15 18 9"></polyline></svg>
 </div>

 {isOpen && (
 <div className="absolute top-[70px] left-0 w-full bg-surface border border-border-subtle rounded-xl shadow-lg z-50 overflow-hidden py-1 animate-in fade-in zoom-in-95 duration-100">
 <div className="max-h-[250px] overflow-y-auto">
 {options.map((option) => (
 <div 
 key={option.value}
 className={`px-4 py-2.5 text-sm cursor-pointer flex items-center justify-between transition-colors
 ${value === option.value ? 'bg-brand/5 text-brand font-bold' : 'text-text-secondary font-medium hover:bg-surface-secondary'}
 `}
 onClick={() => {
 onChange(option.value);
 setIsOpen(false);
 }}
 >
 <span className="truncate">{option.label}</span>
 {value === option.value && <CheckCircle2 size={14} className="text-brand" />}
 </div>
 ))}
 </div>
 </div>
 )}
 </div>
 );
}

export function Analytics() {
 const [history, setHistory] = useState<InspectionHistoryItem[]>([]);
 const [loading, setLoading] = useState(true);
 const [error, setError] = useState(false);
 const [lastFetched, setLastFetched] = useState<Date>(new Date());
 const navigate = useNavigate();

 // Filter State
 const [timeRange, setTimeRange] = useState<string>("all");
 const [severityFilter, setSeverityFilter] = useState<string>("all");
 const [defectFilter, setDefectFilter] = useState<string>("all");

 const fetchData = () => {
 setLoading(true);
 api.getHistory(500).then(data => {
 setHistory(data);
 setLastFetched(new Date());
 setLoading(false);
 setError(false);
 }).catch(err => {
 console.error(err);
 setError(true);
 setLoading(false);
 });
 };

 useEffect(() => {
 fetchData();
 }, []);

 // Compute available defects for filter dropdown
 const availableDefects = useMemo(() => {
 const defects = new Set<string>();
 history.forEach(h => {
 if (h.primary_defect && h.primary_defect !== 'none' && h.primary_defect.toLowerCase() !== 'no defects detected.') {
 defects.add(h.primary_defect.charAt(0).toUpperCase() + h.primary_defect.slice(1));
 }
 });
 return Array.from(defects).sort();
 }, [history]);

 // Dropdown Options
 const timeOptions = [
 { value: 'all', label: 'All Time' },
 { value: '7', label: 'Last 7 Days' },
 { value: '30', label: 'Last 30 Days' },
 { value: '90', label: 'Last 90 Days' }
 ];

 const severityOptions = [
 { value: 'all', label: 'All Severities' },
 { value: 'high', label: 'High' },
 { value: 'medium', label: 'Medium' },
 { value: 'low', label: 'Low' },
 { value: 'none', label: 'Clean / None' }
 ];

 const defectOptions = [
 { value: 'all', label: 'All Defects' },
 { value: 'None', label: 'None (Clean)' },
 ...availableDefects.map(d => ({ value: d, label: d }))
 ];

 // Apply Filters
 const filteredData = useMemo(() => {
 const now = new Date();
 return history.filter(item => {
 // Time Filter
 let matchesTime = true;
 if (timeRange !== "all") {
 const itemDate = new Date(item.timestamp);
 const daysDiff = (now.getTime() - itemDate.getTime()) / (1000 * 3600 * 24);
 if (timeRange === "7" && daysDiff > 7) matchesTime = false;
 if (timeRange === "30" && daysDiff > 30) matchesTime = false;
 if (timeRange === "90" && daysDiff > 90) matchesTime = false;
 }

 // Severity Filter
 const matchesSeverity = severityFilter === "all" || item.severity.toLowerCase() === severityFilter;

 // Defect Filter
 const itemDefect = item.primary_defect && item.primary_defect !== 'none' && item.primary_defect.toLowerCase() !== 'no defects detected.' 
 ? item.primary_defect.charAt(0).toUpperCase() + item.primary_defect.slice(1)
 : "None";
 const matchesDefect = defectFilter === "all" || itemDefect === defectFilter;

 return matchesTime && matchesSeverity && matchesDefect;
 });
 }, [history, timeRange, severityFilter, defectFilter]);

 // Derived Metrics from Filtered Data
 const totalInspections = filteredData.length;
 const defectFindings = filteredData.filter(h => h.primary_defect && h.primary_defect !== 'none' && h.primary_defect.toLowerCase() !== 'no defects detected.').length;
 const highSeverityFindings = filteredData.filter(h => h.severity === 'high').length;
 const cleanInspections = filteredData.filter(h => h.severity === 'none' || !h.primary_defect || h.primary_defect === 'none' || h.primary_defect.toLowerCase() === 'no defects detected.').length;

 // Chart 1: Activity over time
 const activityData = useMemo(() => {
 const map: Record<string, { inspections: number, defects: number }> = {};
 // Pre-fill last N days if we want a continuous chart, but for actual data we map available dates
 const dates = filteredData.map(h => new Date(h.timestamp));
 if (dates.length === 0) return [];
 
 // Sort oldest to newest
 const sortedData = [...filteredData].sort((a,b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
 
 sortedData.forEach(h => {
 const dateStr = new Date(h.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
 if (!map[dateStr]) map[dateStr] = { inspections: 0, defects: 0 };
 map[dateStr].inspections += 1;
 
 const hasDefect = h.primary_defect && h.primary_defect !== 'none' && h.primary_defect.toLowerCase() !== 'no defects detected.';
 if (hasDefect) map[dateStr].defects += 1;
 });
 
 return Object.entries(map).map(([date, counts]) => ({ 
 date, 
 Inspections: counts.inspections,
 'Defect Findings': counts.defects
 }));
 }, [filteredData]);

 // Chart 2: Top Defects
 const defectDistData = useMemo(() => {
 const count: Record<string, number> = {};
 filteredData.forEach(h => {
 if (h.primary_defect && h.primary_defect !== 'none' && h.primary_defect.toLowerCase() !== 'no defects detected.') {
 const type = h.primary_defect.charAt(0).toUpperCase() + h.primary_defect.slice(1);
 count[type] = (count[type] || 0) + 1;
 }
 });
 return Object.entries(count)
 .sort((a,b) => b[1] - a[1])
 .slice(0, 5)
 .map(([name, value]) => ({ name: name.length > 20 ? name.substring(0, 20) + '...' : name, value }));
 }, [filteredData]);

 // Chart 3: Severity Distribution
 const severityData = useMemo(() => {
 const count: Record<string, number> = { high: 0, medium: 0, low: 0, none: 0 };
 filteredData.forEach(h => {
 const s = h.severity?.toLowerCase() || 'none';
 if (count[s] !== undefined) {
 count[s] += 1;
 }
 });
 return Object.entries(count)
 .map(([name, value]) => ({
 name: name.charAt(0).toUpperCase() + name.slice(1),
 value,
 color: SEVERITY_COLORS[name]
 }))
 .filter(d => d.value > 0);
 }, [filteredData]);

 // Dynamic Insight Generation
 const dynamicInsight = useMemo(() => {
 if (totalInspections === 0) return "No inspections recorded in the selected period.";
 
 const parts = [];
 if (defectDistData.length > 0) {
 parts.push(`Most recorded findings are ${defectDistData[0].name.toUpperCase()} detections.`);
 } else {
 parts.push("Most inspections in this period were clean.");
 }

 if (highSeverityFindings > 0) {
 parts.push(`${highSeverityFindings} high-severity finding${highSeverityFindings > 1 ? 's require' : ' requires'} review.`);
 }

 return parts.join(" ");
 }, [totalInspections, defectDistData, highSeverityFindings]);

 // Navigation
 const handleOpenInspection = (id: number) => {
 navigate(`/digital-twin`);
 };

 return (
 <div className="flex flex-col gap-6 max-w-[1600px] mx-auto font-sans px-8 pt-8 pb-32">
 
 {/* Header Context */}
 <div className="flex items-center justify-between">
 <div>
 <div className="flex items-center gap-2 text-[11px] font-semibold text-text-disabled uppercase tracking-widest mb-3">
 <span>Home</span> <span className="text-gray-300">/</span> <span className="text-text-primary">Analytics</span>
 </div>
 <h1 className="text-3xl font-medium text-text-primary tracking-tight">Inspection Analytics</h1>
 <p className="text-sm font-medium text-text-muted mt-2">Inspection trends and defect patterns from recorded AeroEdge-X activity</p>
 </div>
 <div className="flex flex-col items-end gap-2">
 <Button variant="ghost" size="sm" onClick={fetchData} className="rounded-full h-9 px-4 border border-border-subtle shadow-sm text-text-secondary bg-surface hover:bg-surface-secondary">
 <Clock size={14} className="mr-2" /> Refresh Data
 </Button>
 <span className="text-[11px] font-bold tracking-widest uppercase text-text-disabled">Updated: {lastFetched.toLocaleTimeString()}</span>
 </div>
 </div>

 {/* Filter Bar */}
 <div className="bg-surface rounded-full px-6 py-4 shadow-card flex gap-6 items-center z-40 relative">
 <CustomSelect 
 label="Time Range"
 value={timeRange} 
 onChange={setTimeRange} 
 options={timeOptions} 
 />
 <CustomSelect 
 label="Severity"
 value={severityFilter} 
 onChange={setSeverityFilter} 
 options={severityOptions} 
 />
 <CustomSelect 
 label="Defect Category"
 value={defectFilter} 
 onChange={setDefectFilter} 
 options={defectOptions} 
 />
 
 {/* Insight Text */}
 <div className="flex-1 border-l border-border-subtle pl-6 ml-2 flex items-center">
 <div className="bg-blue-50 text-blue-600 px-4 py-2 rounded-full flex items-center gap-2 mr-4 shrink-0 shadow-sm border border-blue-100">
 <Activity size={16} />
 <span className="text-[11px] font-bold uppercase tracking-widest">Insight</span>
 </div>
 <p className="text-[14px] font-bold text-text-secondary leading-relaxed">{dynamicInsight}</p>
 </div>
 </div>

 {loading ? (
 <div className="p-12 text-center text-text-muted font-semibold bg-surface-secondary/50 rounded-xl border border-dashed border-border-subtle">
 Loading analytics...
 </div>
 ) : error ? (
 <div className="p-12 text-center text-danger font-semibold bg-danger-light/20 rounded-xl border border-danger-light">
 Failed to load analytics from database.
 </div>
 ) : filteredData.length === 0 ? (
 <div className="p-16 text-center text-text-muted font-semibold bg-surface-secondary/50 rounded-xl border border-dashed border-border-subtle flex flex-col items-center">
 <Activity size={48} className="text-gray-300 mb-4" />
 <p className="text-text-primary text-lg">No matching inspection records</p>
 <p className="text-sm font-normal mt-1 text-text-muted">
 Adjust your filters or complete a new inspection to populate analytics.
 </p>
 </div>
 ) : (
 <>
 {/* KPI Strip */}
 <motion.div 
 variants={staggerContainer}
 initial="initial"
 animate="animate"
 className="grid grid-cols-4 gap-6"
 >
 <motion.div variants={staggerItem}>
 <Card className="shadow-card rounded-xl bg-surface transition-all hover:shadow-card-hover hover:-translate-y-1 h-full">
 <CardContent className="p-8 flex items-center gap-5">
 <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center shrink-0 border border-blue-100">
 <BarChart3 size={24} />
 </div>
 <div className="flex flex-col">
 <span className="text-[11px] font-semibold text-text-disabled uppercase tracking-widest mb-1">Total Inspections</span>
 <span className="text-4xl font-bold text-text-primary leading-none">{totalInspections}</span>
 </div>
 </CardContent>
 </Card>
 </motion.div>
 <motion.div variants={staggerItem}>
 <Card className="shadow-card rounded-xl bg-surface transition-all hover:shadow-card-hover hover:-translate-y-1 h-full">
 <CardContent className="p-8 flex items-center gap-5">
 <div className="w-14 h-14 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center shrink-0 border border-amber-100">
 <AlertTriangle size={24} />
 </div>
 <div className="flex flex-col">
 <span className="text-[11px] font-semibold text-text-disabled uppercase tracking-widest mb-1">Defect Findings</span>
 <span className="text-4xl font-bold text-text-primary leading-none">{defectFindings}</span>
 </div>
 </CardContent>
 </Card>
 </motion.div>
 <motion.div variants={staggerItem}>
 <Card className="shadow-card rounded-xl bg-surface transition-all hover:shadow-card-hover hover:-translate-y-1 h-full">
 <CardContent className="p-8 flex items-center gap-5">
 <div className="w-14 h-14 bg-red-50 text-red-500 rounded-full flex items-center justify-center shrink-0 border border-red-100">
 <AlertTriangle size={24} />
 </div>
 <div className="flex flex-col">
 <span className="text-[11px] font-semibold text-red-400 uppercase tracking-widest mb-1">High-Severity</span>
 <span className="text-4xl font-bold text-red-500 leading-none">{highSeverityFindings}</span>
 </div>
 </CardContent>
 </Card>
 </motion.div>
 <motion.div variants={staggerItem}>
 <Card className="shadow-card rounded-xl bg-surface transition-all hover:shadow-card-hover hover:-translate-y-1 h-full">
 <CardContent className="p-8 flex items-center gap-5">
 <div className="w-14 h-14 bg-green-50 text-green-500 rounded-full flex items-center justify-center shrink-0 border border-green-100">
 <CheckCircle2 size={24} />
 </div>
 <div className="flex flex-col">
 <span className="text-[11px] font-semibold text-green-500 uppercase tracking-widest mb-1">Clean Inspections</span>
 <span className="text-4xl font-bold text-green-500 leading-none">{cleanInspections}</span>
 </div>
 </CardContent>
 </Card>
 </motion.div>
 </motion.div>

 {/* Charts Row 1 */}
 <motion.div 
 variants={staggerContainer}
 initial="initial"
 animate="animate"
 className="grid grid-cols-12 gap-8 mt-4"
 >
 <motion.div variants={staggerItem} className="col-span-8">
 <Card className="shadow-card rounded-xl bg-surface h-full">
 <CardHeader className="pb-4 pt-6 px-8 border-b border-gray-50 bg-surface">
 <CardTitle className="text-[13px] font-bold text-text-primary uppercase tracking-widest">Inspection Activity</CardTitle>
 </CardHeader>
 <CardContent className="pt-8 px-8 pb-8">
 <div className="h-[320px] w-full">
 {activityData.length > 0 ? (
 <ResponsiveContainer width="100%" height="100%">
 <AreaChart data={activityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
 <defs>
 <linearGradient id="colorInspections" x1="0" y1="0" x2="0" y2="1">
 <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
 <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
 </linearGradient>
 <linearGradient id="colorDefects" x1="0" y1="0" x2="0" y2="1">
 <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.2}/>
 <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
 </linearGradient>
 </defs>
 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f8fafc" />
 <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8', fontWeight: 600 }} dy={10} minTickGap={20} />
 <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8', fontWeight: 600 }} allowDecimals={false} />
 <Tooltip 
 contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 40px -10px rgb(0 0 0 / 0.1)' }}
 itemStyle={{ fontWeight: 700, fontSize: '14px' }}
 />
 <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '13px', fontWeight: 700 }} />
 <Area type="monotone" dataKey="Inspections" stroke="#3b82f6" strokeWidth={4} fillOpacity={1} fill="url(#colorInspections)" activeDot={{ r: 8, strokeWidth: 0, fill: '#3b82f6' }} />
 <Area type="monotone" dataKey="Defect Findings" stroke="#f59e0b" strokeWidth={4} fillOpacity={1} fill="url(#colorDefects)" activeDot={{ r: 8, strokeWidth: 0, fill: '#f59e0b' }} />
 </AreaChart>
 </ResponsiveContainer>
 ) : (
 <div className="flex h-full items-center justify-center text-sm font-bold text-text-disabled">Not enough data to graph timeline.</div>
 )}
 </div>
 </CardContent>
 </Card>
 </motion.div>

 <motion.div variants={staggerItem} className="col-span-4">
 <Card className="shadow-card rounded-xl bg-surface h-full">
 <CardHeader className="pb-4 pt-6 px-8 border-b border-gray-50 bg-surface">
 <CardTitle className="text-[13px] font-bold text-text-primary uppercase tracking-widest">Severity Distribution</CardTitle>
 </CardHeader>
 <CardContent className="flex items-center justify-center relative pt-8 pb-8 px-8">
 <div className="h-[320px] w-full">
 {severityData.length > 0 ? (
 <ResponsiveContainer width="100%" height="100%">
 <PieChart>
 <Pie data={severityData} innerRadius={90} outerRadius={125} paddingAngle={6} dataKey="value" stroke="none">
 {severityData.map((entry, index) => (
 <Cell key={`cell-${index}`} fill={entry.color} />
 ))}
 </Pie>
 <Tooltip 
 contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 40px -10px rgb(0 0 0 / 0.1)' }} 
 itemStyle={{ fontWeight: 700, fontSize: '14px', color: '#0F172A' }}
 />
 <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '13px', fontWeight: 700 }} />
 </PieChart>
 </ResponsiveContainer>
 ) : (
 <div className="flex h-full items-center justify-center text-sm font-bold text-text-disabled">No defect severity data</div>
 )}
 </div>
 {severityData.length > 0 && (
 <div className="absolute top-[160px] flex flex-col items-center justify-center text-center pointer-events-none">
 <span className="text-4xl font-bold text-text-primary">{totalInspections}</span>
 <span className="text-[11px] text-text-disabled font-semibold uppercase tracking-widest mt-1">Total</span>
 </div>
 )}
 </CardContent>
 </Card>
 </motion.div>
 </motion.div>

 {/* Charts Row 2 */}
 <motion.div 
 variants={staggerContainer}
 initial="initial"
 animate="animate"
 className="grid grid-cols-12 gap-8 mt-4"
 >
 <motion.div variants={staggerItem} className="col-span-5">
 <Card className="shadow-card rounded-xl bg-surface h-full">
 <CardHeader className="pb-4 pt-6 px-8 border-b border-gray-50 bg-surface">
 <CardTitle className="text-[13px] font-bold text-text-primary uppercase tracking-widest">Top Defect Types</CardTitle>
 </CardHeader>
 <CardContent className="pt-8 px-8 pb-8">
 <div className="h-[320px] w-full">
 {defectDistData.length > 0 ? (
 <ResponsiveContainer width="100%" height="100%">
 <BarChart data={defectDistData} layout="vertical" margin={{ top: 0, right: 30, left: 20, bottom: 0 }}>
 <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f8fafc" />
 <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8', fontWeight: 600 }} allowDecimals={false} />
 <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b', fontWeight: 700 }} width={90} />
 <Tooltip 
 cursor={{fill: '#f8fafc'}} 
 contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 40px -10px rgb(0 0 0 / 0.1)' }} 
 itemStyle={{ fontWeight: 700, fontSize: '14px' }}
 />
 <Bar dataKey="value" name="Count" fill="#3b82f6" radius={[0, 8, 8, 0]} barSize={32}>
 {defectDistData.map((entry, index) => (
 <Cell 
 key={`cell-${index}`} 
 fill={CHART_COLORS[index % CHART_COLORS.length]} 
 style={{ cursor: 'pointer' }}
 onClick={() => setDefectFilter(entry.name)}
 />
 ))}
 </Bar>
 </BarChart>
 </ResponsiveContainer>
 ) : (
 <div className="flex h-full items-center justify-center text-sm font-bold text-text-disabled">No defect data available</div>
 )}
 </div>
 </CardContent>
 </Card>
 </motion.div>

 <motion.div variants={staggerItem} className="col-span-3">
 <Card className="shadow-card rounded-xl bg-surface flex flex-col h-full">
 <CardHeader className="pb-4 pt-6 px-8 border-b border-gray-50 bg-surface">
 <CardTitle className="text-[13px] font-bold text-text-primary uppercase tracking-widest">Recent Activity</CardTitle>
 </CardHeader>
 <CardContent className="p-0 flex-1 overflow-hidden relative">
 <div className="absolute inset-0 overflow-y-auto pt-2">
 <div className="flex flex-col px-4 pb-4">
 {filteredData.slice(0, 10).map((item) => (
 <div 
 key={item.id} 
 className="flex flex-col px-4 py-3 hover:bg-surface-secondary transition-colors cursor-pointer group rounded-2xl mb-1"
 onClick={() => handleOpenInspection(item.id)}
 >
 <div className="flex items-center justify-between mb-1.5">
 <span className="font-bold text-[14px] text-text-primary group-hover:text-blue-600 transition-colors">Inspection #{item.id}</span>
 <span className="text-[11px] font-semibold text-text-disabled">{new Date(item.timestamp).toLocaleDateString()}</span>
 </div>
 <div className="flex items-center justify-between">
 <span className="text-[13px] font-bold text-text-secondary capitalize truncate" title={item.primary_defect || 'None'}>
 {item.primary_defect || 'None'}
 </span>
 {item.severity !== 'none' && (
 <div className="flex items-center gap-1.5">
 <span className={`w-2 h-2 rounded-full ${item.severity === 'high' ? 'bg-red-500' : item.severity === 'medium' ? 'bg-amber-500' : 'bg-green-500'}`}></span>
 <span className="text-[11px] font-bold text-text-muted capitalize">{item.severity}</span>
 </div>
 )}
 </div>
 </div>
 ))}
 {filteredData.length === 0 && (
 <div className="p-8 text-center text-sm text-text-muted font-bold">No recent activity</div>
 )}
 </div>
 </div>
 </CardContent>
 </Card>
 </motion.div>

 <motion.div variants={staggerItem} className="col-span-4">
 <Card className="shadow-card rounded-xl flex flex-col bg-red-50 h-full">
 <CardHeader className="pb-4 pt-6 px-8 border-b border-red-100 bg-red-50">
 <CardTitle className="text-[13px] font-bold text-red-600 uppercase tracking-widest flex items-center gap-2">
 <AlertTriangle size={18} /> Attention Required
 </CardTitle>
 </CardHeader>
 <CardContent className="p-0 flex-1 overflow-hidden relative">
 <div className="absolute inset-0 overflow-y-auto pt-2">
 <div className="flex flex-col px-4 pb-4">
 {filteredData.filter(h => h.severity === 'high').slice(0, 10).map((item) => (
 <div 
 key={item.id} 
 className="flex items-center justify-between px-4 py-3 hover:bg-surface transition-colors cursor-pointer group rounded-2xl mb-1 shadow-sm border border-transparent hover:border-red-100"
 onClick={() => handleOpenInspection(item.id)}
 >
 <div className="flex items-center gap-4">
 <div className="w-10 h-10 rounded-full bg-red-100 text-red-500 flex items-center justify-center shrink-0">
 <AlertTriangle size={16} />
 </div>
 <div className="flex flex-col">
 <span className="font-bold text-[14px] text-text-primary">Inspection #{item.id}</span>
 <span className="text-[11px] font-semibold text-text-muted mt-0.5">{new Date(item.timestamp).toLocaleDateString()}</span>
 </div>
 </div>
 <div className="flex items-center gap-3">
 <div className="flex flex-col text-right">
 <span className="text-[13px] font-bold text-text-primary capitalize">{item.primary_defect}</span>
 <span className="text-[10px] text-red-500 font-bold uppercase tracking-wider mt-0.5">High Severity</span>
 </div>
 <ChevronRight size={18} className="text-text-disabled group-hover:text-red-500 transition-colors" />
 </div>
 </div>
 ))}
 {filteredData.filter(h => h.severity === 'high').length === 0 && (
 <div className="p-10 text-center flex flex-col items-center justify-center h-full">
 <CheckCircle2 size={36} className="text-green-500 mb-4" />
 <span className="text-[16px] font-bold text-text-primary">No High-Severity Findings</span>
 <span className="text-[13px] text-text-muted mt-1 font-medium max-w-[80%]">Nothing in the current dataset requires high-severity attention.</span>
 </div>
 )}
 </div>
 </div>
 </CardContent>
 </Card>
 </motion.div>
 </motion.div>
 </>
 )}

 </div>
 );
}
