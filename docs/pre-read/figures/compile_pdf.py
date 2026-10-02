import os
from reportlab.lib.pagesizes import landscape, A4
from reportlab.pdfgen import canvas
from reportlab.lib import colors
from reportlab.lib.utils import ImageReader

OUT_DIR = os.path.dirname(__file__)
PDF_PATH = os.path.join(OUT_DIR, "AeroEdge-X_InnoVent-27_Stage02_Pre-Read.pdf")
MD_PATH = os.path.join(OUT_DIR, "FIGURE_STATUS.md")

FIGURES = [
    'figure_13_technician_workflow.png',
    'figure_14_ai_inspection_pipeline.png',
    'figure_15_current_system_architecture.png',
    'figure_16_edge_cloud_evolution.png',
    'figure_17_offline_sync_workflow.png',
    'figure_18_jetson_edge_deployment.png',
    'figure_19_aws_architecture.png',
    'figure_20_inspection_data_flow.png',
    'figure_21_evidence_traceability.png',
    'figure_22_current_status_roadmap.png',
    'figure_23_future_evolution.png',
    'figure_24_validation_matrix.png',
    'figure_25_architecture_evolution.png',
]

def create_pdf():
    # Use 16:9 presentation size (1920x1080 points)
    page_width = 1920
    page_height = 1080
    
    c = canvas.Canvas(PDF_PATH, pagesize=(page_width, page_height))
    c.setTitle("AeroEdge-X InnoVent-27 Stage 02 Pre-Read")
    
    # Page 1: FIGURE_STATUS.md Content (Title & Index)
    c.setFillColor(colors.HexColor('#0000B3'))
    c.rect(0, 0, page_width, page_height, fill=1)
    
    c.setFillColor(colors.white)
    c.setFont("Helvetica-Bold", 48)
    c.drawCentredString(page_width / 2, page_height - 150, "AeroEdge-X")
    
    c.setFont("Helvetica", 36)
    c.drawCentredString(page_width / 2, page_height - 220, "Tata Technologies InnoVent-27 Stage 02 Pre-Read")
    
    c.setFont("Helvetica", 24)
    c.drawCentredString(page_width / 2, page_height - 300, "Implementation Audit & Technical Figures")
    
    # Read MD
    try:
        with open(MD_PATH, 'r', encoding='utf-8') as f:
            lines = f.readlines()
    except Exception as e:
        lines = [f"Error reading FIGURE_STATUS.md: {e}"]
        
    c.setFont("Helvetica", 16)
    textobject = c.beginText()
    textobject.setTextOrigin(100, page_height - 400)
    textobject.setFont("Helvetica", 14)
    textobject.setLeading(20)
    
    line_count = 0
    for line in lines:
        line = line.strip()
        if not line:
            textobject.textLine("")
            continue
            
        if line_count > 25:
            c.drawText(textobject)
            c.showPage()
            c.setFillColor(colors.HexColor('#0000B3'))
            c.rect(0, 0, page_width, page_height, fill=1)
            c.setFillColor(colors.white)
            textobject = c.beginText()
            textobject.setTextOrigin(100, page_height - 100)
            textobject.setFont("Helvetica", 14)
            textobject.setLeading(20)
            line_count = 0
            
        textobject.textLine(line)
        line_count += 1
        
    c.drawText(textobject)
    
    # Render Figures
    for fig in FIGURES:
        fig_path = os.path.join(OUT_DIR, fig)
        if os.path.exists(fig_path):
            c.showPage()
            try:
                # Add image filling the page (since images are 16:9 and page is 16:9)
                c.drawImage(fig_path, 0, 0, width=page_width, height=page_height, preserveAspectRatio=True)
            except Exception as e:
                c.setFont("Helvetica", 24)
                c.drawString(100, page_height / 2, f"Error loading image {fig}: {e}")
        else:
            print(f"Warning: {fig} not found")
            
    c.save()
    print(f"Successfully created: {PDF_PATH}")

if __name__ == "__main__":
    create_pdf()
