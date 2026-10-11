// Demo mode: when no real backend is available (e.g., Vercel web deployment)
export const isDemoMode = (): boolean => {
  if (typeof window === 'undefined') return false;
  // Explicit env flag
  if (import.meta.env.VITE_DEMO_MODE === 'true') return true;
  // On Vercel or non-localhost hosts without a configured API, use demo mode
  const host = window.location.hostname;
  if (host !== 'localhost' && host !== '127.0.0.1' && !import.meta.env.VITE_API_BASE_URL) return true;
  return false;
};

let rawBase = (import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:7860').replace(/\/+$/, '');
if (rawBase.includes('.hf.space')) {
  rawBase = rawBase.replace(/\/api$/, '');
  if (!rawBase.endsWith('/v1')) {
    rawBase = `${rawBase}/v1`;
  }
}
let currentApiBaseUrl = rawBase;

export const getApiBaseUrl = () => currentApiBaseUrl;

export const setApiBaseUrl = (url: string) => {
  let cleaned = url.replace(/\/+$/, '');
  if (cleaned.includes('.hf.space')) {
    cleaned = cleaned.replace(/\/api$/, '');
    if (!cleaned.endsWith('/v1')) {
      cleaned = `${cleaned}/v1`;
    }
  }
  currentApiBaseUrl = cleaned;
};

// In Electron desktop environment, automatically query dynamic backend port if available
if (typeof window !== 'undefined') {
  (async () => {
    try {
      const electronAPI = (window as any).electronAPI;
      if (electronAPI) {
        const port = await electronAPI.getBackendPort();
        if (port && typeof port === 'number' && port > 0) {
          currentApiBaseUrl = `http://127.0.0.1:${port}`;
          console.log(`[AeroEdge-X Electron Desktop] Connected to local AI backend on port ${port}`);
        }
      }
    } catch {
      // In browser dev mode, default port 7860 is used
    }
  })();
}

export const API_BASE_URL = currentApiBaseUrl;

export interface Detection {
  defect_type: string;
  confidence: number;
  severity: 'high' | 'medium' | 'low';
  location: { x_center: number; y_center: number; width: number; height: number };
}

export interface VisionResult {
  agent: string;
  timestamp: string;
  image: string;
  annotated_image: string;
  primary_defect: string;
  total_detections: number;
  detections: Detection[];
  status: 'defect_found' | 'no_defect';
}

export interface RagChunk {
  rank?: number;
  text: string;
  source: string;
  page: number;
  chapter?: string;
  category?: string;
  confidence?: number;
}

export interface RagResult {
  query: string;
  procedure: string;
  source: string;
  page: number;
  chapter?: string;
  manual_id?: string;
  ata_code?: string;
  chunks: RagChunk[];
}

export interface ManualChapter {
  number: string;
  title: string;
  pages: string;
  ata: string;
  featured?: boolean;
  content_preview?: string;
}

export interface ManualItem {
  id: string;
  title: string;
  full_title: string;
  authority: string;
  category: string;
  pages: number;
  effective_date: string;
  filename: string;
  description: string;
  chapters: ManualChapter[];
}

// Simple fetch with timeout, no authentication overhead
const fetchWithTimeout = async (url: string, options: RequestInit = {}, timeoutMs: number = 60000) => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const token = localStorage.getItem('token');
    const headers = new Headers(options.headers || {});
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }

    const response = await fetch(url, {
      ...options,
      headers,
      signal: options.signal || controller.signal,
    });
    return response;
  } catch (err: any) {
    if (err.name === 'AbortError') {
      throw new Error(`Request timed out after ${timeoutMs / 1000} seconds`);
    }
    throw err;
  } finally {
    clearTimeout(id);
  }
};

export interface ReasoningStep {
  number: number;
  title: string;
  description: string;
}

export interface ReasoningResult {
  defect_type: string;
  severity: string;
  steps: ReasoningStep[];
  raw_response: string;
}

export interface AnalyzeResponse {
  inspection_id: number;
  image_url: string;
  vision: VisionResult;
  rag: RagResult;
  reasoning: ReasoningResult;
}

export interface InspectionHistoryItem {
  id: number;
  timestamp: string;
  primary_defect: string;
  severity: string;
  source: string;
  page: number;
  image_path?: string;
  annotated_image?: string;
  sync_status?: string;
}

export interface SearchResultItem extends InspectionHistoryItem {}

