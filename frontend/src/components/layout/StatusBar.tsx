import { useState, useEffect } from "react";
import { CheckCircle2, XCircle } from "lucide-react";
import { api } from "@/services/api";

export function StatusBar() {
 const [isOnline, setIsOnline] = useState(navigator.onLine);
 const [backendReady, setBackendReady] = useState(false);
 const [executionMode, setExecutionMode] = useState<'LOCAL' | 'JETSON'>('LOCAL');
 const [jetsonStatus, setJetsonStatus] = useState<string>('LOCAL ACTIVE');

 useEffect(() => {
 // Listen for browser online/offline
 const handleOnline = () => setIsOnline(true);
 const handleOffline = () => setIsOnline(false);
 window.addEventListener('online', handleOnline);
 window.addEventListener('offline', handleOffline);

 const checkMode = async () => {
 try {
 const electronAPI = (window as any).electronAPI;
 if (electronAPI) {
 const mode = await electronAPI.getExecutionMode();
 setExecutionMode(mode);
 if (mode === 'JETSON') {
 const status = await electronAPI.getJetsonStatus();
 setJetsonStatus(status.message);
 }
 }
 } catch (e) {
 // Fallback
 }
 };

 // Ping Backend to verify agents are loaded
 const checkBackend = async () => {
 try {
 const isHealthy = await api.healthCheck();
 setBackendReady(isHealthy);
 } catch (e) {
 setBackendReady(false);
 }
 };

 checkMode();
 checkBackend();
 const interval = setInterval(() => { checkBackend(); checkMode(); }, 15000); // Check every 15s

 return () => {
 window.removeEventListener('online', handleOnline);
 window.removeEventListener('offline', handleOffline);
 clearInterval(interval);
 };
 }, []);

 return (
 <footer className="h-16 bg-surface border-t border-border-subtle flex items-center justify-between px-8 shrink-0 z-10 shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.05)] text-xs font-sans">
 
 <div className="flex items-center gap-6 h-full">
 {/* Core System Status (Local Backend) */}
 <div className="flex items-center gap-3 pr-8 border-r border-border-subtle h-10">
 <div className="relative flex items-center justify-center">
 {backendReady ? (
 <>
 <div className="w-2.5 h-2.5 bg-blue-500 rounded-full z-10 shadow-[0_0_10px_rgba(59,130,246,0.6)]"></div>
 <div className="w-2.5 h-2.5 bg-blue-500 rounded-full absolute animate-ping opacity-75"></div>
 </>
 ) : (
 <div className="w-2.5 h-2.5 bg-red-500 rounded-full shadow-[0_0_10px_rgba(239,68,68,0.6)]"></div>
 )}
 </div>
 <div className="flex flex-col justify-center">
 <span className="font-bold text-text-disabled text-[9px] tracking-widest uppercase mb-0.5">Execution Mode</span>
 <span className={`font-bold text-[13px] leading-none ${backendReady ? 'text-text-primary' : 'text-red-600'}`}>
 {executionMode === 'JETSON' ? 'JETSON EDGE' : (backendReady ? 'LOCAL EDGE' : 'UNAVAILABLE')}
 </span>
 <span className="text-text-disabled text-[10px] font-medium mt-1">
 {executionMode === 'JETSON' ? jetsonStatus : (backendReady ? 'Standalone Mode' : 'Reconnecting...')}
 </span>
 </div>
 </div>
 </div>

 <div className="flex items-center gap-8 h-full">
 <AgentStatus name="SQLite" status={backendReady ? "Connected" : "Disconnected"} sub="Local Database" isReady={backendReady} />
 <AgentStatus name="YOLOv11" status={backendReady ? "Loaded" : "Offline"} sub="Model Ready" isReady={backendReady} />
 <AgentStatus name="PHI-3 MINI" status={backendReady ? "Ready" : "Offline"} sub="LLM Ready" isReady={backendReady} />
 <AgentStatus name="CHROMADB" status={backendReady ? "Connected" : "Disconnected"} sub="Vector DB Ready" isReady={backendReady} />
 <AgentStatus name="LANGCHAIN" status={backendReady ? "Active" : "Inactive"} sub="Agents Running" isReady={backendReady} />
 </div>

 </footer>
 );
}

function AgentStatus({ name, status, sub, isReady }: { name: string, status: string, sub: string, isReady: boolean }) {
 return (
 <div className="flex items-center gap-3">
 <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${isReady ? 'bg-green-100 text-green-600 shadow-[0_2px_10px_-4px_rgba(22,163,74,0.3)]' : 'bg-red-100 text-red-500 shadow-[0_2px_10px_-4px_rgba(239,68,68,0.3)]'}`}>
 {isReady ? <CheckCircle2 size={14} strokeWidth={3} /> : <XCircle size={14} strokeWidth={3} />}
 </div>
 <div className="flex flex-col justify-center">
 <span className="font-bold text-text-disabled text-[9px] tracking-widest uppercase mb-0.5">{name}</span>
 <span className={`font-bold text-[12px] leading-none ${isReady ? 'text-text-primary' : 'text-red-500'}`}>{status}</span>
 <span className="text-text-disabled text-[9px] font-medium mt-1">{sub}</span>
 </div>
 </div>
 )
}
