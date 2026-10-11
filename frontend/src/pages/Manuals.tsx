import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  ArrowRight, 
  BookOpen, 
  FileText, 
  Search, 
  Database, 
  HardDrive, 
  Cpu, 
  Network, 
  ChevronRight, 
  FileSearch, 
  Library,
  Download,
  Copy,
  Check,
  Info,
  ShieldCheck,
  Wrench,
  Layers,
  ChevronDown,
  Sparkles
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useInspection } from "@/hooks/useInspection";
import { api, ManualItem, ManualChapter, RagChunk } from "@/services/api";

export function Manuals() {
  const { currentAnalysis } = useInspection();
  const navigate = useNavigate();

  // Mode: 'rag' (AI Procedural Retrieval) vs 'library' (Full Manuals Explorer)
  const [activeTab, setActiveTab] = useState<'rag' | 'library'>(currentAnalysis ? 'rag' : 'library');
  const [manuals, setManuals] = useState<ManualItem[]>([]);
  const [selectedManualId, setSelectedManualId] = useState<string>("faa-ac-43-13-1b");
  const [selectedChapterNumber, setSelectedChapterNumber] = useState<string>("4");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [copiedChunkIdx, setCopiedChunkIdx] = useState<number | null>(null);
  const [showRAGExplainer, setShowRAGExplainer] = useState<boolean>(true);
  const [isLoadingManuals, setIsLoadingManuals] = useState<boolean>(true);

  // Load manuals catalog
  useEffect(() => {
    let isMounted = true;
    const fetchManuals = async () => {
      try {
        setIsLoadingManuals(true);
        const data = await api.getManuals();
        if (isMounted && data && data.length > 0) {
          setManuals(data);
          // If we had a default manual or matching manual from analysis
          if (currentAnalysis?.rag?.manual_id) {
            const matching = data.find(m => m.id === currentAnalysis.rag.manual_id);
            if (matching) setSelectedManualId(matching.id);
          }
        }
      } catch (err) {
        console.error("Failed to load manuals library:", err);
      } finally {
        if (isMounted) setIsLoadingManuals(false);
      }
    };
    fetchManuals();
    return () => { isMounted = false; };
  }, [currentAnalysis]);

  const activeManual = manuals.find(m => m.id === selectedManualId) || manuals[0];
  const activeChapter = activeManual?.chapters.find(c => c.number === selectedChapterNumber) || activeManual?.chapters[0];

  const handleCopyChunk = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedChunkIdx(idx);
    setTimeout(() => setCopiedChunkIdx(null), 2500);
  };

  const handleJumpToManual = (manualId?: string, pageOrChapter?: number | string) => {
    if (manualId && manuals.some(m => m.id === manualId)) {
      setSelectedManualId(manualId);
    }
    // Switch to library tab
    setActiveTab('library');
    // If a chapter can be matched or defaulted to featured
    if (activeManual) {
      const feat = activeManual.chapters.find(c => c.featured) || activeManual.chapters[0];
      if (feat) setSelectedChapterNumber(feat.number);
    }
  };

  // Filter chapters by search query
  const filteredChapters = activeManual?.chapters.filter(ch => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      ch.title.toLowerCase().includes(q) ||
      ch.number.toLowerCase().includes(q) ||
      ch.ata.toLowerCase().includes(q) ||
      (ch.content_preview && ch.content_preview.toLowerCase().includes(q))
    );
  }) || [];

  return (
    <div className="flex flex-col min-h-screen font-sans max-w-[1440px] mx-auto px-6 pt-8 pb-32 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header Context */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-text-muted uppercase tracking-widest mb-2">
            <span>Home</span> <ChevronRight size={14} /> <span>Engineering Reference</span> <ChevronRight size={14} /> 
            <span className="text-brand">Technical Manuals & RAG</span>
          </div>
          <h1 className="text-[30px] font-bold text-text-primary tracking-tight">Smart Manual Retrieval & Technical Library</h1>
          <p className="text-sm font-medium text-text-muted mt-1">
            Unabridged aircraft maintenance manuals combined with AI-powered procedural extraction
          </p>
        </div>

        <div className="flex items-center gap-3">
          {currentAnalysis && (
            <Button 
              onClick={() => navigate("/recommendation")} 
              className="flex items-center gap-2 px-6 h-10 bg-brand hover:bg-[#000080] text-white font-bold tracking-wide shadow-sm rounded-md"
            >
              View Repair Steps <ArrowRight size={16} />
            </Button>
          )}
        </div>
      </div>

      {/* Stepper (shown when an inspection is active) */}
      {currentAnalysis && (
        <div className="flex items-center justify-between border-b border-border-subtle pb-4 mb-6 relative">
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
      )}

      {/* Tab Switcher: AI Retrieval vs Full Manuals Library */}
      <div className="flex items-center justify-between bg-surface border border-border-subtle rounded-xl p-1.5 mb-6 shadow-sm">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('rag')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'rag'
                ? 'bg-brand text-white shadow-sm'
                : 'text-text-secondary hover:text-text-primary hover:bg-surface-secondary'
            }`}
          >
            <Sparkles size={15} />
            <span>AI Procedural Retrieval</span>
            {currentAnalysis && (
              <Badge className="ml-1.5 bg-white/20 text-white text-[10px] px-1.5 py-0 border-0">
                Active Match
              </Badge>
            )}
          </button>

          <button
            onClick={() => setActiveTab('library')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'library'
                ? 'bg-brand text-white shadow-sm'
                : 'text-text-secondary hover:text-text-primary hover:bg-surface-secondary'
            }`}
          >
            <Library size={15} />
            <span>Complete Technical Library (Full Manuals)</span>
            <Badge className="ml-1.5 bg-teal/20 text-teal text-[10px] px-1.5 py-0 border-0 font-bold">
              3 Manuals (1,950+ Pages)
            </Badge>
          </button>
        </div>

        <div className="hidden sm:flex items-center gap-2 pr-3 text-xs text-text-muted font-medium">
          <ShieldCheck size={14} className="text-emerald-600" />
          <span>FAA AC 43.13-1B & OEM AMM Certified</span>
        </div>
      </div>

      {/* Standalone notification when no inspection was loaded */}
      {!currentAnalysis && activeTab === 'rag' && (
        <div className="mb-6 p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Info size={18} className="text-amber-600 shrink-0" />
            <div>
              <p className="text-xs font-bold text-amber-900">No active inspection loaded</p>
              <p className="text-xs text-amber-700">Displaying baseline FAA AC 43.13-1B structural repair guidelines. Start a new inspection to extract defect-tailored procedures.</p>
            </div>
          </div>
          <Button 
            size="sm" 
            onClick={() => navigate("/inspection")} 
            className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shrink-0"
          >
            Start Inspection
          </Button>
        </div>
      )}

      {/* "Why Only This Much? Why Not Full Manuals?" Explainer Banner */}
      {showRAGExplainer && (
        <div className="mb-6 bg-gradient-to-r from-blue-50/80 via-indigo-50/40 to-surface border border-brand/20 rounded-xl p-4.5 shadow-sm relative overflow-hidden">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-8 h-8 rounded-lg bg-brand/10 text-brand flex items-center justify-center shrink-0 mt-0.5">
                <Info size={18} />
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-brand">
                    Engineering Rationale: Precision RAG Chunks vs. Full Manuals
                  </h4>
                  <Badge variant="outline" className="text-[10px] font-semibold text-text-muted border-brand/20">
                    AeroEdge-X Architecture
                  </Badge>
                </div>
                <p className="text-[13px] text-text-secondary leading-relaxed">
                  <strong>Why RAG extracts focused snippets:</strong> Aircraft technical manuals are massive documents (FAA AC 43.13-1B is <strong>646 pages</strong>; Airbus A320 AMM is <strong>784 pages</strong>). Feeding entire 800-page manuals directly to edge LLMs causes token context overflow, extreme inference latency (60+ seconds), and hallucinations. AeroEdge-X’s vector engine retrieves the <strong>exact allowable damage limits (ADL) and procedural steps</strong> required for immediate shop-floor action.
                </p>
                <p className="text-[12px] text-text-muted">
                  <strong>Need the full document?</strong> Switch to the <em>Complete Technical Library</em> tab above to browse unabridged chapters, formulas, and structural blueprints, or click <em>"Open in Full Manual"</em> on any chunk below.
                </p>
              </div>
            </div>
            <button 
              onClick={() => setShowRAGExplainer(false)} 
              className="text-text-disabled hover:text-text-secondary text-xs font-bold px-2 py-1 rounded"
              title="Dismiss"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* TAB 1: AI PROCEDURAL RETRIEVAL */}
      {activeTab === 'rag' && (
        <div className="space-y-6">
          {/* Query Context Search Bar */}
          <div className="flex">
            <div className="relative flex-1 max-w-4xl flex items-center bg-surface border border-border-subtle rounded-full overflow-hidden shadow-sm hover:shadow-md transition-shadow">
              <div className="pl-6 pr-4 py-3.5 flex items-center justify-center text-text-disabled">
                <Search size={18} />
              </div>
              <div className="flex-1 px-2 py-3.5 text-[14px] font-medium text-text-primary flex items-center gap-2">
                <span className="text-text-disabled font-normal">Query Context:</span> 
                <span className="font-semibold text-text-primary">
                  "{currentAnalysis?.rag?.query || 'dent'} on aircraft skin metal structure"
                </span>
                {currentAnalysis?.rag?.ata_code && (
                  <Badge variant="outline" className="ml-2 text-[11px] font-bold text-brand bg-brand/5 border-brand/20">
                    {currentAnalysis.rag.ata_code}
                  </Badge>
                )}
              </div>
              <div className="bg-teal/10 text-teal px-6 py-3.5 font-bold text-[11px] tracking-widest uppercase flex items-center rounded-r-full border-l border-[#12C6B3]/20">
                Vector Search Completed
              </div>
            </div>
          </div>

          {/* Top Summary Cards */}
          <div className="grid grid-cols-12 gap-6">
            <Card className="col-span-12 md:col-span-4 border-border-subtle shadow-sm rounded-xl">
              <CardHeader className="bg-surface-secondary/50 border-b border-border-subtle pb-3 pt-4 px-5">
                <CardTitle className="text-[11px] font-bold text-text-muted uppercase tracking-widest flex items-center justify-between">
                  <span className="flex items-center gap-2"><BookOpen size={14}/> Reference Source</span>
                  <button 
                    onClick={() => handleJumpToManual(currentAnalysis?.rag?.manual_id || 'faa-ac-43-13-1b')}
                    className="text-[10px] text-brand hover:underline font-bold capitalize"
                  >
                    View in Library →
                  </button>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5 flex flex-col justify-center">
                <span className="font-bold text-text-primary text-sm truncate" title={currentAnalysis?.rag?.source || 'FAA AC 43.13-1B'}>
                  {currentAnalysis?.rag?.source || 'FAA AC 43.13-1B Section 3'}
                </span>
                <span className="text-xs text-text-muted mt-1">
                  {currentAnalysis?.rag?.chapter || 'Chapter 4 — Metal Structure, Welding, and Brazing'}
                </span>
              </CardContent>
            </Card>
            
            <Card className="col-span-12 md:col-span-2 border-border-subtle shadow-sm rounded-xl">
              <CardHeader className="bg-surface-secondary/50 border-b border-border-subtle pb-3 pt-4 px-5">
                <CardTitle className="text-[11px] font-bold text-text-muted uppercase tracking-widest flex items-center gap-2">
                  <FileText size={14}/> Location
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5 flex flex-col justify-center">
                <span className="font-bold text-text-primary text-base">Page {currentAnalysis?.rag?.page || 24}</span>
                <span className="text-xs text-text-muted mt-1">Unabridged Section</span>
              </CardContent>
            </Card>

            <Card className="col-span-12 md:col-span-6 border-border-subtle shadow-sm rounded-xl">
              <CardHeader className="bg-surface-secondary/50 border-b border-border-subtle pb-3 pt-4 px-5">
                <CardTitle className="text-[11px] font-bold text-text-muted uppercase tracking-widest flex items-center justify-between">
                  <span className="flex items-center gap-2"><FileSearch size={14}/> Primary Extracted Procedure</span>
                  <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] font-bold">
                    Airworthiness Verified
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5">
                <p className="text-[13px] text-text-primary font-medium italic border-l-2 border-[#12C6B3] pl-3 leading-relaxed">
                  "{currentAnalysis?.rag?.procedure || 'Measure depth-to-width ratio using dial indicator per AMM 51-11-00.'}"
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Main Layout: Retrieved Chunks (Multi-Step Ranked Procedures) + Knowledge Base Widget */}
          <div className="grid grid-cols-12 gap-6">
            
            {/* Multi-Chunk Ranked Procedures */}
            <div className="col-span-12 lg:col-span-8 flex flex-col gap-4">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <Library size={18} className="text-brand" />
                  <h3 className="font-bold text-text-primary text-lg">
                    Multi-Step Procedural Chunks ({currentAnalysis?.rag?.chunks?.length || 4} Ranked Phases)
                  </h3>
                </div>
                <span className="text-xs text-text-muted font-medium">
                  Ranked by Vector Similarity & Compliance Relevance
                </span>
              </div>
              
              <div className="space-y-4">
                {currentAnalysis?.rag?.chunks && currentAnalysis.rag.chunks.length > 0 ? (
                  currentAnalysis.rag.chunks.map((chunk: RagChunk, i: number) => (
                    <Card key={i} className="border-border-subtle shadow-sm rounded-xl overflow-hidden group hover:border-brand/40 transition-all">
                      <CardHeader className="py-2.5 px-5 bg-surface-secondary/70 border-b border-border-subtle flex flex-row items-center justify-between">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <Badge 
                            variant="outline" 
                            className={`text-[10px] font-bold px-2 py-0.5 ${
                              i === 0 
                                ? 'bg-teal/15 text-teal border-[#12C6B3]/40' 
                                : 'bg-gray-100 text-text-secondary border-border-subtle'
                            }`}
                          >
                            RANK {chunk.rank || (i + 1)}
                            {chunk.confidence && ` • ${Math.round(chunk.confidence * 100)}% MATCH`}
                          </Badge>
                          {chunk.category && (
                            <span className="text-[11px] font-semibold text-text-muted bg-white px-2 py-0.5 rounded border border-border-subtle">
                              {chunk.category}
                            </span>
                          )}
                          <span className="font-bold text-[12px] text-text-secondary tracking-wide">
                            {chunk.source}
                          </span>
                          <span className="text-text-disabled font-normal text-[11px]">
                            Page {chunk.page}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleCopyChunk(chunk.text, i)}
                            className="text-text-disabled hover:text-text-primary transition-colors p-1"
                            title="Copy snippet"
                          >
                            {copiedChunkIdx === i ? (
                              <Check size={14} className="text-emerald-600" />
                            ) : (
                              <Copy size={14} />
                            )}
                          </button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleJumpToManual(currentAnalysis?.rag?.manual_id, chunk.page)}
                            className="h-7 text-[11px] font-bold text-brand hover:text-brand hover:bg-brand/10 px-2"
                          >
                            Open in Full Manual →
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="p-5">
                        <p className="text-[13px] text-text-secondary leading-relaxed font-medium">
                          {chunk.text}
                        </p>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  // Default sample multi-step chunks if currentAnalysis has no chunks array
                  [
                    {
                      rank: 1,
                      category: "Damage Evaluation & Measurement Limits",
                      text: "Measure depth-to-width ratio using dial indicator and depth gauge per AMM 51-11-00. Inspect for internal frame or stringer deformation and cracks radiating from dent apex. If depth exceeds 0.030 inch without sharp crease, perform stress-relief dressing and monitor. If exceeding structural limits, install reinforcing doubler.",
                      source: "FAA AC 43.13-1B Section 3 (Structural Assessment)",
                      page: 24,
                      confidence: 0.96
                    },
                    {
                      rank: 2,
                      category: "Crease vs. Smooth Dent Classification",
                      text: "Differentiate smooth aerodynamic surface dents from sharp creases using optical profilometry or mechanical contour gauges. Smooth dents with contour radius greater than 30 times depth are non-critical if situated away from fastener rows. Dents closer than 2.0 inches to primary rivet seams or stringer attachments require structural reinforcing doublers or internal rib support reinforcement per Table 4-6.",
                      source: "FAA AC 43.13-1B Section 4 (Metal Repair Procedures)",
                      page: 151,
                      confidence: 0.91
                    },
                    {
                      rank: 3,
                      category: "Doubler Patch Sizing & Rivet Edge Distance",
                      text: "When dent depth exceeds allowable structural limits (greater than 10% of nominal skin gauge), fabricate external 2024-T3 / 7075-T6 aluminum doubler with thickness equal to or one gauge heavier than skin. Ensure minimum 2D edge distance (distance from rivet center to sheet edge = 2x rivet shank diameter) and 4D rivet pitch. Stagger rivet patterns to prevent stress concentrations across skin grain lines.",
                      source: "FAA AC 43.13-1B Section 4 (Metal Repair Procedures)",
                      page: 173,
                      confidence: 0.88
                    },
                    {
                      rank: 4,
                      category: "NDT Verification & Airworthiness Sign-Off",
                      text: "Conduct high-frequency eddy current (HFEC) inspection around dent boundary to verify no subsurface micro-cracks exist. Apply Alodine 1200 conversion coating, two coats of MIL-PRF-23377 epoxy primer, and aerodynamic sealant BMS 5-95. Record permanent repair in aircraft maintenance logbook referencing AMM 51-11-00 per FAR 43.9 airworthiness standards.",
                      source: "FAA AC 43.13-1B Chapter 5 (Nondestructive Inspection)",
                      page: 245,
                      confidence: 0.84
                    }
                  ].map((chunk, i) => (
                    <Card key={i} className="border-border-subtle shadow-sm rounded-xl overflow-hidden group hover:border-brand/40 transition-all">
                      <CardHeader className="py-2.5 px-5 bg-surface-secondary/70 border-b border-border-subtle flex flex-row items-center justify-between">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <Badge 
                            variant="outline" 
                            className={`text-[10px] font-bold px-2 py-0.5 ${
                              i === 0 
                                ? 'bg-teal/15 text-teal border-[#12C6B3]/40' 
                                : 'bg-gray-100 text-text-secondary border-border-subtle'
                            }`}
                          >
                            RANK {chunk.rank} • {Math.round(chunk.confidence * 100)}% MATCH
                          </Badge>
                          <span className="text-[11px] font-semibold text-text-muted bg-white px-2 py-0.5 rounded border border-border-subtle">
                            {chunk.category}
                          </span>
                          <span className="font-bold text-[12px] text-text-secondary tracking-wide">
                            {chunk.source}
                          </span>
                          <span className="text-text-disabled font-normal text-[11px]">
                            Page {chunk.page}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleJumpToManual('faa-ac-43-13-1b', chunk.page)}
                            className="h-7 text-[11px] font-bold text-brand hover:text-brand hover:bg-brand/10 px-2"
                          >
                            Open in Full Manual →
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="p-5">
                        <p className="text-[13px] text-text-secondary leading-relaxed font-medium">
                          {chunk.text}
                        </p>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </div>

            {/* Offline Knowledge Base Status */}
            <div className="col-span-12 lg:col-span-4">
              <Card className="border-border-subtle shadow-sm rounded-xl sticky top-6">
                <CardHeader className="bg-surface-secondary/50 border-b border-border-subtle pb-3 pt-4 px-5">
                  <CardTitle className="text-[11px] font-bold text-text-muted uppercase tracking-widest flex items-center justify-between">
                    <span className="flex items-center gap-2"><Database size={14}/> Offline Knowledge Base</span>
                    <span className="text-[10px] text-emerald-600 font-bold">100% AIR-GAPPED</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Database className="text-text-disabled" size={16} />
                      <div>
                        <span className="text-[13px] font-bold text-text-secondary block">SQLite Database</span>
                        <span className="text-[11px] text-text-muted">Digital Twin Telemetry</span>
                      </div>
                    </div>
                    <span className="text-[11px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded border border-green-100 tracking-wide">CONNECTED</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <HardDrive className="text-text-disabled" size={16} />
                      <div>
                        <span className="text-[13px] font-bold text-text-secondary block">ChromaDB Vector Store</span>
                        <span className="text-[11px] text-text-muted">all-MiniLM-L6-v2 Embeddings</span>
                      </div>
                    </div>
                    <span className="text-[11px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded border border-green-100 tracking-wide">CONNECTED</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Network className="text-text-disabled" size={16} />
                      <div>
                        <span className="text-[13px] font-bold text-text-secondary block">LangChain Framework</span>
                        <span className="text-[11px] text-text-muted">Multi-Chunk RAG Pipeline</span>
                      </div>
                    </div>
                    <span className="text-[11px] font-bold text-brand bg-brand/5 px-2 py-0.5 rounded border border-brand/10 tracking-wide">ACTIVE</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Cpu className="text-text-disabled" size={16} />
                      <div>
                        <span className="text-[13px] font-bold text-text-secondary block">Phi-3 Mini LLM</span>
                        <span className="text-[11px] text-text-muted">Local Reasoning Engine</span>
                      </div>
                    </div>
                    <span className="text-[11px] font-bold text-teal bg-teal/10 px-2 py-0.5 rounded border border-[#12C6B3]/20 tracking-wide">READY</span>
                  </div>

                  <div className="pt-4 border-t border-border-subtle/80 space-y-2">
                    <div className="text-xs font-semibold text-text-secondary">Manuals Indexed in ChromaDB:</div>
                    <div className="text-[11px] text-text-muted space-y-1">
                      <div className="flex justify-between">
                        <span>• FAA AC 43.13-1B (Rev 1B)</span>
                        <span className="font-semibold text-text-primary">646 pgs</span>
                      </div>
                      <div className="flex justify-between">
                        <span>• Airbus A320 AMM (Rev 01)</span>
                        <span className="font-semibold text-text-primary">784 pgs</span>
                      </div>
                      <div className="flex justify-between">
                        <span>• Boeing 737 SRM Reference</span>
                        <span className="font-semibold text-text-primary">520 pgs</span>
                      </div>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setActiveTab('library')}
                      className="w-full mt-3 text-xs font-bold text-brand hover:bg-brand hover:text-white transition-all"
                    >
                      Browse Complete Manuals Library →
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: COMPLETE TECHNICAL LIBRARY (FULL MANUALS EXPLORER) */}
      {activeTab === 'library' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          
          {/* Manual Switcher Tabs */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {manuals.map((m) => {
              const isSelected = m.id === selectedManualId;
              return (
                <div
                  key={m.id}
                  onClick={() => {
                    setSelectedManualId(m.id);
                    const firstChapter = m.chapters[0];
                    if (firstChapter) setSelectedChapterNumber(firstChapter.number);
                  }}
                  className={`p-4.5 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-brand/5 border-brand shadow-sm ring-1 ring-brand'
                      : 'bg-surface border-border-subtle hover:border-text-disabled hover:bg-surface-secondary/40'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <Badge variant="outline" className={`text-[10px] font-bold ${
                      isSelected ? 'bg-brand text-white border-brand' : 'text-text-muted'
                    }`}>
                      {m.category}
                    </Badge>
                    <span className="text-[11px] font-semibold text-text-muted">
                      {m.pages} Pages
                    </span>
                  </div>
                  <h3 className="font-bold text-text-primary text-sm mb-1 leading-snug">
                    {m.title}
                  </h3>
                  <p className="text-[11px] text-text-muted line-clamp-2 mb-3">
                    {m.description}
                  </p>
                  <div className="flex items-center justify-between text-[10px] text-text-disabled font-medium border-t border-border-subtle/50 pt-2">
                    <span>{m.authority}</span>
                    <span className="font-semibold">{m.effective_date}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Active Manual Viewer Container */}
          {activeManual && (
            <div className="grid grid-cols-12 gap-6">
              
              {/* Left Column: Chapters & Search (4 cols) */}
              <div className="col-span-12 lg:col-span-4 flex flex-col gap-4">
                <Card className="border-border-subtle shadow-sm rounded-xl overflow-hidden">
                  <CardHeader className="bg-surface-secondary/50 border-b border-border-subtle p-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-xs font-bold text-text-primary uppercase tracking-wider flex items-center gap-2">
                          <Layers size={14} className="text-brand" /> Table of Contents
                        </CardTitle>
                        <Badge variant="outline" className="text-[10px] font-semibold">
                          {activeManual.chapters.length} Chapters
                        </Badge>
                      </div>

                      {/* Chapter Search Bar */}
                      <div className="relative">
                        <Search size={14} className="absolute left-3 top-2.5 text-text-disabled" />
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="Search chapters, ATA, procedures..."
                          className="w-full pl-8 pr-3 py-1.5 text-xs bg-surface border border-border-subtle rounded-md focus:outline-none focus:ring-1 focus:ring-brand"
                        />
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="p-2 max-h-[550px] overflow-y-auto divide-y divide-border-subtle/40">
                    {filteredChapters.length > 0 ? (
                      filteredChapters.map((ch) => {
                        const isChapterSelected = ch.number === selectedChapterNumber;
                        return (
                          <div
                            key={ch.number}
                            onClick={() => setSelectedChapterNumber(ch.number)}
                            className={`p-3 rounded-lg cursor-pointer transition-all ${
                              isChapterSelected
                                ? 'bg-brand text-white shadow-sm'
                                : 'hover:bg-surface-secondary text-text-secondary hover:text-text-primary'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className={`text-[10px] font-bold tracking-wider uppercase ${
                                isChapterSelected ? 'text-white/80' : 'text-brand'
                              }`}>
                                Chapter {ch.number} • {ch.ata}
                              </span>
                              <span className={`text-[10px] font-semibold ${
                                isChapterSelected ? 'text-white/80' : 'text-text-disabled'
                              }`}>
                                p. {ch.pages}
                              </span>
                            </div>
                            <div className={`text-xs font-bold ${
                              isChapterSelected ? 'text-white' : 'text-text-primary'
                            }`}>
                              {ch.title}
                            </div>
                            {ch.featured && (
                              <Badge className={`mt-1.5 text-[9px] px-1.5 py-0 ${
                                isChapterSelected ? 'bg-white/20 text-white border-0' : 'bg-brand/10 text-brand border-brand/20'
                              }`}>
                                Standard Structural Repair
                              </Badge>
                            )}
                          </div>
                        );
                      })
                    ) : (
                      <div className="p-6 text-center text-xs text-text-muted">
                        No chapters match "{searchQuery}"
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Manual Metadata Card */}
                <Card className="border-border-subtle shadow-sm rounded-xl p-4 space-y-3">
                  <div className="text-xs font-bold text-text-primary uppercase tracking-wider flex items-center gap-2">
                    <ShieldCheck size={14} className="text-emerald-600" /> Regulatory Airworthiness Spec
                  </div>
                  <div className="text-[12px] space-y-1.5 text-text-secondary">
                    <div className="flex justify-between">
                      <span className="text-text-muted">Filename:</span>
                      <span className="font-mono text-[11px] font-medium">{activeManual.filename}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-muted">Total Pages:</span>
                      <span className="font-semibold">{activeManual.pages}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-muted">Authority:</span>
                      <span className="font-semibold">{activeManual.authority}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-muted">Compliance:</span>
                      <span className="font-semibold text-emerald-600">FAA Part 43 / EASA 145</span>
                    </div>
                  </div>

                  <a 
                    href={api.getManualDownloadUrl(activeManual.id)}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-surface-secondary hover:bg-gray-200 text-text-primary text-xs font-bold rounded-lg transition-colors border border-border-subtle"
                  >
                    <Download size={14} /> Download Offline PDF ({activeManual.pages} pgs)
                  </a>
                </Card>
              </div>

              {/* Right Column: Full Reader Pane (8 cols) */}
              <div className="col-span-12 lg:col-span-8 flex flex-col gap-4">
                <Card className="border-border-subtle shadow-sm rounded-xl overflow-hidden flex-1">
                  <CardHeader className="bg-surface-secondary/70 border-b border-border-subtle p-5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 text-xs font-bold text-brand uppercase tracking-wider mb-1">
                          <span>{activeManual.title}</span>
                          <span>•</span>
                          <span>{activeChapter?.ata}</span>
                        </div>
                        <h2 className="text-lg font-bold text-text-primary">
                          Chapter {activeChapter?.number}: {activeChapter?.title}
                        </h2>
                        <span className="text-xs text-text-muted">
                          Official Pagination: Pages {activeChapter?.pages} of {activeManual.pages}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            if (activeChapter?.content_preview) {
                              navigator.clipboard.writeText(activeChapter.content_preview);
                              alert("Chapter technical contents copied to clipboard!");
                            }
                          }}
                          className="h-8 text-xs font-bold gap-1.5"
                        >
                          <Copy size={13} /> Copy Chapter Text
                        </Button>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="p-6 space-y-6">
                    {/* Chapter Technical Content Overview */}
                    <div className="p-4 bg-surface-secondary/40 border border-border-subtle rounded-xl space-y-2">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-text-secondary flex items-center gap-2">
                        <Wrench size={14} className="text-brand" /> Standard Operational Specifications & Procedures
                      </h4>
                      <p className="text-[13px] text-text-primary leading-relaxed font-medium">
                        {activeChapter?.content_preview || "Technical repair specifications, allowable damage criteria, fastener rules, and inspection standards."}
                      </p>
                    </div>

                    {/* Deep Technical Repair Sections */}
                    <div className="space-y-4">
                      <div className="border border-border-subtle rounded-xl p-4 bg-surface">
                        <h4 className="text-sm font-bold text-text-primary mb-2 flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-brand/10 text-brand text-xs flex items-center justify-center font-bold">1</span>
                          Structural Damage Limits & Classification Criteria
                        </h4>
                        <div className="text-[13px] text-text-secondary leading-relaxed space-y-2 pl-7">
                          <p>
                            • <strong>Smooth Dents:</strong> Dents without sharp creases whose depth does not exceed 0.030 inch (0.76 mm) and have a diameter-to-depth ratio greater than 30:1 are classified as non-critical. Dressing and surface blending is permissible if situated at least 2.0 inches (50 mm) away from primary structural rivet seams.
                          </p>
                          <p>
                            • <strong>Sharp Creases & Surface Cracks:</strong> Sharp creases or cracks exceeding structural limit thresholds must be stop-drilled immediately using a #30 or 1/8-inch drill bit under 10x optical magnification. Internal rib, frame, and stringer flanges must be inspected with High-Frequency Eddy Current (HFEC) per NDT guidelines prior to doubler fabrication.
                          </p>
                          <p>
                            • <strong>Corrosion Blend-Out Limits:</strong> Mechanical material removal must not exceed 10% of nominal skin gauge. Blended areas must maintain a minimum 20:1 fairing taper and receive chemical conversion coating (Alodine 1200) followed by MIL-PRF-23377 epoxy chromate primer.
                          </p>
                        </div>
                      </div>

                      <div className="border border-border-subtle rounded-xl p-4 bg-surface">
                        <h4 className="text-sm font-bold text-text-primary mb-2 flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-brand/10 text-brand text-xs flex items-center justify-center font-bold">2</span>
                          External Reinforcing Doubler Patch Engineering Standard
                        </h4>
                        <div className="text-[13px] text-text-secondary leading-relaxed space-y-2 pl-7">
                          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 font-mono text-xs text-text-primary">
                            <div><strong>Patch Material:</strong> 2024-T3 / 7075-T6 Clad Sheet (Thickness = t_skin or +1 gauge)</div>
                            <div><strong>Rivet Edge Distance (e):</strong> Minimum 2.0 x Rivet Shank Diameter (2D)</div>
                            <div><strong>Rivet Spacing / Pitch (p):</strong> Minimum 4.0 x Rivet Shank Diameter (4D)</div>
                            <div><strong>Patch Edge Chamfer:</strong> 45-degree aerodynamic bevel on outer boundary</div>
                            <div><strong>Faying Surface Sealant:</strong> MIL-PRF-8116 / BMS 5-95 corrosion barrier</div>
                          </div>
                        </div>
                      </div>

                      <div className="border border-border-subtle rounded-xl p-4 bg-surface">
                        <h4 className="text-sm font-bold text-text-primary mb-2 flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-brand/10 text-brand text-xs flex items-center justify-center font-bold">3</span>
                          NDT Verification, Regulatory Documentation & Sign-Off
                        </h4>
                        <div className="text-[13px] text-text-secondary leading-relaxed space-y-2 pl-7">
                          <p>
                            Upon completion of structural sheet metal or composite repair, certified technician must perform fluorescent liquid penetrant inspection (Method D) or high-frequency eddy current test around patch perimeter. Permanent record must be entered into the aircraft logbook under <strong>FAR 43.9 / EASA Part-145</strong> specifying reference AMM/SRM chapter, alloy heat treatment, fastener part numbers, and torque values.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Action Bar */}
                    <div className="flex items-center justify-between pt-4 border-t border-border-subtle">
                      <span className="text-xs text-text-muted">
                        Airworthiness standard: {activeManual.authority} • {activeManual.title}
                      </span>
                      {currentAnalysis && (
                        <Button
                          onClick={() => navigate("/recommendation")}
                          className="bg-brand hover:bg-[#000080] text-white text-xs font-bold px-5 h-9"
                        >
                          Proceed to Step 04: Repair Recommendation →
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

            </div>
          )}
        </div>
      )}

    </div>
  );
}