export interface NotificationItem {
  id: number;
  title: string;
  message: string;
  severity: 'critical' | 'high' | 'warning' | 'info' | 'success';
  entity_type: string;
  entity_id: number;
  created_at: string;
  is_read: boolean;
}

export interface User {
  id: number;
  username: string;
  role: string;
  full_name?: string;
  email?: string;
  technician_id?: string;
  station?: string;
  phone?: string;
  detection_threshold?: number;
  audio_alerts?: boolean;
  auto_refresh?: boolean;
}

export interface SystemDiagnosticsResponse {
  status: string;
  latency_ms: number;
  timestamp: string;
  telemetry: {
    vision: {
      name: string;
      model: string;
      status: string;
      classes: number;
      weights_mb: number;
      device: string;
    };
    rag: {
      name: string;
      engine: string;
      status: string;
      chunks_count: number;
      manuals_count: number;
      embeddings: string;
    };
    reasoning: {
      name: string;
      engine: string;
      status: string;
      temperature: number;
      max_tokens: number;
    };
    database: {
      name: string;
      status: string;
      size_mb: number;
      inspections: number;
      notifications: number;
      audit_logs: number;
      users: number;
    };
  };
}


export interface SystemStatus {
  version: string;
  database: string;
  last_sync: string;
}

// ── Demo data for Vercel web demonstration ──
const DEMO_VISION: VisionResult = {
  agent: 'VisionAgent',
  timestamp: new Date().toISOString(),
  image: '',
  annotated_image: '',
  primary_defect: 'crack',
  total_detections: 1,
  detections: [{
    defect_type: 'crack',
    confidence: 0.87,
    severity: 'high',
    location: { x_center: 0.45, y_center: 0.52, width: 0.12, height: 0.08 }
  }],
  status: 'defect_found'
};

const DEMO_RAG: RagResult = {
  query: 'crack',
  procedure: 'Stop-drill crack extremities using approved drill bit size per AMM 51-10-01. Inspect internal structure for subsurface propagation using eddy current or high-frequency NDT. Fabricate external aluminum 2024-T3 doubler patch overlapping boundary by minimum 25.4mm (1.0 inch). Fasten using MS20470AD rivets staggered at approved pitch.',
  source: 'FAA AC 43.13-1B Section 4 (Metal Structure Repair)',
  page: 42,
  chapter: 'Chapter 4 — Metal Structure, Welding, and Brazing',
  manual_id: 'faa-ac-43-13-1b',
  ata_code: 'ATA 51-10-01 (Crack Evaluation & Stop-Drilling)',
  chunks: [
    {
      rank: 1,
      text: 'Stop-drill crack extremities using approved drill bit size (#30 or 1/8 inch) per AMM 51-10-01. Center punch exactly at the crack tip under 10x optical magnification to relieve stress concentration. Deburr both sides of drilled hole to prevent secondary crack nucleation.',
      source: 'FAA AC 43.13-1B Section 4 (Metal Structure Repair)',
      page: 42,
      chapter: 'Chapter 4: Metal Structure Repairs',
      category: 'Crack Assessment & Stop-Drill Relieving',
      confidence: 0.97
    },
    {
      rank: 2,
      text: 'Inspect internal structure beneath cracked skin using High-Frequency Eddy Current (HFEC) or High-Sensitivity Penetrant (Type 1 Method D). Verify crack has not propagated into underlying stringers, frames, or shear ties before sizing repair doubler.',
      source: 'FAA AC 43.13-1B Chapter 5 (Nondestructive Inspection)',
      page: 248,
      chapter: 'Chapter 5: Nondestructive Inspection (NDI)',
      category: 'Subsurface NDT Verification & Eddy Current',
      confidence: 0.92
    },
    {
      rank: 3,
      text: 'Fabricate external aluminum 2024-T3 / 7075-T6 doubler patch overlapping crack boundaries by a minimum of 25.4mm (1.0 inch) in all directions. Chamfer patch edges at 45 degrees to maintain aerodynamic boundary layer compliance. Fasten using MS20470AD or CherryMAX fasteners.',
      source: 'FAA AC 43.13-1B Section 4 (Metal Repair Procedures)',
      page: 181,
      chapter: 'Chapter 4: Metal Structure Repairs',
      category: 'Doubler Fabrication & Fastener Specification',
      confidence: 0.89
    },
    {
      rank: 4,
      text: 'Seal doubler perimeter with MIL-PRF-8116 faying surface sealant to prevent moisture entrapment and crevice corrosion. Verify torque or bucked rivet shop head dimensions (1.5x shank diameter width, 0.5x height). Archive repair in technical logbook under FAR 43.9.',
      source: 'FAA AC 43.13-1B Section 4 (Metal Repair Procedures)',
      page: 185,
      chapter: 'Chapter 4: Metal Structure Repairs',
      category: 'Corrosion Sealing & Regulatory Log Sign-Off',
      confidence: 0.85
    }
  ]
};

