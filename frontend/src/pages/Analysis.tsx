import { useNavigate } from "react-router-dom";
import { ArrowRight, Maximize, ZoomIn, ZoomOut, CheckCircle2, ChevronRight, Scan, AlertTriangle, Layers, Info } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useInspection } from "@/hooks/useInspection";
import { api } from "@/services/api";

export function Analysis() {
 const { currentAnalysis } = useInspection();
 const navigate = useNavigate();

 if (!currentAnalysis) {
 return (
 <div className="flex flex-col items-center justify-center h-full gap-4 max-w-[1440px] mx-auto px-6 py-8">
 <AlertTriangle size={48} className="text-[#FF9C00]" />
 <h2 className="text-2xl font-bold text-text-primary">No Analysis Session Found</h2>
 <p className="text-text-muted font-medium text-sm text-center max-w-md">The inspection workspace requires an active image analysis session. Please return to the setup phase and upload an aircraft image.</p>
 <Button onClick={() => navigate("/inspection")} className="mt-4 bg-brand hover:bg-[#000080] text-white">Return to Setup</Button>
 </div>
 );
 }

 const { vision } = currentAnalysis;
 const isDefect = vision.status === 'defect_found';
 const confidence = isDefect ? Math.round(vision.detections[0].confidence * 100) : 0;
 const severity = isDefect ? vision.detections[0].severity : 'none';

 return (
 <div className="flex flex-col min-h-screen font-sans max-w-[1440px] mx-auto px-6 pt-8 pb-32 animate-in fade-in slide-in-from-bottom-4 duration-500">
 
 {/* Header Context */}
 <div className="flex items-center justify-between mb-6">
 <div>
 <div className="flex items-center gap-2 text-xs font-semibold text-text-muted uppercase tracking-widest mb-2">
 <span>Home</span> <ChevronRight size={14} /> <span>Inspection</span> <ChevronRight size={14} /> <span className="text-brand">AI Analysis</span>
 </div>
 <h1 className="text-[30px] font-bold text-text-primary tracking-tight">AI Analysis Result</h1>
 <p className="text-sm font-medium text-text-muted mt-1">Review AI-detected defects and bounding box coordinates</p>
 </div>
 <Button onClick={() => navigate("/manuals")} className="flex items-center gap-2 px-8 h-10 bg-brand hover:bg-[#000080] text-white font-bold tracking-wide shadow-sm">
 Proceed to Manuals <ArrowRight size={16} />
 </Button>
 </div>

 {/* Stepper */}
 <div className="flex items-center justify-between border-b border-border-subtle pb-4 mb-8 relative">
 <div className="absolute bottom-[-1px] left-1/4 w-1/4 border-b-2 border-[#12C6B3] z-10 transition-all"></div>
 
 <div className="flex items-center gap-3 text-text-disabled font-semibold cursor-pointer hover:text-text-secondary transition-colors" onClick={() => navigate('/inspection')}>
 <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-xs">01</div>
 <span className="text-sm tracking-wide">Setup</span>
 </div>
 <div className="flex items-center gap-3 text-teal font-bold">
 <div className="w-7 h-7 rounded-full bg-teal/10 text-teal border border-[#12C6B3]/30 flex items-center justify-center text-xs">02</div>
 <span className="text-sm tracking-wide">AI Analysis</span>
 </div>
 <div className="flex items-center gap-3 text-text-disabled font-semibold">
 <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-xs">03</div>
 <span className="text-sm tracking-wide">RAG & Reasoning</span>
 </div>
 <div className="flex items-center gap-3 text-text-disabled font-semibold">
 <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-xs">04</div>
 <span className="text-sm tracking-wide">Report & Sync</span>
 </div>
 </div>

 {/* Workspace Split */}
 <div className="grid grid-cols-12 gap-8 mb-8">
 
 {/* LEFT: IMAGE VIEWER */}
 <div className="col-span-12 lg:col-span-8 flex flex-col h-[550px]">
 <div className="bg-gray-900 rounded-xl overflow-hidden relative border border-border-subtle h-full flex flex-col group shadow-sm">
 <div className="absolute top-4 left-4 bg-gray-900/80 backdrop-blur-md border border-gray-700/50 rounded-lg p-1 flex gap-1 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
 <button className="p-2 hover:bg-gray-800 rounded text-gray-300 hover:text-white transition-colors" title="Zoom In"><ZoomIn size={16} /></button>
 <button className="p-2 hover:bg-gray-800 rounded text-gray-300 hover:text-white transition-colors" title="Zoom Out"><ZoomOut size={16} /></button>
 <button className="p-2 hover:bg-gray-800 rounded text-gray-300 hover:text-white transition-colors" title="Fit to Screen"><Maximize size={16} /></button>
 </div>
 <img 
 src={api.getImageUrl(vision.annotated_image || vision.image)} 
 alt="Annotated Inspection Result" 
 className="w-full h-full object-contain bg-black/20" 
 />
 </div>
 </div>

 {/* RIGHT: DETECTION SUMMARY */}
 <div className="col-span-12 lg:col-span-4 flex flex-col gap-6">
 <Card className="border-border-subtle shadow-sm rounded-xl">
 <CardHeader className="bg-surface-secondary/50 border-b border-border-subtle pb-3 pt-4 px-5">
 <CardTitle className="text-[11px] font-bold text-text-muted uppercase tracking-widest flex items-center gap-2">
 <Scan size={14}/> Detection Summary
 </CardTitle>
 </CardHeader>
 <CardContent className="p-6">
 <div className="flex justify-between items-start mb-8">
 <div className="flex flex-col">
 <span className="text-[11px] font-bold text-text-disabled uppercase tracking-widest mb-1">Primary Finding</span>
 <Badge variant={severity === 'high' ? 'destructive' : severity === 'medium' ? 'warning' : 'success'} className="px-3 py-1.5 text-[13px] font-bold uppercase tracking-wider w-fit">
 {isDefect ? vision.primary_defect : 'No Defects Detected'}
 </Badge>
 </div>
 {isDefect && (
 <div className="flex flex-col items-end">
 <span className="text-[11px] font-bold text-text-disabled uppercase tracking-widest mb-1">Max Confidence</span>
 <span className="text-3xl font-bold text-brand leading-none">{confidence}%</span>
 </div>
 )}
 </div>

 <div className="space-y-4 pt-5 border-t border-border-subtle">
 <div className="flex justify-between items-center">
 <span className="text-[12px] font-bold text-text-muted uppercase tracking-wider">Severity Layer</span>
 <span className="text-[13px] font-bold text-text-primary uppercase">{severity}</span>
 </div>
 <div className="flex justify-between items-center">
 <span className="text-[12px] font-bold text-text-muted uppercase tracking-wider">Detection Count</span>
 <span className="text-[13px] font-bold text-text-primary">{vision.total_detections}</span>
 </div>
 <div className="flex justify-between items-center">
 <span className="text-[12px] font-bold text-text-muted uppercase tracking-wider">Model Variant</span>
 <span className="text-[13px] font-bold text-teal bg-teal/10 px-2 py-0.5 rounded">YOLOv11-Nano</span>
 </div>
 <div className="flex justify-between items-center">
 <span className="text-[12px] font-bold text-text-muted uppercase tracking-wider">Inference Status</span>
 <span className="text-[13px] font-bold text-green-600 flex items-center gap-1.5"><CheckCircle2 size={14}/> Completed</span>
 </div>
 </div>
 </CardContent>
 </Card>

 <Card className="border-border-subtle shadow-sm rounded-xl">
 <CardHeader className="bg-surface-secondary/50 border-b border-border-subtle pb-3 pt-4 px-5">
 <CardTitle className="text-[11px] font-bold text-text-muted uppercase tracking-widest flex items-center gap-2">
 <Info size={14}/> Image Source Metadata
 </CardTitle>
 </CardHeader>
 <CardContent className="p-5 space-y-4">
 <div className="flex justify-between items-center">
 <span className="text-[11px] font-bold text-text-muted uppercase tracking-wider">File Origin</span>
 <span className="text-[12px] font-semibold text-text-primary truncate max-w-[150px]">{vision.image.split('/').pop() || vision.image}</span>
 </div>
 <div className="flex justify-between items-center">
 <span className="text-[11px] font-bold text-text-muted uppercase tracking-wider">Timestamp</span>
 <span className="text-[12px] font-semibold text-text-primary">{new Date(vision.timestamp).toLocaleString()}</span>
 </div>
 <div className="flex justify-between items-center">
 <span className="text-[11px] font-bold text-text-muted uppercase tracking-wider">Acquisition Mode</span>
 <span className="text-[12px] font-semibold text-text-primary">Upload (Offline)</span>
 </div>
 </CardContent>
 </Card>
 </div>
 </div>

 {/* DETECTION TABLE */}
 <Card className="border-border-subtle shadow-sm rounded-xl overflow-hidden">
 <CardHeader className="bg-surface-secondary/50 border-b border-border-subtle pb-3 pt-4 px-5">
 <CardTitle className="text-[11px] font-bold text-text-muted uppercase tracking-widest flex items-center gap-2">
 <Layers size={14}/> Raw Detection Coordinates
 </CardTitle>
 </CardHeader>
 <CardContent className="p-0">
 <div className="overflow-x-auto">
 <table className="w-full text-left">
 <thead className="bg-surface-secondary border-b border-border-subtle">
 <tr>
 <th className="px-6 py-3 text-[10px] font-bold text-text-muted uppercase tracking-wider">#</th>
 <th className="px-6 py-3 text-[10px] font-bold text-text-muted uppercase tracking-wider">Defect Class</th>
 <th className="px-6 py-3 text-[10px] font-bold text-text-muted uppercase tracking-wider">Confidence</th>
 <th className="px-6 py-3 text-[10px] font-bold text-text-muted uppercase tracking-wider">Bounding Box (x, y, w, h)</th>
 <th className="px-6 py-3 text-[10px] font-bold text-text-muted uppercase tracking-wider">Assigned Severity</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-gray-100">
 {vision.detections.map((d, i) => (
 <tr key={i} className="hover:bg-surface-secondary/50 transition-colors">
 <td className="px-6 py-3.5 text-[13px] font-bold text-text-disabled">{String(i + 1).padStart(2, '0')}</td>
 <td className="px-6 py-3.5 text-[13px] font-bold uppercase text-text-primary">{d.defect_type}</td>
 <td className="px-6 py-3.5 text-[13px] font-semibold text-brand">{(d.confidence * 100).toFixed(1)}%</td>
 <td className="px-6 py-3.5 text-[12px] font-mono text-text-secondary bg-surface-secondary/50 px-2 rounded">
 [{d.location.x_center.toFixed(3)}, {d.location.y_center.toFixed(3)}, {d.location.width.toFixed(3)}, {d.location.height.toFixed(3)}]
 </td>
 <td className="px-6 py-3.5">
 <Badge variant={d.severity === 'high' ? 'destructive' : d.severity === 'medium' ? 'warning' : 'success'} className="text-[10px] font-bold px-2 py-0.5 tracking-wide">
 {d.severity.toUpperCase()}
 </Badge>
 </td>
 </tr>
 ))}
 {vision.detections.length === 0 && (
 <tr>
 <td colSpan={5} className="px-6 py-12 text-center text-[13px] font-medium text-text-disabled">No structural anomalies detected within the specified confidence threshold.</td>
 </tr>
 )}
 </tbody>
 </table>
 </div>
 </CardContent>
 </Card>
 </div>
 );
}
