from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.lib import colors
from reportlab.platypus import Image as RLImage
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
from reportlab.lib.enums import TA_LEFT, TA_CENTER
from datetime import datetime
import os

def generate_report(vision_result, rag_result, reasoning_result, inspection_id, output_path):
    doc = SimpleDocTemplate(
        output_path,
        pagesize=A4,
        rightMargin=2*cm,
        leftMargin=2*cm,
        topMargin=2*cm,
        bottomMargin=2*cm
    )

    styles = getSampleStyleSheet()
    elements = []

    # ── Title ──────────────────────────────────────
    title_style = ParagraphStyle('title',
        fontSize=20, fontName='Helvetica-Bold',
        textColor=colors.HexColor('#0077b6'),
        spaceAfter=6, alignment=TA_CENTER)

    sub_style = ParagraphStyle('sub',
        fontSize=10, fontName='Helvetica',
        textColor=colors.HexColor('#4a6a8a'),
        spaceAfter=4, alignment=TA_CENTER)

    elements.append(Paragraph("AeroEdge-X", title_style))
    elements.append(Paragraph("Aircraft Maintenance Inspection Report", sub_style))
    elements.append(Paragraph(f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')} | Inspection ID: #{inspection_id}", sub_style))
    elements.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor('#0077b6'), spaceAfter=16))

    # ── Section style ───────────────────────────────
    section_style = ParagraphStyle('section',
        fontSize=13, fontName='Helvetica-Bold',
        textColor=colors.HexColor('#0077b6'),
        spaceBefore=14, spaceAfter=8)

    body_style = ParagraphStyle('body',
        fontSize=10, fontName='Helvetica',
        textColor=colors.HexColor('#2c3e50'),
        spaceAfter=6, leading=16)

    # ── Section 1: Summary ──────────────────────────
    elements.append(Paragraph("1. Inspection Summary", section_style))

    summary_data = [
        ['Field', 'Value'],
        ['Inspection ID', f'#{inspection_id}'],
        ['Timestamp', vision_result.get('timestamp', 'N/A')],
        ['Primary Defect', vision_result.get('primary_defect', 'N/A').upper()],
        ['Total Detections', str(vision_result.get('total_detections', 0))],
        ['Severity', vision_result['detections'][0]['severity'].upper() if vision_result['detections'] else 'N/A'],
        ['Status', vision_result.get('status', 'N/A').replace('_', ' ').upper()],
    ]

    summary_table = Table(summary_data, colWidths=[5*cm, 12*cm])
    summary_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#0077b6')),
        ('TEXTCOLOR', (0,0), (-1,0), colors.white),
        ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
        ('FONTSIZE', (0,0), (-1,-1), 10),
        ('BACKGROUND', (0,1), (-1,-1), colors.HexColor('#f8f9fa')),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.HexColor('#f8f9fa'), colors.white]),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#dee2e6')),
        ('PADDING', (0,0), (-1,-1), 8),
        ('FONTNAME', (0,1), (0,-1), 'Helvetica-Bold'),
    ]))
    elements.append(summary_table)
    # ── Annotated Image ─────────────────────────────
    annotated_path = vision_result.get('annotated_image', '')
    if annotated_path and os.path.exists(annotated_path):
        elements.append(Paragraph("2. Annotated Inspection Image", section_style))
        img = RLImage(annotated_path, width=15*cm, height=10*cm)
        elements.append(img)
        elements.append(Spacer(1, 10))
        
    elements.append(Paragraph("3. Detected Defects", section_style))    

    # ── Section 2: Detections ───────────────────────

    det_data = [['#', 'Defect Type', 'Confidence', 'Severity', 'Location (X, Y)']]
    for i, d in enumerate(vision_result.get('detections', []), 1):
        det_data.append([
            str(i),
            d['defect_type'].upper(),
            f"{d['confidence']*100:.1f}%",
            d['severity'].upper(),
            f"({d['location']['x_center']:.3f}, {d['location']['y_center']:.3f})"
        ])

    det_table = Table(det_data, colWidths=[1*cm, 4*cm, 3*cm, 3*cm, 6*cm])
    det_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#0077b6')),
        ('TEXTCOLOR', (0,0), (-1,0), colors.white),
        ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
        ('FONTSIZE', (0,0), (-1,-1), 9),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.HexColor('#f8f9fa'), colors.white]),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#dee2e6')),
        ('PADDING', (0,0), (-1,-1), 6),
        ('ALIGN', (2,0), (3,-1), 'CENTER'),
    ]))
    elements.append(det_table)

    # ── Section 3: Manual Reference ─────────────────
    elements.append(Paragraph("4. Retrieved Maintenance Procedure", section_style))
    elements.append(Paragraph(f"<b>Source:</b> {rag_result.get('source', 'N/A').split('/')[-1].split(chr(92))[-1]}", body_style))
    elements.append(Paragraph(f"<b>Page:</b> {rag_result.get('page', 'N/A')}", body_style))
    elements.append(Spacer(1, 6))
    procedure_text = rag_result.get('procedure', 'N/A').replace('\n', ' ')
    elements.append(Paragraph(f"<i>{procedure_text[:600]}...</i>", body_style))

    # ── Section 4: Repair Steps ─────────────────────
    elements.append(Paragraph("5. AI-Generated Repair Instructions (Phi-3 Mini)", section_style))
    elements.append(Paragraph("Generated by Reasoning Agent — grounded in retrieved maintenance manual only.", body_style))
    elements.append(Spacer(1, 6))

    steps = reasoning_result.get('steps', [])
    if steps:
        for step in steps:
            elements.append(Paragraph(
                f"<b>{step['number']}. {step['title']}</b>",
                ParagraphStyle('step_title', fontSize=10, fontName='Helvetica-Bold',
                    textColor=colors.HexColor('#0077b6'), spaceAfter=3)
            ))
            elements.append(Paragraph(step['description'], body_style))
    else:
        elements.append(Paragraph("No repair steps generated.", body_style))

    # ── Footer ──────────────────────────────────────
    elements.append(Spacer(1, 20))
    elements.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor('#dee2e6')))
    elements.append(Paragraph(
        "AeroEdge-X · Agentic Edge AI for Aerospace MRO · Fully Offline · Tata Technologies InnoVent",
        ParagraphStyle('footer', fontSize=8, textColor=colors.HexColor('#4a6a8a'), alignment=TA_CENTER, spaceBefore=8)
    ))

    doc.build(elements)
    return output_path


if __name__ == "__main__":
    # Test
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