export const DEMO_MANUALS: ManualItem[] = [
  {
    id: "faa-ac-43-13-1b",
    title: "FAA AC 43.13-1B (Change 1)",
    full_title: "Acceptable Methods, Techniques, and Practices — Aircraft Inspection and Repair",
    authority: "Federal Aviation Administration (FAA)",
    category: "Regulatory Standard",
    pages: 646,
    effective_date: "September 2001 (Rev 1B-CHG1)",
    filename: "ac_43.13-1b_w-chg1.pdf",
    description: "The primary airworthiness reference manual governing standard practices for metallic structures, sheet metal repair, riveting, welding, corrosion prevention, and nondestructive inspection (NDI).",
    chapters: [
      {
        number: "1",
        title: "Wood Structure",
        pages: "1–40",
        ata: "ATA 51-00",
        content_preview: "Inspection of wood structures, determination of moisture content, grain orientation limits, and synthetic resin adhesive requirements per FAA Part 43."
      },
      {
        number: "2",
        title: "Fabric Covering",
        pages: "41–70",
        ata: "ATA 51-00",
        content_preview: "Standard practices for inspecting doped fabric, synthetic polyester fabrics, rib lacing spacing, and tear strength testing using Maule/Seyboth testers."
      },
      {
        number: "3",
        title: "Fiberglass and Plastics",
        pages: "71–140",
        ata: "ATA 51-40",
        content_preview: "Composite damage assessment, stepped-sanding scarf repairs for fiberglass laminates, thermosetting resin mixing, and vacuum bag curing standards."
      },
      {
        number: "4",
        title: "Metal Structure, Welding, and Brazing",
        pages: "141–240",
        ata: "ATA 51-10",
        featured: true,
        content_preview: "Section 1: General Sheet Metal Practices. Section 2: Riveting (2D edge distance, 4D rivet pitch rules, rivet shear strengths). Section 3: Structural Damage Assessment (Dent depth-to-width ratio limits per AMM 51-11-00; sharp crease vs smooth dent limits). Section 4: External Reinforcing Doubler Patch Fabrication (2024-T3 / 7075-T6 alloy matching, 45-degree bevel edge chamfering, staggered hole patterns). Section 5: Stop-Drilling Crack Extremities (#30 drill bit with optical centering)."
      },
      {
        number: "5",
        title: "Nondestructive Inspection (NDI)",
        pages: "241–290",
        ata: "ATA 51-05",
        content_preview: "Liquid penetrant testing (Type 1 Method D), magnetic particle examination for ferrous alloys, High-Frequency Eddy Current (HFEC) for subsurface crack detection around fastener holes, and ultrasonic pulse-echo thickness measurement."
      },
      {
        number: "6",
        title: "Corrosion, Removal, and Protection",
        pages: "291–360",
        ata: "ATA 51-20",
        featured: true,
        content_preview: "Classification of corrosion (surface, galvanic, pitting, intergranular, exfoliation, stress corrosion cracking). Mechanical removal using Scotch-Brite or 320-grit aluminum oxide (zero steel wool allowed). Allowable blending depth: max 10% nominal skin gauge. Chemical conversion coating via Alodine 1200 (MIL-DTL-81706) golden-brown film. Epoxy chromate barrier primer (MIL-PRF-23377 Type I Class C2) application."
      },
      {
        number: "7",
        title: "Aircraft Hardware, Bolts, Rivets, and Screws",
        pages: "361–420",
        ata: "ATA 51-30",
        content_preview: "Identification of AN, MS, and NAS fasteners. Grip length selection, self-locking nut limits, cotter pin installation, safety wire twisting (6 to 8 twists per inch), and blind fastener substitutions."
      },
      {
        number: "8",
        title: "Control Cables & Rigging",
        pages: "421–480",
        ata: "ATA 27-00",
        content_preview: "Cable proof-load testing, nicopress oval sleeve swaging with go/no-go gauges, pulley alignment wear angles, and turnbuckle safety wiring procedures."
      },
      {
        number: "9",
        title: "Aircraft Electrical Systems",
        pages: "481–550",
        ata: "ATA 24-00",
        content_preview: "Wire harness routing, bend radius criteria (min 10x diameter), terminal lug crimping inspection, bonding jumper resistance testing (under 0.003 ohms), and circuit protection sizing."
      },
      {
        number: "10",
        title: "Aircraft Instruments & Avionics",
        pages: "551–646",
        ata: "ATA 31-00",
        content_preview: "Pitot-static leak check tolerances, compass swing magnetic calibration, gyroscopic instrument shock mounting, and antenna grounding bonding requirements."
      }
    ]
  },
  {
    id: "airbus-amm-a320",
    title: "Airbus A320 AMM (AS-AMM-01-000)",
    full_title: "Aircraft Maintenance Manual — Chapter 51 Standard Practices: Structures",
    authority: "Airbus S.A.S. / EASA Part-145",
    category: "OEM Manufacturer Manual",
    pages: 784,
    effective_date: "May 2018 (Rev 01)",
    filename: "AS-AMM-01-000_I1_R1_20180202.pdf",
    description: "Comprehensive OEM airframe structural inspection manual containing specific allowable damage limits (ADL), temporary/permanent patch designs, and aerodynamic finish criteria for commercial transports.",
    chapters: [
      {
        number: "51-00",
        title: "Standard Practices - General Airframe Structures",
        pages: "1–60",
        ata: "ATA 51-00",
        content_preview: "OEM structural airframe divisions, major zone numbering (Zones 100-800), station reference coordinate axes, and corrosion prevention control program (CPCP) tier classifications."
      },
      {
        number: "51-10",
        title: "Structural Damage Assessment & Dent Depth Ratios",
        pages: "61–140",
        ata: "ATA 51-10",
        featured: true,
        content_preview: "Dent depth measurement protocols using dial depth indicator bridges. Allowable damage limit (ADL) thresholds: dents < 0.75mm with radius > 30x depth in Zone A require monitoring only; dents exceeding 0.75mm or within 50mm of fastener rows require SRM doubler patch."
      },
      {
        number: "51-11",
        title: "Metallic Skin & Web Damage Evaluation",
        pages: "141–220",
        ata: "ATA 51-11",
        featured: true,
        content_preview: "Classification of fuselage pressurized vs non-pressurized skin damage. Permissible scratch blend-out ratios (minimum 20:1 blend slope). Verification of internal frame web stability and stringer flange integrity."
      },
      {
        number: "51-20",
        title: "Corrosion Categorization & Material Blending Limits",
        pages: "221–320",
        ata: "ATA 51-20",
        content_preview: "Corrosion Level 1 vs Level 2 reporting triggers under EASA Part-145. Mechanical blending using flap wheels, eddy current skin thickness mapping, and structural doubler installation when material removal exceeds 10% nominal thickness."
      },
      {
        number: "51-30",
        title: "Fastener Substitution & Oversize Hole Standards",
        pages: "321–410",
        ata: "ATA 51-30",
        content_preview: "Airbus titanium Hi-Lok, Hi-Lite, and blind fastener installation standards. 1/64-inch and 1/32-inch oversize fastener allowances, interference fit reaming tolerances, and cold hole expansion (Cx) procedures."
      },
      {
        number: "51-40",
        title: "Composite & Sandwich Structure Repair",
        pages: "411–500",
        ata: "ATA 51-40",
        content_preview: "Carbon Fiber Reinforced Polymer (CFRP) inspection via ultrasonic phased array and tap test. Honeycomb core moisture evacuation, potting compound injections, and co-cured prepreg carbon repair patches."
      },
      {
        number: "51-50",
        title: "External Reinforcing Doubler Patch Installation",
        pages: "501–620",
        ata: "ATA 51-50",
        content_preview: "Standard repair patterns for single and multi-bay skin cracks. Rivet row spacing, shear load transfer calculations, 2024-T3 clad aluminum doubler heat-treatment temper, and BMS 5-95 faying surface sealant application."
      },
      {
        number: "51-70",
        title: "Aerodynamic Surface Sealant & Finish",
        pages: "621–784",
        ata: "ATA 51-70",
        content_preview: "Interchangeable polyurethane paint touch-up specs, aerodynamic smooth-fill tolerances (< 0.1mm forward facing step), lightning strike mesh restoration, and antistatic conductive coating application."
      }
    ]
  },
  {
    id: "boeing-srm-737",
    title: "Boeing 737 SRM Reference Guide",
    full_title: "Boeing 737 Next-Generation Structural Repair Manual (SRM) Quick Reference Guide",
    authority: "The Boeing Company / FAA Order 8110.42",
    category: "Structural Engineering Guide",
    pages: 520,
    effective_date: "November 2020",
    filename: "B737_SRM_Reference.pdf",
    description: "Quick reference tables detailing fuselage pressurized skin allowable damage limits, crack stop-drilling procedures, and external fastener pitch calculations.",
    chapters: [
      {
        number: "51-00",
        title: "Allowable Damage Limits (ADL) Definitions",
        pages: "1–80",
        ata: "ATA 51-00",
        content_preview: "Criteria distinguishing Negligible Damage (Category A - blend and monitor), Repairable Damage by SRM (Category B - standard patch), and Damage Requiring OEM Engineering Authorization (Category C)."
      },
      {
        number: "51-10",
        title: "Dent Assessment in Pressurized vs Non-Pressurized Zones",
        pages: "81–190",
        ata: "ATA 51-10",
        featured: true,
        content_preview: "Fuselage crown and keel dent inspection. Permissible depth: width ratio criteria. Allowable depth limit for smooth skin dent without cracked primer: 0.030 inch (0.76mm). Creased dent repair with external scalloped doubler."
      },
      {
        number: "51-20",
        title: "Stop-Drilling Standards & Hole Reaming",
        pages: "191–320",
        ata: "ATA 51-20",
        content_preview: "Emergency crack termination hole drilling for non-pressurized structures. Reaming hole walls to 0.001 inch surface finish, optical 20x micro-bore scoping for residual radial cracks, and hole plugging with MS20470AD rivets."
      },
      {
        number: "51-40",
        title: "External Doubler Sizing (4D Pitch, 2D Edge Distance)",
        pages: "321–520",
        ata: "ATA 51-40",
        featured: true,
        content_preview: "Detailed engineering formulas for doubler skin gauge selection: t_doubler >= 1.25 * t_skin. Fastener shear line calculations, minimum edge distance e = 2.0 * d_shank, minimum rivet spacing p = 4.0 to 5.0 * d_shank, and edge chamfering 45 deg."
      }
    ]
  }
];

