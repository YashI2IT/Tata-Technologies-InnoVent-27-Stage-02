import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { 
 UploadCloud, 
 Camera, 
 Video, 
 PlayCircle, 
 ClipboardList,
 CheckCircle2,
 ChevronRight,
 Settings2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { api } from "@/services/api";
import { useInspection } from "@/hooks/useInspection";
import { motion, AnimatePresence } from "framer-motion";
import { staggerContainer, staggerItem, popIn, TRANSITION_STANDARD } from "@/lib/motion";

export function Inspection() {
 const navigate = useNavigate();
 const { setCurrentAnalysis } = useInspection();
  // Local Trusted Desktop Application default user
  const user = {
    username: "admin",
    role: "Lead Technician",
    full_name: "Arjun Verma",
    technician_id: "Tech-07"
  };
  const techLabel = `${user.technician_id} (${user.full_name})`;
 const [file, setFile] = useState<File | null>(null);
 const [isAnalyzing, setIsAnalyzing] = useState(false);
 const [pipelineState, setPipelineState] = useState<string>('');
 const [threshold, setThreshold] = useState(40);
 const fileInputRef = useRef<HTMLInputElement>(null);

 const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
 if (e.target.files && e.target.files[0]) {
 setFile(e.target.files[0]);
 }
 };

 const startAnalysis = async () => {
 if (!file) {
 alert("Please select an image to upload.");
 return;
 }
 setIsAnalyzing(true);
 setPipelineState('vision');
 
 try {
 const result = await api.analyze(file, threshold / 100);
 setPipelineState('rag');
 setCurrentAnalysis(result);
 
 // Notify header to fetch new notifications
 window.dispatchEvent(new Event('refresh-notifications'));
 
 setTimeout(() => {
 navigate("/analysis");
 }, 500);
 } catch (err: any) {
 console.error(err);
 alert(err?.message || "Failed to connect to the backend or analyze the image.");
 setIsAnalyzing(false);
 setPipelineState('');
 }
 };

 return (
 <div className="flex flex-col min-h-screen font-sans max-w-[1600px] mx-auto px-8 pt-8 pb-32">
 
 {/* Header Context */}
 <div className="mb-8">
 <div className="flex items-center gap-2 text-[11px] font-semibold text-text-disabled uppercase tracking-widest mb-3">
 <span>Home</span> <ChevronRight size={14} /> <span>Inspection</span> <ChevronRight size={14} /> <span className="text-text-primary">Setup</span>
 </div>
 <h1 className="text-3xl font-medium text-text-primary tracking-tight">Inspection Workspace</h1>
 <p className="text-sm font-medium text-text-muted mt-2">Configure inspection parameters and acquire aircraft imagery</p>
 </div>

 {/* Stepper */}
 <div className="flex items-center justify-between border-b border-border-subtle pb-4 mb-8 relative">
 <div className="absolute bottom-[-1px] left-0 w-1/4 border-b-2 border-[#12C6B3] z-10 transition-all"></div>
 
 <div className="flex items-center gap-3 text-teal font-bold">
 <div className="w-7 h-7 rounded-full bg-teal/10 text-teal border border-[#12C6B3]/30 flex items-center justify-center text-xs">01</div>
 <span className="text-sm tracking-wide">Setup</span>
 </div>
 <div className="flex items-center gap-3 text-text-disabled font-semibold">
 <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-xs">02</div>
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

 <motion.div 
 variants={staggerContainer}
 initial="initial"
 animate="animate"
 className="grid grid-cols-12 gap-8"
 >
 {/* LEFT: INSPECTION CONTEXT */}
 <motion.div variants={staggerItem} className="col-span-12 lg:col-span-5 flex flex-col gap-6">
 <Card className="shadow-card rounded-xl bg-surface overflow-hidden">
 <CardHeader className="pb-2 pt-6 px-8">
 <CardTitle className="text-[15px] font-medium text-text-primary flex items-center gap-2">
 <ClipboardList size={16}/> Inspection Context
 </CardTitle>
 </CardHeader>
 <CardContent className="px-8 pb-8 pt-4">
 <div className="grid grid-cols-2 gap-y-5 gap-x-4">
 <div className="col-span-2">
 <label className="text-[11px] font-semibold text-text-muted uppercase tracking-wider block mb-2">Aircraft Registration</label>
 <select className="w-full border border-border-subtle rounded-xl text-[14px] font-medium p-3 bg-surface-secondary focus:border-border-strong focus:bg-surface outline-none transition-all">
 <option>VT-ATX</option>
 </select>
 </div>
 <div>
 <label className="text-[11px] font-semibold text-text-muted uppercase tracking-wider block mb-2">Model</label>
 <select className="w-full border border-border-subtle rounded-xl text-[14px] font-medium p-3 bg-surface-secondary outline-none">
 <option>Airbus A320-214</option>
 </select>
 </div>
 <div>
 <label className="text-[11px] font-semibold text-text-muted uppercase tracking-wider block mb-2">Location</label>
 <select className="w-full border border-border-subtle rounded-xl text-[14px] font-medium p-3 bg-surface-secondary outline-none">
 <option>Hangar 3 - Bay 12</option>
 </select>
 </div>
 <div className="col-span-2">
 <label className="text-[11px] font-semibold text-text-muted uppercase tracking-wider block mb-2">Technician</label>
 <input type="text" className="w-full border border-border-subtle rounded-xl text-[14px] font-semibold p-3 bg-gray-100 text-text-secondary outline-none" value={techLabel} readOnly />
 </div>
 <div className="col-span-2">
 <label className="text-[11px] font-semibold text-text-muted uppercase tracking-wider block mb-2">Inspection Type</label>
 <select className="w-full border border-border-subtle rounded-xl text-[14px] font-medium p-3 bg-surface-secondary outline-none">
 <option>Routine Maintenance Inspection</option>
 <option>Post-Flight Walkaround</option>
 <option>Targeted Damage Assessment</option>
 </select>
 </div>
 </div>
 </CardContent>
 </Card>

 {/* CONFIDENCE THRESHOLD */}
 <Card className="shadow-card rounded-xl bg-surface">
 <CardHeader className="pb-2 pt-6 px-8">
 <div className="flex justify-between items-center">
 <CardTitle className="text-[15px] font-medium text-text-primary flex items-center gap-2">
 <Settings2 size={16}/> Confidence Threshold
 </CardTitle>
 <Badge variant="secondary" className="text-[12px] font-semibold rounded-full px-3 text-text-secondary bg-gray-100">{threshold}%</Badge>
 </div>
 </CardHeader>
 <CardContent className="px-8 pb-8 pt-4">
 <input 
 type="range" 
 min="10" 
 max="90" 
 step="5" 
 value={threshold}
 onChange={(e) => setThreshold(Number(e.target.value))}
 disabled={isAnalyzing}
 className="w-full accent-[#0000B3] cursor-pointer disabled:opacity-50" 
 />
 <div className="flex justify-between text-[10px] font-semibold text-text-disabled uppercase tracking-wider mt-2">
 <span>More candidate detections</span>
 <span>High confidence only</span>
 </div>
 </CardContent>
 </Card>
 </motion.div>

 {/* RIGHT: IMAGE ACQUISITION */}
 <motion.div variants={staggerItem} className="col-span-12 lg:col-span-7 flex flex-col gap-6">
 <Card className="shadow-card rounded-xl bg-surface flex-1 flex flex-col overflow-hidden">
 <CardHeader className="pb-2 pt-6 px-8">
 <CardTitle className="text-[15px] font-medium text-text-primary flex items-center gap-2">
 <Camera size={16}/> Image Acquisition
 </CardTitle>
 </CardHeader>
 <CardContent className="px-8 pb-8 pt-4 flex-1 flex flex-col">
 
 {/* Upload Zone */}
 {!file && (
 <div 
 onClick={() => fileInputRef.current?.click()}
 className="flex-1 min-h-[350px] border border-dashed border-border-strong bg-surface-secondary rounded-3xl flex flex-col items-center justify-center text-center cursor-pointer hover:bg-gray-100 transition-colors group"
 >
 <div className="w-16 h-16 rounded-full bg-surface shadow-[0_2px_10px_-4px_rgba(0,0,0,0.1)] flex items-center justify-center text-text-primary mb-6 group-hover:scale-110 transition-transform">
 <UploadCloud size={28} />
 </div>
 <h3 className="text-xl font-medium text-text-primary mb-2">Drop Aircraft Image Here</h3>
 <p className="text-sm font-medium text-text-muted mb-8">Supported formats: JPG, PNG, JPEG</p>
 <Button className="bg-primary hover:bg-primary-dark rounded-full text-white font-medium px-8 h-10" onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}>
 Browse Files
 </Button>
 <input type="file" ref={fileInputRef} className="hidden" accept=".jpg,.jpeg,.png" onChange={handleFileChange} />
 </div>
 )}

 {/* File Preview */}
 {file && (
 <div className="flex flex-col h-full gap-4">
 <div className="flex-1 bg-gray-100 rounded-3xl overflow-hidden flex items-center justify-center min-h-[350px] relative">
 <img src={URL.createObjectURL(file)} className="max-w-full max-h-[400px] object-contain rounded-2xl shadow-sm" alt="Preview" />
 
 {/* Processing Overlay */}
 {isAnalyzing && (
 <div className="absolute inset-0 bg-surface/70 backdrop-blur-md flex flex-col items-center justify-center z-10 animate-in fade-in duration-300">
 <div className="w-16 h-16 border-4 border-border-subtle border-t-gray-800 rounded-full animate-spin mb-6"></div>
 <h3 className="text-text-primary font-medium text-xl tracking-tight mb-2">
 {pipelineState === 'vision' ? 'Running Vision Inference' : 'Retrieving Maintenance Manuals'}
 </h3>
 <p className="text-text-muted font-medium text-sm">Please wait while the AI analyzes the imagery...</p>
 </div>
 )}
 </div>

 <div className="flex items-center justify-between bg-surface-secondary rounded-2xl p-4 mt-2">
 <div className="flex items-center gap-4">
 <div className="w-12 h-12 bg-surface rounded-xl shadow-sm flex items-center justify-center">
 <img src={URL.createObjectURL(file)} className="w-full h-full object-cover rounded-xl" alt="thumb"/>
 </div>
 <div className="flex flex-col">
 <span className="text-[14px] font-bold text-text-primary truncate max-w-[200px]">{file.name}</span>
 <span className="text-[12px] font-medium text-text-muted uppercase tracking-widest mt-0.5">
 {(file.size / 1024 / 1024).toFixed(2)} MB · {file.name.split('.').pop()}
 </span>
 </div>
 </div>
 {!isAnalyzing && (
 <div className="flex gap-3">
 <Button variant="ghost" size="sm" onClick={() => setFile(null)} className="h-10 px-5 text-sm font-semibold rounded-full hover:bg-gray-200">Change</Button>
 <Button onClick={startAnalysis} size="sm" className="bg-primary hover:bg-primary-dark text-white h-10 px-6 text-sm font-semibold shadow-sm rounded-full">
 Run Analysis
 </Button>
 </div>
 )}
 </div>
 </div>
 )}

 {/* Future Acquisition Methods */}
 <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-border-subtle">
 <div className="border border-border-subtle bg-surface-secondary rounded-xl p-4 flex items-center gap-4 opacity-50 select-none">
 <div className="w-10 h-10 rounded-full bg-surface border border-border-subtle flex items-center justify-center text-text-disabled shrink-0">
 <Camera size={18} />
 </div>
 <div>
 <h4 className="text-[12px] font-bold text-text-secondary uppercase tracking-wider mb-0.5">Live Capture</h4>
 <p className="text-[11px] text-text-muted font-medium">Available in Stage 3 Rollout</p>
 </div>
 </div>
 <div className="border border-border-subtle bg-surface-secondary rounded-xl p-4 flex items-center gap-4 opacity-50 select-none">
 <div className="w-10 h-10 rounded-full bg-surface border border-border-subtle flex items-center justify-center text-text-disabled shrink-0">
 <Video size={18} />
 </div>
 <div>
 <h4 className="text-[12px] font-bold text-text-secondary uppercase tracking-wider mb-0.5">Industrial Camera</h4>
 <p className="text-[11px] text-text-muted font-medium">Available in Stage 3 Rollout</p>
 </div>
 </div>
 </div>
 </CardContent>
 </Card>
 </motion.div>
 </motion.div>
 </div>
 );
}
