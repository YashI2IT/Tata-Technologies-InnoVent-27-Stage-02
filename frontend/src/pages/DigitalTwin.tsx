import { useEffect, useState, useRef } from "react";
import { History, FileText, Download, Target, Calendar, AlertTriangle, Search, ImageIcon, Maximize, FileOutput, ArrowDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { api, InspectionHistoryItem } from "@/services/api";
import { AircraftModel, AircraftModelRef } from "@/components/3d/AircraftModel";
import { motion, AnimatePresence } from "framer-motion";
import { staggerContainer, staggerItem, popIn, slideDownPop } from "@/lib/motion";

export function DigitalTwin() {
 const [history, setHistory] = useState<InspectionHistoryItem[]>([]);
 const [selected, setSelected] = useState<InspectionHistoryItem | null>(null);
 const [isImageModalOpen, setIsImageModalOpen] = useState(false);
 const cameraRef = useRef<AircraftModelRef | null>(null);

 useEffect(() => {
 api.getHistory(20).then(data => {
 setHistory(data);
 if (data.length > 0) setSelected(data[0]);
 }).catch(console.error);
 }, []);

 const handleSelect = (item: InspectionHistoryItem) => {
 setSelected(item);
 if (cameraRef.current) {
 cameraRef.current.resetView();
 }
 };

 return (
 <div className="flex flex-col min-h-screen font-sans max-w-[1600px] mx-auto px-8 pt-8 pb-32">
 
 {/* Header Context */}
 <div className="mb-8 flex items-center justify-between">
 <div>
 <div className="flex items-center gap-2 text-[11px] font-semibold text-text-disabled uppercase tracking-widest mb-3">
 <span>Home</span> <span className="text-gray-300">/</span> <span className="text-text-primary">Digital Twin</span>
 </div>
 <h1 className="text-3xl font-medium text-text-primary tracking-tight">Aircraft Digital Twin</h1>
 <p className="text-sm font-medium text-text-muted mt-2">Local aircraft and inspection-state representation</p>
 </div>
 
 <div className="flex items-center gap-4">
 <div className="bg-surface text-text-secondary px-5 py-2.5 rounded-full flex items-center gap-3 border border-border-subtle shadow-sm">
 <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
 <span className="text-[12px] font-bold tracking-wide uppercase">Local State Saved</span>
 </div>
 </div>
 </div>

 <motion.div 
 variants={staggerContainer}
 initial="initial"
 animate="animate"
 className="grid grid-cols-12 gap-8 items-start"
 >
 {/* Left Column: 3D Visualization and Metadata (65%) */}
 <motion.div variants={staggerItem} className="col-span-8 flex flex-col gap-6">
 
 {/* Viewer Container */}
 <Card className="relative overflow-hidden rounded-xl shadow-card flex flex-col bg-surface">
 
 {/* Header */}
 <div className="flex justify-between items-center p-6 px-8 border-b border-gray-50">
 <div>
 <h3 className="text-[15px] font-medium text-text-primary flex items-center gap-2">
 <Target size={18} />
 INSPECTION EVIDENCE
 </h3>
 <p className="text-[13px] text-text-muted mt-1 font-medium leading-none">Visual record of the detected defect</p>
 </div>
 {selected?.image_path && (
 <Button variant="ghost" size="sm" className="text-xs font-semibold shadow-sm border border-border-subtle rounded-full px-4 h-8" onClick={() => setIsImageModalOpen(true)}>
 <Maximize size={14} className="mr-1.5" /> Fullscreen
 </Button>
 )}
 </div>

 {/* Main Viewer Canvas */}
 <div className="w-full flex items-center justify-center p-6 bg-surface-secondary/30">
 {selected?.image_path ? (
 <img 
 src={api.getImageUrl(selected.annotated_image || selected.image_path)} 
 alt={`Inspection ${selected.id}`} 
 className="w-full max-h-[400px] object-contain rounded-md drop-shadow-sm transition-transform duration-300" 
 />
 ) : (
 <div className="flex flex-col items-center justify-center text-text-disabled gap-4 py-20">
 <ImageIcon size={48} className="opacity-20" />
 <p className="font-semibold text-sm">No image evidence available for this record.</p>
 </div>
 )}
 </div>

 {/* Current Inspection Info (Bottom) */}
 {selected && (
 <div className="bg-surface border-t border-gray-50 p-6 px-8 flex justify-between items-center">
 <div className="flex gap-8 items-center">
 <div>
 <p className="text-[11px] font-semibold text-text-disabled uppercase tracking-widest">Current</p>
 <p className="text-lg font-bold text-text-primary mt-0.5">#{selected.id}</p>
 </div>
 <div className="w-px h-10 bg-gray-100"></div>
 <div>
 <p className="text-[11px] font-semibold text-text-disabled uppercase tracking-widest">Primary Defect</p>
 <p className="font-bold text-text-primary capitalize mt-0.5">{selected.primary_defect || 'None'}</p>
 </div>
 <div className="w-px h-10 bg-gray-100"></div>
 <div>
 <p className="text-[11px] font-semibold text-text-disabled uppercase tracking-widest">Severity</p>
 <div className="flex items-center gap-2 mt-1">
 <span className={`w-2.5 h-2.5 rounded-full ${selected.severity === 'high' ? 'bg-red-500' : selected.severity === 'medium' ? 'bg-amber-500' : 'bg-green-500'}`}></span>
 <span className="text-[13px] font-bold text-text-secondary capitalize">{selected.severity}</span>
 </div>
 </div>
 <div className="w-px h-10 bg-gray-100"></div>
 <div>
 <p className="text-[11px] font-semibold text-text-disabled uppercase tracking-widest">Timestamp</p>
 <p className="font-semibold text-text-secondary text-[13px] mt-1">{new Date(selected.timestamp).toLocaleString().replace(',', '')}</p>
 </div>
 </div>

 <a href={api.getReportUrl(selected.id)} target="_blank" rel="noreferrer">
 <Button 
 variant="default" 
 className="bg-primary hover:bg-primary-dark text-white rounded-full shadow-md font-semibold text-sm h-11 px-6 flex items-center gap-2"
 >
 <FileOutput size={16} /> Open Formal Report
 </Button>
 </a>
 </div>
 )}
 </Card>

 {/* Reference and Actions Row */}
 {selected && (
 <div className="grid grid-cols-2 gap-6">
 <Card className="shadow-card rounded-xl bg-surface">
 <CardHeader className="pb-3 border-b border-gray-50 bg-surface p-6 px-8">
 <CardTitle className="text-[15px] font-medium text-text-primary flex items-center gap-2">
 <FileText size={18} /> Maintenance Reference
 </CardTitle>
 </CardHeader>
 <CardContent className="pt-6 pb-8 px-8 flex flex-col gap-4">
 <div className="flex flex-col">
 <span className="text-[11px] font-semibold text-text-disabled uppercase tracking-widest mb-1.5">Source Manual</span>
 <span className="text-[14px] font-bold text-text-primary">{selected.source ? selected.source.split('\\').pop() : 'N/A'}</span>
 </div>
 <div className="flex flex-col">
 <span className="text-[11px] font-semibold text-text-disabled uppercase tracking-widest mb-1.5">Page Reference</span>
 <span className="text-[14px] font-bold text-text-secondary">{selected.page ? `Page ${selected.page}` : 'N/A'}</span>
 </div>
 </CardContent>
 </Card>

 <Card className="shadow-card rounded-xl bg-surface flex flex-col justify-center">
 <CardContent className="p-8 flex gap-4 items-center justify-center">
 <a href={api.getReportUrl(selected.id)} target="_blank" rel="noreferrer" className="w-full">
 <Button variant="ghost" className="w-full h-14 border border-border-subtle hover:bg-surface-secondary flex gap-2 font-bold transition-all shadow-sm rounded-full text-text-secondary">
 <FileOutput size={18} /> Download Formal PDF Report
 </Button>
 </a>
 </CardContent>
 </Card>
 </div>
 )}
 </motion.div>

 {/* Right Column: Timeline (35%) */}
 <motion.div variants={staggerItem} className="col-span-4 flex flex-col h-[calc(100vh-200px)] min-h-[500px] max-h-[800px] sticky top-8">
 <Card className="h-full shadow-card rounded-xl bg-surface flex flex-col overflow-hidden">
 <CardHeader className="border-b border-gray-50 bg-surface pb-6 pt-6 px-8">
 <CardTitle className="text-[15px] font-medium text-text-primary flex items-center gap-2">
 <History size={18} /> Inspection Timeline
 </CardTitle>
 <CardDescription className="text-[13px] mt-1 font-medium">
 Chronological history of local digital twin updates
 </CardDescription>
 </CardHeader>
 <CardContent className="flex-1 overflow-y-auto p-0 relative">
 <div className="absolute left-[39px] top-6 bottom-6 w-0.5 bg-gray-100 z-0"></div>
 
 <div className="p-6 flex flex-col gap-4 relative z-10 pt-6">
 {history.map((item, i) => (
 <div 
 key={item.id} 
 onClick={() => handleSelect(item)}
 className="flex gap-5 cursor-pointer group"
 >
 <div className="flex flex-col items-center gap-2 relative mt-2">
 <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors bg-surface shadow-sm border border-border-subtle`}>
 <div className={`w-3 h-3 rounded-full transition-colors ${selected?.id === item.id ? 'bg-gray-800' : 'bg-gray-200 group-hover:bg-gray-400'}`}></div>
 </div>
 </div>
 
 <div className={`flex-1 rounded-2xl p-5 transition-all
 ${selected?.id === item.id 
 ? 'bg-surface shadow-[0_4px_15px_-4px_rgba(0,0,0,0.08)] border border-border-subtle' 
 : 'bg-transparent border border-transparent hover:bg-surface hover:shadow-sm hover:border-border-subtle'}`}
 >
 <div className="flex justify-between items-center mb-1">
 <span className={`font-bold text-[15px] ${selected?.id === item.id ? 'text-text-primary' : 'text-text-secondary'}`}>
 Inspection #{item.id}
 </span>
 <span className="text-[11px] font-semibold text-text-disabled uppercase flex items-center gap-1">
 <Calendar size={12}/> {new Date(item.timestamp).toLocaleDateString()}
 </span>
 </div>
 
 <div className="flex justify-between items-center mt-3">
 <div className="flex flex-col">
 <span className="text-[11px] text-text-disabled font-semibold uppercase tracking-widest">Defect</span>
 <span className="text-[14px] font-bold capitalize text-text-primary mt-0.5">{item.primary_defect || 'None'}</span>
 </div>
 {item.severity !== 'none' && (
 <div className="flex items-center gap-2">
 <span className={`w-2 h-2 rounded-full ${item.severity === 'high' ? 'bg-red-500' : item.severity === 'medium' ? 'bg-amber-500' : 'bg-green-500'}`}></span>
 <span className="text-[12px] font-bold text-text-secondary capitalize">{item.severity}</span>
 </div>
 )}
 </div>
 </div>
 </div>
 ))}
 
 {history.length === 0 && (
 <div className="text-center py-12 text-sm text-text-muted">
 No inspection history available.
 </div>
 )}
 </div>
 </CardContent>
 </Card>
 </motion.div>
 </motion.div>

 {/* Image Modal */}
 {isImageModalOpen && selected?.image_path && (
 <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-8 animate-in fade-in duration-200">
 <div className="bg-surface rounded-2xl shadow-2xl overflow-hidden max-w-[1200px] w-full max-h-full flex flex-col border border-border-subtle">
 <div className="p-4 border-b border-border-subtle flex justify-between items-center bg-surface-secondary/50">
 <h3 className="font-bold text-text-primary flex items-center gap-2">
 <ImageIcon size={18} className="text-brand" /> 
 Inspection Image Evidence (#{selected.id})
 </h3>
 <Button variant="ghost" size="sm" onClick={() => setIsImageModalOpen(false)}>Close</Button>
 </div>
 <div className="p-6 overflow-auto bg-gray-100/50 flex items-center justify-center min-h-[500px]">
 <img 
 src={api.getImageUrl(selected.image_path)} 
 alt={`Inspection ${selected.id}`} 
 className="max-w-full max-h-[75vh] object-contain rounded-lg shadow-sm border border-border-subtle" 
 />
 </div>
 </div>
 </div>
 )}

 </div>
 );
}