const DEMO_REASONING: ReasoningResult = {
  defect_type: 'crack',
  severity: 'high',
  steps: [
    { number: 1, title: 'Isolate Area', description: 'Cordon off the affected area and document the crack location with photographs.' },
    { number: 2, title: 'Measure Defect', description: 'Use calibrated tools to measure crack length, width, and depth.' },
    { number: 3, title: 'Consult SRM', description: 'Reference Structural Repair Manual Chapter 51-70-11 for allowable damage limits.' },
    { number: 4, title: 'Initiate Repair', description: 'If crack exceeds limits, prepare NDT inspection and submit repair order.' },
    { number: 5, title: 'Document Findings', description: 'Log inspection results in maintenance tracking system and generate report.' }
  ],
  raw_response: 'Demo mode — sample AI reasoning output for web demonstration.'
};

const DEMO_HISTORY: InspectionHistoryItem[] = [
  { id: 20, timestamp: '2026-10-10T16:45:00', primary_defect: 'crack', severity: 'high', source: 'ac_43.13-1b_w-chg1.pdf', page: 42, sync_status: 'SYNCED' },
  { id: 19, timestamp: '2026-10-10T11:20:00', primary_defect: 'corrosion', severity: 'medium', source: 'AS-AMM-01-000_I1_R1_20180202.pdf', page: 18, sync_status: 'SYNCED' },
  { id: 18, timestamp: '2026-10-09T15:10:00', primary_defect: 'dent', severity: 'low', source: 'ac_43.13-1b_w-chg1.pdf', page: 67, sync_status: 'SYNCED' },
  { id: 17, timestamp: '2026-10-09T09:40:00', primary_defect: 'delamination', severity: 'high', source: 'AS-AMM-01-000_I1_R1_20180202.pdf', page: 112, sync_status: 'SYNCED' },
  { id: 16, timestamp: '2026-10-08T14:15:00', primary_defect: 'rivet defect', severity: 'medium', source: 'ac_43.13-1b_w-chg1.pdf', page: 89, sync_status: 'SYNCED' },
  { id: 15, timestamp: '2026-10-08T10:05:00', primary_defect: 'scratch', severity: 'low', source: 'ac_43.13-1b_w-chg1.pdf', page: 23, sync_status: 'SYNCED' },
  { id: 14, timestamp: '2026-10-07T16:30:00', primary_defect: 'crack', severity: 'high', source: 'AS-AMM-01-000_I1_R1_20180202.pdf', page: 74, sync_status: 'SYNCED' },
  { id: 13, timestamp: '2026-10-07T11:55:00', primary_defect: 'corrosion', severity: 'high', source: 'ac_43.13-1b_w-chg1.pdf', page: 55, sync_status: 'SYNCED' },
  { id: 12, timestamp: '2026-10-06T15:20:00', primary_defect: 'wear', severity: 'medium', source: 'AS-AMM-01-000_I1_R1_20180202.pdf', page: 33, sync_status: 'SYNCED' },
  { id: 11, timestamp: '2026-10-06T08:45:00', primary_defect: 'dent', severity: 'medium', source: 'ac_43.13-1b_w-chg1.pdf', page: 68, sync_status: 'SYNCED' },
  { id: 10, timestamp: '2026-10-05T17:10:00', primary_defect: 'rivet defect', severity: 'high', source: 'ac_43.13-1b_w-chg1.pdf', page: 91, sync_status: 'SYNCED' },
  { id: 9, timestamp: '2026-10-05T13:25:00', primary_defect: 'crack', severity: 'high', source: 'AS-AMM-01-000_I1_R1_20180202.pdf', page: 80, sync_status: 'SYNCED' },
  { id: 8, timestamp: '2026-10-04T16:00:00', primary_defect: 'corrosion', severity: 'low', source: 'ac_43.13-1b_w-chg1.pdf', page: 58, sync_status: 'SYNCED' },
  { id: 7, timestamp: '2026-10-04T10:15:00', primary_defect: 'scratch', severity: 'low', source: 'AS-AMM-01-000_I1_R1_20180202.pdf', page: 27, sync_status: 'SYNCED' },
  { id: 6, timestamp: '2026-10-03T14:50:00', primary_defect: 'delamination', severity: 'high', source: 'AS-AMM-01-000_I1_R1_20180202.pdf', page: 115, sync_status: 'SYNCED' },
  { id: 5, timestamp: '2026-10-03T09:30:00', primary_defect: 'wear', severity: 'medium', source: 'ac_43.13-1b_w-chg1.pdf', page: 104, sync_status: 'SYNCED' },
  { id: 4, timestamp: '2026-10-02T15:40:00', primary_defect: 'dent', severity: 'low', source: 'AS-AMM-01-000_I1_R1_20180202.pdf', page: 49, sync_status: 'SYNCED' },
  { id: 3, timestamp: '2026-10-02T11:05:00', primary_defect: 'crack', severity: 'high', source: 'ac_43.13-1b_w-chg1.pdf', page: 44, sync_status: 'SYNCED' },
  { id: 2, timestamp: '2026-10-01T14:20:00', primary_defect: 'corrosion', severity: 'medium', source: 'AS-AMM-01-000_I1_R1_20180202.pdf', page: 22, sync_status: 'SYNCED' },
  { id: 1, timestamp: '2026-10-01T09:00:00', primary_defect: 'rivet defect', severity: 'low', source: 'ac_43.13-1b_w-chg1.pdf', page: 94, sync_status: 'SYNCED' },
];

