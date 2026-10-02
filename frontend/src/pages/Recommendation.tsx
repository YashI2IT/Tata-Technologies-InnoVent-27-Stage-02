import { useNavigate } from "react-router-dom";
import { ArrowRight, Wrench, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useInspection } from "@/hooks/useInspection";

export function Recommendation() {
 const { currentAnalysis } = useInspection();
 const navigate = useNavigate();

 if (!currentAnalysis) {
 return (
 <div className="flex flex-col items-center justify-center h-full gap-4">
 <h2 className="text-2xl font-bold text-text-primary">No Recommendation Data</h2>
 <p className="text-text-muted">Please start an inspection to view maintenance recommendations.</p>
 <Button onClick={() => navigate("/inspection")}>Go to Inspection</Button>
 </div>
 );
 }

 const { reasoning } = currentAnalysis;

 return (
 <div className="flex flex-col gap-6 max-w-[1400px] mx-auto font-sans">
 <div className="flex items-center justify-between mb-6">
 <div>
 <div className="flex items-center gap-2 text-xs font-semibold text-text-muted uppercase tracking-widest mb-2">
 <span>Home</span> {'>'} <span>Recommendation</span> {'>'} <span className="text-brand">Repair Steps</span>
 </div>
 <h1 className="text-[30px] font-bold text-text-primary tracking-tight">Maintenance Recommendation</h1>
 <p className="text-sm font-medium text-text-muted mt-1">AI-generated step-by-step repair instructions based on approved manuals</p>
 </div>
 <Button onClick={() => navigate("/result")} className="flex items-center gap-2 px-8 h-10 bg-brand hover:bg-[#000080] text-white font-bold tracking-wide shadow-sm rounded-md">
 Finalize Inspection <ArrowRight size={16} />
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

 <div className="grid grid-cols-3 gap-6">
 <div className="col-span-2">
 <Card className="h-full">
 <CardHeader className="border-b border-border-subtle bg-surface-secondary pb-4">
 <div className="flex items-center gap-3">
 <div className="w-10 h-10 rounded-full bg-blue-100 text-primary flex items-center justify-center">
 <Wrench size={20} />
 </div>
 <div>
 <CardTitle className="text-lg">Recommended Repair Steps</CardTitle>
 <p className="text-xs text-text-muted mt-1">Generated locally by Phi-3 Mini using retrieved SRM/AMM procedures</p>
 </div>
 </div>
 </CardHeader>
 <CardContent className="pt-6">
 {reasoning.steps && reasoning.steps.length > 0 ? (
 <div className="space-y-6">
 {reasoning.steps.map((step, index) => (
 <div key={index} className="flex gap-4">
 <div className="flex flex-col items-center">
 <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold text-sm shrink-0">
 {step.number}
 </div>
 {index < reasoning.steps.length - 1 && (
 <div className="w-0.5 h-full bg-gray-200 mt-2"></div>
 )}
 </div>
 <div className="pb-6 pt-1">
 <h4 className="font-bold text-text-primary text-base">{step.title}</h4>
 <p className="text-text-secondary text-sm mt-1 leading-relaxed">{step.description}</p>
 </div>
 </div>
 ))}
 </div>
 ) : (
 <div className="text-center text-text-muted py-8">
 No repair steps generated. {currentAnalysis.vision.status === 'no_defect' ? 'No defects were found.' : ''}
 </div>
 )}
 </CardContent>
 </Card>
 </div>

 <div className="col-span-1 flex flex-col gap-6">
 <Card>
 <CardHeader className="pb-2">
 <CardTitle className="text-sm">Context Information</CardTitle>
 </CardHeader>
 <CardContent className="space-y-4">
 <div className="flex justify-between items-center pb-3 border-b border-border-subtle">
 <span className="text-sm text-text-muted">Defect Type</span>
 <span className="font-semibold text-text-primary capitalize">{reasoning.defect_type || 'None'}</span>
 </div>
 <div className="flex justify-between items-center pb-3 border-b border-border-subtle">
 <span className="text-sm text-text-muted">Severity</span>
 <Badge variant={reasoning.severity === 'high' ? 'destructive' : reasoning.severity === 'medium' ? 'warning' : 'success'}>
 {reasoning.severity || 'None'}
 </Badge>
 </div>
 <div className="flex justify-between items-center">
 <span className="text-sm text-text-muted">Reference Manual</span>
 <span className="font-medium text-text-primary truncate max-w-[150px]">{currentAnalysis.rag.source || 'N/A'}</span>
 </div>
 </CardContent>
 </Card>
 
 <Card className="bg-success-light/30 border-success-light">
 <CardContent className="p-4 flex items-start gap-3">
 <CheckCircle2 className="text-success mt-0.5 shrink-0" size={20} />
 <div>
 <h4 className="font-bold text-success text-sm">Locally Verified</h4>
 <p className="text-success/80 text-xs mt-1">
 These steps were generated entirely on-device and grounded in official documentation. No data left the local system.
 </p>
 </div>
 </CardContent>
 </Card>
 </div>
 </div>
 </div>
 );
}
