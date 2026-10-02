from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.lib import colors
from reportlab.platypus import Image as RLImage, KeepTogether, PageBreak
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_RIGHT
from datetime import datetime
import os

def add_footer(canvas, doc):
    canvas.saveState()
    canvas.setStrokeColor(colors.HexColor('#E2E8F0'))
    canvas.setLineWidth(1)
    canvas.line(1.5*cm, 1.5*cm + 15, A4[0] - 1.5*cm, 1.5*cm + 15)
    canvas.setFont('Helvetica', 8)
    canvas.setFillColor(colors.HexColor('#64748B'))
    canvas.drawCentredString(A4[0]/2.0, 1.5*cm, "AeroEdge-X · Agentic Edge AI for Aerospace MRO · Fully Offline Architecture")
    canvas.drawRightString(A4[0] - 1.5*cm, 1.5*cm, f"Page {canvas.getPageNumber()}")
    canvas.restoreState()

def generate_report(vision_result, rag_result, reasoning_result, inspection_id, output_path):
    doc = SimpleDocTemplate(
        output_path,
        pagesize=A4,
        rightMargin=1.5*cm,
        leftMargin=1.5*cm,
        topMargin=1.5*cm,
        bottomMargin=2.5*cm # Extra space for fixed footer
    )

    styles = getSampleStyleSheet()
    elements = []

    # Colors
    navy_blue = colors.HexColor('#0F172A')
    teal = colors.HexColor('#0D9488')
    dark_gray = colors.HexColor('#334155')
    light_gray = colors.HexColor('#F8FAFC')
    border_gray = colors.HexColor('#E2E8F0')

    # Styles
    title_style = ParagraphStyle('title', fontSize=24, leading=28, fontName='Helvetica-Bold', textColor=navy_blue, alignment=TA_RIGHT)
    sub_title_style = ParagraphStyle('sub_title', fontSize=10, leading=14, fontName='Helvetica-Bold', textColor=teal, alignment=TA_RIGHT)
    meta_style = ParagraphStyle('meta', fontSize=9, leading=12, fontName='Helvetica', textColor=dark_gray, alignment=TA_RIGHT)
    
    section_style = ParagraphStyle('section', fontSize=13, leading=16, fontName='Helvetica-Bold', textColor=navy_blue, spaceBefore=20, spaceAfter=12)
    body_style = ParagraphStyle('body', fontSize=10, leading=14, fontName='Helvetica', textColor=dark_gray, spaceAfter=6)
    mono_style = ParagraphStyle('mono', fontSize=9, leading=13, fontName='Courier', textColor=dark_gray)

    # ── Header Table (Logo + Title) ──────────────────
    from backend.config import get_config
    cfg = get_config()
    logo_path = os.path.join(cfg.RESOURCE_DIR, 'frontend', 'public', 'logo.png')
    
    header_data = []
    
    title_paragraphs = [
        Paragraph("<b>AeroEdge-X</b>", title_style),
        Spacer(1, 2),
        Paragraph("OFFICIAL MAINTENANCE RECORD", sub_title_style),
        Spacer(1, 6),
        Paragraph(f"INSPECTION ID: <b>#INSP-{inspection_id}</b>", meta_style),
        Paragraph(f"DATE: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')} UTC", meta_style),
    ]

    if os.path.exists(logo_path):
        logo = RLImage(logo_path, width=5*cm, height=1.5*cm, kind='proportional')
        header_data.append([logo, title_paragraphs])
    else:
        header_data.append([Paragraph("<b>AEROEDGE-X MRO</b>", ParagraphStyle('h1', fontSize=16, fontName='Helvetica-Bold', textColor=navy_blue)), title_paragraphs])

    header_table = Table(header_data, colWidths=[8*cm, 10*cm])
    header_table.setStyle(TableStyle([
        ('ALIGN', (0,0), (0,0), 'LEFT'),
        ('ALIGN', (1,0), (1,0), 'RIGHT'),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
    ]))
    elements.append(header_table)
    elements.append(Spacer(1, 10))
    elements.append(HRFlowable(width="100%", thickness=1, color=border_gray, spaceAfter=10))

    # ── 1. Inspection Summary ──────────────────────────
    elements.append(Paragraph("1. CORE INSPECTION METADATA", section_style))

    is_defect = vision_result.get('status') == 'defect_found'
    severity = vision_result['detections'][0]['severity'].upper() if vision_result.get('detections') else 'NONE'

    summary_data = [
        ['Timestamp', vision_result.get('timestamp', 'N/A')],
        ['Primary Finding', vision_result.get('primary_defect', 'N/A').upper()],
        ['Severity Layer', severity],
        ['Detections Logged', str(vision_result.get('total_detections', 0))],
        ['Analysis Engine', 'YOLOv11-Nano (Local Edge)'],
    ]

    summary_table = Table(summary_data, colWidths=[5*cm, 13*cm])
    summary_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (0,-1), light_gray),
        ('TEXTCOLOR', (0,0), (-1,-1), dark_gray),
        ('FONTNAME', (0,0), (0,-1), 'Helvetica-Bold'),
        ('FONTNAME', (1,0), (1,-1), 'Helvetica'),
        ('FONTSIZE', (0,0), (-1,-1), 9),
        ('GRID', (0,0), (-1,-1), 0.5, border_gray),
        ('PADDING', (0,0), (-1,-1), 8),
    ]))
    elements.append(summary_table)

    # ── 2. Annotated Image ─────────────────────────────
    annotated_path = vision_result.get('annotated_image', '')
    if annotated_path and os.path.exists(annotated_path):
        elements.append(Paragraph("2. ACQUIRED IMAGERY & BOUNDING BOXES", section_style))
        img = RLImage(annotated_path, width=14*cm, height=8*cm, kind='proportional')
        
        img_table = Table([[img]], colWidths=[15*cm])
        img_table.setStyle(TableStyle([
            ('ALIGN', (0,0), (-1,-1), 'LEFT'),
            ('BOX', (0,0), (-1,-1), 1, border_gray),
            ('TOPPADDING', (0,0), (-1,-1), 10),
            ('BOTTOMPADDING', (0,0), (-1,-1), 10),
        ]))
        elements.append(KeepTogether([img_table, Spacer(1, 4), Paragraph("<i>Fig 1. AI-annotated structural imagery overlay.</i>", ParagraphStyle('capt', fontSize=8, fontName='Helvetica-Oblique', alignment=TA_LEFT, textColor=colors.gray))]))
        elements.append(Spacer(1, 6))

    # ── 3. Detections Table ───────────────────────
    elements.append(Paragraph("3. RAW DETECTION COORDINATES", section_style))    

    det_data = [['ID', 'DEFECT CLASS', 'CONFIDENCE', 'SEVERITY', 'BOUNDING BOX [X, Y, W, H]']]
    for i, d in enumerate(vision_result.get('detections', []), 1):
        loc = d.get('location', {}) or {}
        xc = loc.get('x_center', 0.0)
        yc = loc.get('y_center', 0.0)
        w = loc.get('width', loc.get('w', 0.0))
        h = loc.get('height', loc.get('h', 0.0))
        box_str = f"[{xc:.3f}, {yc:.3f}, {w:.3f}, {h:.3f}]"

        det_data.append([
            f"{i:02d}",
            str(d.get('defect_type', 'UNKNOWN')).upper(),
            f"{float(d.get('confidence', 0.0))*100:.1f}%",
            str(d.get('severity', 'NONE')).upper(),
            box_str
        ])

    if not vision_result.get('detections'):
        det_data.append(['--', 'NONE DETECTED', '--', '--', '--'])

    det_table = Table(det_data, colWidths=[1.5*cm, 4*cm, 3*cm, 3*cm, 6.5*cm])
    det_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), light_gray),
        ('TEXTCOLOR', (0,0), (-1,0), navy_blue),
        ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
        ('FONTSIZE', (0,0), (-1,-1), 8),
        ('GRID', (0,0), (-1,-1), 0.5, border_gray),
        ('PADDING', (0,0), (-1,-1), 6),
        ('ALIGN', (0,0), (0,-1), 'CENTER'),
        ('ALIGN', (2,0), (3,-1), 'CENTER'),
        ('FONTNAME', (4,1), (4,-1), 'Courier'),
    ]))
    elements.append(det_table)

    # ── PAGE BREAK ──────────────────────────────────
    elements.append(PageBreak())

    # ── 4. RAG Retrieval ─────────────────
    elements.append(Paragraph("4. RAG CONTEXT RETRIEVAL", section_style))
    
    source_name = rag_result.get('source', 'N/A').split('/')[-1].split(chr(92))[-1]
    rag_data = [
        ['Query', rag_result.get('query', 'N/A')],
        ['Source Manual', f"{source_name} (Page {rag_result.get('page', 'N/A')})"],
    ]
    rag_table = Table(rag_data, colWidths=[3.5*cm, 14.5*cm])
    rag_table.setStyle(TableStyle([
        ('FONTNAME', (0,0), (0,-1), 'Helvetica-Bold'),
        ('FONTNAME', (1,0), (1,-1), 'Helvetica'),
        ('FONTSIZE', (0,0), (-1,-1), 9),
        ('TEXTCOLOR', (0,0), (-1,-1), dark_gray),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('TOPPADDING', (0,0), (-1,-1), 4),
    ]))
    elements.append(rag_table)
    elements.append(Spacer(1, 4))
    
    procedure_text = rag_result.get('procedure', 'N/A').replace('\n', ' ')
    elements.append(Paragraph(f"<b>Extracted Snippet:</b> <i>\"{procedure_text[:600]}...\"</i>", mono_style))

    # ── 5. Repair Steps ─────────────────────
    elements.append(Paragraph("5. SYNTHESIZED REPAIR PROTOCOL", section_style))
    elements.append(Paragraph("Generated via Local Phi-3 Mini strictly grounded in retrieved maintenance documentation.", ParagraphStyle('note', fontSize=8, fontName='Helvetica-Oblique', textColor=colors.gray, spaceAfter=10)))

    steps = reasoning_result.get('steps', [])
    if steps:
        step_data = []
        for step in steps:
            step_num = Paragraph(f"<b>{step['number']}</b>", ParagraphStyle('num', fontSize=10, fontName='Helvetica-Bold', textColor=teal, alignment=TA_CENTER))
            step_content = [
                Paragraph(f"<b>{step['title']}</b>", ParagraphStyle('st', fontSize=10, fontName='Helvetica-Bold', textColor=navy_blue)),
                Paragraph(step['description'], body_style)
            ]
            step_data.append([step_num, step_content])
            
        step_table = Table(step_data, colWidths=[1*cm, 17*cm])
        step_table.setStyle(TableStyle([
            ('VALIGN', (0,0), (-1,-1), 'TOP'),
            ('BOTTOMPADDING', (0,0), (-1,-1), 10),
            ('TOPPADDING', (0,0), (-1,-1), 0),
        ]))
        elements.append(step_table)
    else:
        elements.append(Paragraph("No repair steps generated.", body_style))

    out_dir = os.path.dirname(output_path)
    if out_dir:
        os.makedirs(out_dir, exist_ok=True)

    doc.build(elements, onFirstPage=add_footer, onLaterPages=add_footer)

    if not os.path.exists(output_path) or os.path.getsize(output_path) == 0:
        raise RuntimeError(f"Report generation failed: Output file '{output_path}' was not generated or is empty.")

    return output_path

if __name__ == "__main__":
    test_vision = {
        "timestamp": "2026-07-03T10:30:00",
        "primary_defect": "crack",
        "total_detections": 3,
        "status": "defect_found",
        "detections": [
            {"defect_type": "crack", "confidence": 0.92, "severity": "high",
             "location": {"x_center": 0.45, "y_center": 0.32, "width": 0.12, "height": 0.08}},
        ]
    }
    test_rag = {
        "source": "ac_43.13-1b_w-chg1.pdf",
        "page": 150,
        "procedure": "Stop drill at crack tips. Clean with approved solvent. Apply sealant per AMM 51-70-00."
    }
    test_reasoning = {
        "steps": [
            {"number": 1, "title": "Stop Drill", "description": "Drill at crack tips to stop propagation."},
            {"number": 2, "title": "Clean Area", "description": "Clean with approved solvent."},
        ]
    }
    path = generate_report(test_vision, test_rag, test_reasoning, 1, "test_report.pdf")
    print(f"✅ Report generated: {path}")