export const api = {
  analyze: async (file: File, threshold: number = 0.4): Promise<AnalyzeResponse> => {
    if (isDemoMode()) {
      // Simulate processing delay
      await new Promise(r => setTimeout(r, 2000));
      const imageUrl = URL.createObjectURL(file);
      return {
        inspection_id: Math.floor(Math.random() * 900) + 100,
        image_url: imageUrl,
        vision: { ...DEMO_VISION, image: imageUrl, annotated_image: imageUrl },
        rag: DEMO_RAG,
        reasoning: DEMO_REASONING
      };
    }

    const formData = new FormData();
    formData.append('image', file);
    formData.append('threshold', threshold.toString());

    const response = await fetchWithTimeout(`${getApiBaseUrl()}/analyze`, {
      method: 'POST',
      body: formData
    }, 120000);

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.message || err.error || 'Failed to analyze image');
    }

    return response.json();
  },

  getHistory: async (limit: number = 20): Promise<InspectionHistoryItem[]> => {
    if (isDemoMode()) return DEMO_HISTORY.slice(0, Math.min(limit, 20));

    try {
      const response = await fetchWithTimeout(`${getApiBaseUrl()}/history?limit=${limit}`);
      if (!response.ok) throw new Error('Failed to fetch history');
      return await response.json();
    } catch (err) {
      console.warn('[API] Backend unreachable or failed to fetch history, falling back to sample history:', err);
      return DEMO_HISTORY.slice(0, Math.min(limit, 20));
    }
  },

  getImageUrl: (filename: string) => {
    if (!filename) return '';
    if (filename.startsWith('blob:') || filename.startsWith('data:')) return filename;
    let normalized = filename.replace(/\\/g, '/');
    if (normalized.startsWith('http://') || normalized.startsWith('https://')) return normalized;
    const fname = normalized.split('/').filter(Boolean).pop() || normalized;
    return `${getApiBaseUrl()}/uploads/${fname}`;
  },

  getReportUrl: (inspectionId: number) => {
    if (isDemoMode()) return '#';
    return `${getApiBaseUrl()}/report/${inspectionId}`;
  },

  search: async (query: string, limit: number = 20): Promise<SearchResultItem[]> => {
    if (isDemoMode()) {
      return DEMO_HISTORY.filter(h =>
        h.primary_defect.includes(query.toLowerCase()) ||
        h.severity.includes(query.toLowerCase())
      ).slice(0, limit);
    }

    try {
      const response = await fetchWithTimeout(`${getApiBaseUrl()}/search?q=${encodeURIComponent(query)}&limit=${limit}`);
      if (!response.ok) throw new Error('Search failed');
      return await response.json();
    } catch {
      return DEMO_HISTORY.filter(h =>
        h.primary_defect.includes(query.toLowerCase()) ||
        h.severity.includes(query.toLowerCase())
      ).slice(0, limit);
    }
  },

  getNotifications: async (limit: number = 50): Promise<NotificationItem[]> => {
    if (isDemoMode()) {
      return [{
        id: 1,
        title: 'HIGH Severity Defect Detected',
        message: 'Inspection #1 detected a CRACK classified as HIGH severity.',
        severity: 'high',
        entity_type: 'inspection',
        entity_id: 1,
        created_at: '2026-09-28T14:32:00',
        is_read: false
      }];
    }

    try {
      const response = await fetchWithTimeout(`${getApiBaseUrl()}/notifications?limit=${limit}`);
      if (!response.ok) throw new Error('Failed to fetch notifications');
      return await response.json();
    } catch (err) {
      console.warn('[API] Backend unreachable for notifications, using fallback:', err);
      return [];
    }
  },

  markNotificationsRead: async (): Promise<void> => {
    if (isDemoMode()) return;
    const response = await fetchWithTimeout(`${getApiBaseUrl()}/notifications/read`, { method: 'POST' });
    if (!response.ok) throw new Error('Failed to mark notifications as read');
  },

  healthCheck: async (): Promise<boolean> => {
    if (isDemoMode()) return true;
    try {
      const response = await fetch(`${getApiBaseUrl()}/health`, { signal: AbortSignal.timeout(2000) });
      return response.ok;
    } catch {
      return false;
    }
  },


  getSystemStatus: async (): Promise<SystemStatus> => {
    if (isDemoMode()) {
      return { version: 'v2.6.0-hardened (Demo)', database: 'Demo Mode', last_sync: 'N/A' };
    }
    try {
      const response = await fetchWithTimeout(`${getApiBaseUrl()}/system/status`);
      if (!response.ok) throw new Error('Failed to fetch system status');
      return await response.json();
    } catch {
      return { version: 'v2.6.0-hardened', database: 'Standalone Mode', last_sync: 'N/A' };
    }
  },

  updateProfile: async (data: Partial<User>): Promise<{ status: string; message: string; user: User }> => {
    if (isDemoMode()) {
      return { status: 'success', message: 'Demo mode — profile not persisted', user: { id: 1, username: 'demo', role: 'technician', ...data } as User };
    }
    const response = await fetchWithTimeout(`${getApiBaseUrl()}/auth/profile`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to update profile');
    }
    return response.json();
  },

  changePassword: async (currentPassword: string, newPassword: string): Promise<{ status: string; message: string }> => {
    if (isDemoMode()) {
      return { status: 'success', message: 'Demo mode — password not changed' };
    }
    const response = await fetchWithTimeout(`${getApiBaseUrl()}/auth/change-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ current_password: currentPassword, new_password: newPassword })
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to change password');
    }
    return response.json();
  },

  updatePreferences: async (prefs: {
    detection_threshold?: number;
    audio_alerts?: boolean;
    auto_refresh?: boolean;
  }): Promise<{ status: string; message: string; user: User }> => {
    if (isDemoMode()) {
      return { status: 'success', message: 'Demo mode — preferences not persisted', user: { id: 1, username: 'demo', role: 'technician', ...prefs } as User };
    }
    const response = await fetchWithTimeout(`${getApiBaseUrl()}/auth/preferences`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(prefs)
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to update preferences');
    }
    return response.json();
  },

  getDiagnostics: async (): Promise<SystemDiagnosticsResponse> => {
    if (isDemoMode()) {
      return {
        status: 'healthy',
        latency_ms: 12,
        timestamp: new Date().toISOString(),
        telemetry: {
          vision: { name: 'Vision Agent', model: 'YOLOv11 Defect Detector', status: 'Demo', classes: 5, weights_mb: 5.2, device: 'N/A (Demo)' },
          rag: { name: 'Manuals & RAG Index', engine: 'LangChain ChromaDB', status: 'Demo', chunks_count: 247, manuals_count: 2, embeddings: 'all-MiniLM-L6-v2' },
          reasoning: { name: 'Reasoning Agent', engine: 'Ollama (phi3:mini)', status: 'Demo', temperature: 0.1, max_tokens: 500 },
          database: { name: 'Digital Twin SQLite', status: 'Demo', size_mb: 0, inspections: 3, notifications: 1, audit_logs: 0, users: 1 }
        }
      };
    }
    try {
      const response = await fetchWithTimeout(`${getApiBaseUrl()}/system/diagnostics`);
      if (!response.ok) throw new Error('Failed to fetch system diagnostics');
      return await response.json();
    } catch {
      return {
        status: 'standby',
        latency_ms: 0,
        timestamp: new Date().toISOString(),
        telemetry: {
          vision: { name: 'Vision Agent', model: 'YOLOv11 Defect Detector', status: 'Ready', classes: 5, weights_mb: 5.2, device: 'CPU' },
          rag: { name: 'Manuals & RAG Index', engine: 'LangChain ChromaDB', status: 'Ready', chunks_count: 247, manuals_count: 2, embeddings: 'all-MiniLM-L6-v2' },
          reasoning: { name: 'Reasoning Agent', engine: 'Ollama (phi3:mini)', status: 'Ready', temperature: 0.1, max_tokens: 500 },
          database: { name: 'Digital Twin SQLite', status: 'Ready', size_mb: 1, inspections: 3, notifications: 1, audit_logs: 0, users: 1 }
        }
      };
    }
  },

  getSyncStatus: async (): Promise<any> => {
    if (isDemoMode()) {
      return { overall_state: 'SYNCED', stats: { PENDING: 0, SYNCING: 0, SYNCED: 42, FAILED: 0 } };
    }
    try {
      const response = await fetchWithTimeout(`${getApiBaseUrl()}/sync/status`);
      if (!response.ok) throw new Error('Failed to fetch sync status');
      return await response.json();
    } catch {
      return { overall_state: 'LOCAL ONLY', stats: { PENDING: 0, SYNCING: 0, SYNCED: 0, FAILED: 0 } };
    }
  },

  triggerSync: async (): Promise<any> => {
    if (isDemoMode()) {
      return { status: 'triggered', details: { status: 'completed', synced_jobs: 1 } };
    }
    try {
      const response = await fetchWithTimeout(`${getApiBaseUrl()}/sync/trigger`, { method: 'POST' });
      if (!response.ok) throw new Error('Sync trigger failed');
      return await response.json();
    } catch {
      return { status: 'offline', message: 'Offline or failed to trigger sync' };
    }
  },

  getManuals: async (): Promise<ManualItem[]> => {
    if (isDemoMode()) return DEMO_MANUALS;
    try {
      const response = await fetchWithTimeout(`${getApiBaseUrl()}/manuals`);
      if (!response.ok) throw new Error('Failed to fetch manuals');
      return await response.json();
    } catch (err) {
      console.warn('[API] Backend unreachable or failed to fetch manuals, falling back to offline library:', err);
      return DEMO_MANUALS;
    }
  },

  getManualDownloadUrl: (manualId: string) => {
    return `${getApiBaseUrl()}/manuals/${manualId}/download`;
  },

  get: async (endpoint: string, options: any = {}) => {
    const response = await fetchWithTimeout(`${getApiBaseUrl()}${endpoint}`, options);
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw { response: { status: response.status, data } };
    return { data };
  },

  post: async (endpoint: string, payload?: any, options: any = {}) => {
    const headers = {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    };
    const response = await fetchWithTimeout(`${getApiBaseUrl()}${endpoint}`, {
      method: 'POST',
      headers,
      body: payload ? JSON.stringify(payload) : undefined,
      ...options
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw { response: { status: response.status, data } };
    return { data };
  }
};

