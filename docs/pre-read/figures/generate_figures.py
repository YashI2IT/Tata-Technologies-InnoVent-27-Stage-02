"""
AeroEdge-X Pre-Read Technical Figure Generator
Professional aerospace engineering documentation figures.
Generates all figures 13-25 as high-resolution PNG (300 DPI, A4 landscape).
"""
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
from matplotlib.patches import FancyBboxPatch, FancyArrowPatch
import matplotlib.patheffects as pe
import os, sys

# ══════════════════════════════════════════════════════════════
# STYLE SYSTEM
# ══════════════════════════════════════════════════════════════
NAVY       = '#0000B3'
TEAL       = '#12C6B3'
ORANGE     = '#FF9C00'
BLACK      = '#000000'
GRAY       = '#5F6673'
LIGHT      = '#F5F7FA'
WHITE      = '#FFFFFF'
PURPLE     = '#7B2CBF'
RED        = '#D64545'
BORDER     = '#CBD5E1'
DARK_NAVY  = '#000080'

FONT = 'Arial'
DPI  = 300
# A4 landscape at 300 DPI: 3508 x 2480 px → figsize ≈ (11.69, 8.27) inches
FIG_W, FIG_H = 16, 9  # 16:9 for most diagrams

OUT_DIR = os.path.join(os.path.dirname(__file__))
os.makedirs(OUT_DIR, exist_ok=True)

def new_fig(title, subtitle=None, w=FIG_W, h=FIG_H):
    fig, ax = plt.subplots(figsize=(w, h), dpi=DPI)
    ax.set_xlim(0, 100)
    ax.set_ylim(0, 100)
    ax.set_aspect('auto')  # Allow proper landscape rendering
    ax.axis('off')
    fig.patch.set_facecolor(WHITE)
    ax.set_facecolor(WHITE)
    # Title bar
    ax.add_patch(FancyBboxPatch((1, 93), 98, 6, boxstyle="round,pad=0.3",
                                facecolor=NAVY, edgecolor='none'))
    ax.text(50, 96, title, ha='center', va='center',
            fontsize=14, fontweight='bold', color=WHITE, fontfamily=FONT)
    if subtitle:
        ax.text(99, 93.3, subtitle, ha='right', va='bottom',
                fontsize=7, fontweight='bold', color=ORANGE, fontfamily=FONT,
                fontstyle='italic')
    return fig, ax

def draw_box(ax, x, y, w, h, label, sublabel=None, color=NAVY, text_color=WHITE,
             dashed=False, fontsize=8, sublabel_size=6.5, radius=0.3):
    ls = '--' if dashed else '-'
    lw = 1.5 if not dashed else 1.2
    fc = color if not dashed else WHITE
    tc = text_color if not dashed else color
    ec = color
    box = FancyBboxPatch((x + radius, y + radius), w - 2*radius, h - 2*radius, boxstyle=f"round,pad={radius}",
                         facecolor=fc, edgecolor=ec, linewidth=lw, linestyle=ls)
    ax.add_patch(box)
    cy = y + h/2
    if sublabel:
        ax.text(x + w/2, cy + h*0.12, label, ha='center', va='center',
                fontsize=fontsize, fontweight='bold', color=tc, fontfamily=FONT)
        ax.text(x + w/2, cy - h*0.18, sublabel, ha='center', va='center',
                fontsize=sublabel_size, color=tc if not dashed else GRAY,
                fontfamily=FONT, fontstyle='italic')
    else:
        ax.text(x + w/2, cy, label, ha='center', va='center',
                fontsize=fontsize, fontweight='bold', color=tc, fontfamily=FONT)
    return box

def draw_zone(ax, x, y, w, h, label, color=LIGHT, border=BORDER, label_color=GRAY):
    radius = 0.5
    box = FancyBboxPatch((x + radius, y + radius), w - 2*radius, h - 2*radius, boxstyle=f"round,pad={radius}",
                         facecolor=color, edgecolor=border, linewidth=1.2)
    ax.add_patch(box)
    ax.text(x + 1, y + h - 1.2, label, ha='left', va='top',
            fontsize=7, fontweight='bold', color=label_color, fontfamily=FONT,
            fontstyle='italic')

def arrow(ax, x1, y1, x2, y2, color=GRAY, dashed=False, lw=1.5):
    ls = '--' if dashed else '-'
    a = FancyArrowPatch((x1, y1), (x2, y2),
                        arrowstyle='-|>', color=color,
                        mutation_scale=15, lw=lw, linestyle=ls,
                        connectionstyle='arc3,rad=0')
    ax.add_patch(a)

def arrow_right(ax, x1, y, x2, **kw):
    arrow(ax, x1, y, x2, y, **kw)

def arrow_down(ax, x, y1, y2, **kw):
    arrow(ax, x, y1, x, y2, **kw)

def legend_box(ax, x, y, items):
    """items: list of (color, label, dashed)"""
    draw_zone(ax, x, y, 22, len(items)*3.2 + 2, 'LEGEND', color='#FAFBFC', border=BORDER)
    for i, (c, lab, dash) in enumerate(items):
        bx = x + 1.5
        by = y + len(items)*3.2 - i*3.2
        draw_box(ax, bx, by, 5, 2.2, '', color=c, dashed=dash, fontsize=6)
        ax.text(bx + 6.5, by + 1.1, lab, ha='left', va='center',
                fontsize=6.5, color=BLACK, fontfamily=FONT)

def save(fig, name):
    path = os.path.join(OUT_DIR, name)
    fig.savefig(path, dpi=DPI, facecolor=WHITE, edgecolor='none')
    plt.close(fig)
    print(f"  [OK] {name}")


# ══════════════════════════════════════════════════════════════
# FIGURE 13 — TECHNICIAN WORKFLOW
# ══════════════════════════════════════════════════════════════
def fig13():
    fig, ax = new_fig('AeroEdge-X End-to-End Technician Workflow',
                      'CURRENT VERIFIED WORKFLOW')
    stages = [
        ('01  PREPARE', ['Open AeroEdge-X', 'Select aircraft', 'Configure inspection'], NAVY),
        ('02  CAPTURE', ['Local image', 'acquisition'], NAVY),
        ('03  INSPECT', ['YOLOv11 detection', 'Defect class / Confidence', 'Bounding box / Severity'], TEAL),
        ('04  UNDERSTAND', ['ChromaDB retrieval', 'Maintenance docs', 'Phi-3 Mini reasoning'], TEAL),
        ('05  RECORD', ['Technician review', 'SQLite persistence', 'Local artifacts'], NAVY),
        ('06  REPORT', ['PDF inspection', 'report generation'], NAVY),
    ]
    sw, sh = 14, 38
    gap = 1.8
    total_w = len(stages) * sw + (len(stages)-1) * gap
    sx = (100 - total_w) / 2
    sy = 28

    for i, (title, items, col) in enumerate(stages):
        x = sx + i * (sw + gap)
        # Stage container
        draw_zone(ax, x, sy, sw, sh, '', color=LIGHT, border=BORDER)
        # Stage header
        draw_box(ax, x + 0.8, sy + sh - 7, sw - 1.6, 5.5, title,
                 color=col, fontsize=7.5)
        # Items
        for j, item in enumerate(items):
            iy = sy + sh - 11 - j * 7
            draw_box(ax, x + 1.5, iy, sw - 3, 5, item,
                     color=WHITE, text_color=BLACK, fontsize=6.5, radius=0.2)
            # border
            ax.add_patch(FancyBboxPatch((x+1.5, iy), sw-3, 5,
                         boxstyle="round,pad=0.2", facecolor='none',
                         edgecolor=col, linewidth=0.6, alpha=0.5))
        # Arrow to next stage
        if i < len(stages) - 1:
            arrow_right(ax, x + sw, sy + sh/2, x + sw + gap, color=col, lw=1.2)

    # Stage number circles at bottom
    for i in range(len(stages)):
        x = sx + i * (sw + gap) + sw/2
        circle = plt.Circle((x, sy - 4), 2.5, facecolor=stages[i][2],
                            edgecolor='none', alpha=0.15)
        ax.add_patch(circle)
        ax.text(x, sy - 4, f'{i+1}', ha='center', va='center',
                fontsize=10, fontweight='bold', color=stages[i][2], fontfamily=FONT)

    save(fig, 'figure_13_technician_workflow.png')


# ══════════════════════════════════════════════════════════════
# FIGURE 14 — AI INSPECTION PIPELINE
# ══════════════════════════════════════════════════════════════
def fig14():
    fig, ax = new_fig('AeroEdge-X AI Inspection Pipeline',
                      'CURRENT VERIFIED IMPLEMENTATION')
    zones = [
        ('INPUT', NAVY, 4, 90, 14, 62),
        ('VISION', TEAL, 22, 90, 22, 62),
        ('KNOWLEDGE', NAVY, 48, 90, 22, 62),
        ('REASONING', TEAL, 74, 90, 22, 62),
    ]
    for label, col, x, top, w, h in zones:
        draw_zone(ax, x, top - h, w, h, label, color=LIGHT, border=col)

    # INPUT zone
    draw_box(ax, 6, 55, 10, 6, 'Image', color=NAVY, fontsize=8)

    # VISION zone
    draw_box(ax, 24, 75, 18, 5, 'OpenCV', sublabel='Preprocessing', color=TEAL, fontsize=7.5, sublabel_size=6)
    arrow_down(ax, 33, 75, 72, color=TEAL)
    draw_box(ax, 24, 65, 18, 5, 'YOLOv11', sublabel='Object Detection', color=TEAL, fontsize=7.5, sublabel_size=6)
    arrow_down(ax, 33, 65, 62, color=TEAL)
    # Detection evidence sub-items
    det_items = ['Defect Class', 'Confidence', 'Bounding Box', 'Severity']
    for j, item in enumerate(det_items):
        dy = 54 - j * 6
        draw_box(ax, 25, dy, 16, 4.5, item, color=WHITE, text_color=TEAL, fontsize=6.5)
        ax.add_patch(FancyBboxPatch((25, dy), 16, 4.5,
                     boxstyle="round,pad=0.2", facecolor='none',
                     edgecolor=TEAL, linewidth=0.5))

    # Arrow INPUT → VISION
    arrow_right(ax, 16, 58, 24, color=NAVY, lw=1.2)

    # KNOWLEDGE zone
    draw_box(ax, 50, 75, 18, 5, 'Inspection', sublabel='Context', color=NAVY, fontsize=7.5, sublabel_size=6)
    arrow_down(ax, 59, 75, 72, color=NAVY)
    draw_box(ax, 50, 65, 18, 5, 'ChromaDB', sublabel='Vector Search', color=NAVY, fontsize=7.5, sublabel_size=6)
    arrow_down(ax, 59, 65, 62, color=NAVY)
    draw_box(ax, 50, 55, 18, 5, 'Maintenance', sublabel='Local PDFs', color=NAVY, fontsize=7.5, sublabel_size=6)
    arrow_down(ax, 59, 55, 52, color=NAVY)
    draw_box(ax, 50, 45, 18, 5, 'Retrieved', sublabel='Evidence', color=WHITE, text_color=NAVY, fontsize=7.5, sublabel_size=6)
    ax.add_patch(FancyBboxPatch((50, 45), 18, 5,
                 boxstyle="round,pad=0.3", facecolor='none',
                 edgecolor=NAVY, linewidth=0.6))

    # Arrow VISION → KNOWLEDGE
    arrow_right(ax, 42, 58, 50, color=GRAY, lw=1.2)

    # REASONING zone
    draw_box(ax, 76, 70, 18, 5, 'Phi-3 Mini', sublabel='Local LLM', color=TEAL, fontsize=7.5, sublabel_size=6)
    arrow_down(ax, 85, 70, 67, color=TEAL)
    draw_box(ax, 76, 58, 18, 7, 'Grounded\nMaintenance\nGuidance', color=WHITE, text_color=TEAL, fontsize=7)
    ax.add_patch(FancyBboxPatch((76, 58), 18, 7,
                 boxstyle="round,pad=0.3", facecolor='none',
                 edgecolor=TEAL, linewidth=0.6))

    # Arrow KNOWLEDGE → REASONING
    arrow_right(ax, 68, 58, 76, color=GRAY, lw=1.2)

    # OUTPUT row at bottom
    draw_zone(ax, 22, 22, 74, 10, 'OUTPUT', color='#F0FFF4', border=TEAL)
    draw_box(ax, 30, 24, 18, 5.5, 'Inspection Record', sublabel='SQLite', color=NAVY, fontsize=7.5, sublabel_size=6)
    draw_box(ax, 60, 24, 18, 5.5, 'PDF Report', sublabel='ReportLab', color=NAVY, fontsize=7.5, sublabel_size=6)
    arrow_down(ax, 59, 45, 35, color=GRAY, lw=0.8)
    arrow_down(ax, 85, 58, 35, color=GRAY, lw=0.8)

    save(fig, 'figure_14_ai_inspection_pipeline.png')


# ══════════════════════════════════════════════════════════════
# FIGURE 15 — CURRENT SYSTEM ARCHITECTURE
# ══════════════════════════════════════════════════════════════
def fig15():
    fig, ax = new_fig('AeroEdge-X Current System Architecture',
                      'VERIFIED CURRENT IMPLEMENTATION')
    layers = [
        ('TECHNICIAN APPLICATION', NAVY, [('Electron', None), ('React UI', None)]),
        ('LOCAL SERVICE LAYER', GRAY, [('Flask REST API', None), ('Agent Orchestration', None)]),
        ('AI / KNOWLEDGE LAYER', TEAL, [('OpenCV', None), ('YOLOv11', None), ('ChromaDB', None),
                                         ('all-MiniLM-L6-v2', None), ('Phi-3 Mini / Ollama', None)]),
        ('LOCAL DATA & OUTPUT', NAVY, [('SQLite', None), ('Local Images', None),
                                        ('Inspection State', None), ('PDF Report', None)]),
    ]
    lh = 14
    gap = 2.5
    ly = 75
    for i, (title, col, items) in enumerate(layers):
        y = ly - i * (lh + gap)
        draw_zone(ax, 5, y - lh, 90, lh, title, color=LIGHT, border=col, label_color=col)
        # Items in a row
        n = len(items)
        iw = min(16, (88 - (n-1)*2) / n)
        total_iw = n * iw + (n-1) * 2
        ix_start = 5 + (90 - total_iw) / 2
        for j, (name, sub) in enumerate(items):
            ix = ix_start + j * (iw + 2)
            draw_box(ax, ix, y - lh + 2, iw, 6, name, sublabel=sub,
                     color=col, fontsize=7, sublabel_size=5.5)

        # Arrow down to next layer
        if i < len(layers) - 1:
            ny = y - lh - gap
            arrow_down(ax, 50, y - lh, ny + lh, color=GRAY, lw=1.0)

    # Status badge
    draw_box(ax, 60, 5, 30, 4, 'ALL COMPONENTS VERIFIED IN REPOSITORY',
             color=TEAL, fontsize=6.5)

    save(fig, 'figure_15_current_system_architecture.png')


# ══════════════════════════════════════════════════════════════
# FIGURE 16 — EDGE + CLOUD EVOLUTION
# ══════════════════════════════════════════════════════════════
def fig16():
    fig, ax = new_fig('AeroEdge-X Edge + Cloud Evolution')
    # Three columns
    cols = [
        ('CURRENT VERIFIED', TEAL, False, 5, [
            ('Electron Desktop', None), ('React UI', None),
            ('Flask Backend', None), ('YOLOv11 + ChromaDB', None),
            ('Phi-3 Mini / Ollama', None), ('SQLite', None), ('PDF Reports', None)
        ]),
        ('NEXT IMPLEMENTATION', ORANGE, True, 37, [
            ('Jetson Orin Nano', None), ('Industrial Camera', None),
            ('TensorRT / ONNX', None), ('Offline Sync Queue', None),
        ]),
        ('TARGET CLOUD', PURPLE, True, 69, [
            ('AWS API Gateway', None), ('DynamoDB', 'Metadata'),
            ('S3', 'Images / Reports'), ('Acknowledgement', None),
        ]),
    ]
    for title, col, dash, cx, items in cols:
        draw_zone(ax, cx, 10, 26, 78, title, color=LIGHT if not dash else WHITE,
                  border=col, label_color=col)
        for j, (name, sub) in enumerate(items):
            iy = 76 - j * 8.5
            draw_box(ax, cx + 2, iy, 22, 6, name, sublabel=sub,
                     color=col, dashed=dash, fontsize=7, sublabel_size=5.5)

    # Evolution arrows
    arrow_right(ax, 31, 48, 37, color=ORANGE, lw=1.5)
    arrow_right(ax, 63, 48, 69, color=PURPLE, lw=1.5, dashed=True)

    # Legend
    legend_box(ax, 3, 1, [
        (TEAL, 'Verified / Implemented', False),
        (ORANGE, 'Next Implementation', True),
        (PURPLE, 'Target / Future', True),
    ])

    save(fig, 'figure_16_edge_cloud_evolution.png')


# ══════════════════════════════════════════════════════════════
# FIGURE 17 — OFFLINE SYNC WORKFLOW
# ══════════════════════════════════════════════════════════════
def fig17():
    fig, ax = new_fig('AeroEdge-X Offline-First Synchronization',
                      'TARGET / NEXT IMPLEMENTATION')
    # Current verified part (left)
    draw_zone(ax, 3, 25, 22, 55, 'CURRENT VERIFIED', color='#F0FFF4', border=TEAL)
    draw_box(ax, 5, 65, 18, 6, 'Inspection\nComplete', color=TEAL, fontsize=7)
    arrow_down(ax, 14, 65, 62, color=TEAL)
    draw_box(ax, 5, 52, 18, 8, 'Save Locally', sublabel='SQLite', color=TEAL, fontsize=7, sublabel_size=6)
    arrow_down(ax, 14, 52, 49, color=TEAL)
    draw_box(ax, 5, 38, 18, 8, 'Local\nArtifacts', sublabel='Images + Reports', color=TEAL, fontsize=7, sublabel_size=6)

    # Planned part (right)
    draw_zone(ax, 28, 25, 68, 55, 'PLANNED — NEXT IMPLEMENTATION', color='#FFFBF0', border=ORANGE)

    draw_box(ax, 30, 65, 16, 6, 'Create Sync\nRecord', color=ORANGE, dashed=True, fontsize=7)
    arrow_right(ax, 25, 56, 30, color=ORANGE, dashed=True)
    arrow_down(ax, 38, 65, 62, color=ORANGE, dashed=True)

    draw_box(ax, 30, 55, 16, 6, 'PENDING', color=ORANGE, dashed=True, fontsize=8)
    arrow_down(ax, 38, 55, 52, color=ORANGE, dashed=True)

    # Decision diamond
    diamond = plt.Polygon([[38, 50], [44, 46], [38, 42], [32, 46]],
                          facecolor=WHITE, edgecolor=ORANGE, linewidth=1, linestyle='--')
    ax.add_patch(diamond)
    ax.text(38, 46, 'Internet?', ha='center', va='center', fontsize=6, color=ORANGE,
            fontweight='bold', fontfamily=FONT)

    # NO path
    arrow(ax, 32, 46, 30, 36, color=RED, dashed=True)
    draw_box(ax, 30, 28, 14, 6, 'Keep Local\nRetry Later', color=RED, dashed=True, fontsize=6.5)

    # YES path
    arrow_right(ax, 44, 46, 52, color=ORANGE, dashed=True)
    draw_box(ax, 52, 43, 14, 6, 'Sync\nWorker', color=ORANGE, dashed=True, fontsize=7)
    arrow_right(ax, 66, 46, 72, color=ORANGE, dashed=True)

    # Cloud targets
    draw_box(ax, 72, 55, 20, 6, 'DynamoDB', sublabel='Metadata', color=PURPLE, dashed=True, fontsize=7, sublabel_size=6)
    draw_box(ax, 72, 43, 20, 6, 'S3', sublabel='Images / Reports', color=PURPLE, dashed=True, fontsize=7, sublabel_size=6)
    arrow_down(ax, 82, 43, 40, color=PURPLE, dashed=True)
    draw_box(ax, 72, 31, 20, 6, 'ACK', color=PURPLE, dashed=True, fontsize=8)
    arrow(ax, 72, 34, 50, 34, color=TEAL, dashed=True)
    draw_box(ax, 48, 28, 16, 6, 'SYNCED', color=TEAL, dashed=True, fontsize=8)

    # Labels
    ax.text(30, 46, 'NO', ha='right', va='center', fontsize=6, color=RED, fontfamily=FONT, fontweight='bold')
    ax.text(48, 47.5, 'YES', ha='center', va='bottom', fontsize=6, color=ORANGE, fontfamily=FONT, fontweight='bold')

    legend_box(ax, 3, 3, [
        (TEAL, 'Verified / Current', False),
        (ORANGE, 'Planned Implementation', True),
        (PURPLE, 'Target Cloud Service', True),
    ])

    save(fig, 'figure_17_offline_sync_workflow.png')


# ══════════════════════════════════════════════════════════════
# FIGURE 18 — JETSON DEPLOYMENT
# ══════════════════════════════════════════════════════════════
def fig18():
    fig, ax = new_fig('AeroEdge-X Jetson Orin Nano Edge Deployment',
                      'TARGET EDGE DEPLOYMENT')
    # All dashed — not verified
    draw_zone(ax, 5, 12, 90, 76, 'TARGET DEPLOYMENT — NOT YET VERIFIED IN REPOSITORY',
              color='#FFFBF0', border=ORANGE)

    pipeline = [
        ('Industrial\nCamera', 'GigE / USB3', ORANGE),
        ('Frame\nCapture', 'OpenCV', ORANGE),
        ('Jetson Orin\nNano', 'JetPack 6.x', ORANGE),
        ('YOLOv11', 'TensorRT Engine', ORANGE),
        ('Local AI\nPipeline', 'RAG + LLM', ORANGE),
    ]
    bw, bh = 15, 10
    gap = 3.5
    total = len(pipeline) * bw + (len(pipeline)-1) * gap
    sx = (100 - total) / 2
    sy = 52

    for i, (name, sub, col) in enumerate(pipeline):
        x = sx + i * (bw + gap)
        draw_box(ax, x, sy, bw, bh, name, sublabel=sub, color=col,
                 dashed=True, fontsize=8, sublabel_size=6)
        if i < len(pipeline) - 1:
            arrow_right(ax, x + bw, sy + bh/2, x + bw + gap, color=ORANGE, dashed=True, lw=1.2)

    # Measurement plan strip
    draw_zone(ax, 10, 18, 80, 16, 'MEASUREMENT PLAN — VALIDATION REQUIRED',
              color=WHITE, border=ORANGE)
    measures = ['Inference Latency', 'GPU Utilization', 'RAM Usage', 'Temperature', 'Power Draw']
    mw = 14
    mx_start = 10 + (80 - len(measures)*mw - (len(measures)-1)*1.5) / 2
    for i, m in enumerate(measures):
        mx = mx_start + i * (mw + 1.5)
        draw_box(ax, mx, 21, mw, 5, m, sublabel='TBD',
                 color=GRAY, dashed=True, fontsize=6.5, sublabel_size=5.5)

    legend_box(ax, 3, 1, [
        (ORANGE, 'Target / Not Yet Implemented', True),
        (GRAY, 'Measurement Pending', True),
    ])

    save(fig, 'figure_18_jetson_edge_deployment.png')


# ══════════════════════════════════════════════════════════════
# FIGURE 19 — AWS ARCHITECTURE
# ══════════════════════════════════════════════════════════════
def fig19():
    fig, ax = new_fig('AeroEdge-X AWS Synchronization Architecture',
                      'TARGET ARCHITECTURE')
    # Edge zone (left)
    draw_zone(ax, 3, 15, 35, 72, 'EDGE — CURRENT VERIFIED', color='#F0FFF4', border=TEAL)
    draw_box(ax, 8, 72, 25, 6, 'Local Inspection', sublabel='Verified', color=TEAL, fontsize=7.5, sublabel_size=6)
    arrow_down(ax, 20, 72, 69, color=TEAL)
    draw_box(ax, 8, 60, 25, 6, 'SQLite + Artifacts', sublabel='Verified', color=TEAL, fontsize=7.5, sublabel_size=6)
    arrow_down(ax, 20, 60, 57, color=ORANGE, dashed=True)
    draw_box(ax, 8, 47, 25, 6, 'Sync Queue', sublabel='Planned', color=ORANGE, dashed=True, fontsize=7.5, sublabel_size=6)
    arrow_down(ax, 20, 47, 44, color=ORANGE, dashed=True)
    draw_box(ax, 8, 34, 25, 6, 'Connectivity\nCheck', color=ORANGE, dashed=True, fontsize=7.5)

    # Arrow to cloud
    arrow_right(ax, 38, 50, 45, color=ORANGE, dashed=True, lw=1.5)
    ax.text(41.5, 52, 'Secure API', ha='center', va='bottom', fontsize=6, color=ORANGE,
            fontfamily=FONT, fontstyle='italic')

    # Cloud zone (right)
    draw_zone(ax, 45, 15, 52, 72, 'CLOUD — TARGET ARCHITECTURE', color='#FBF5FF', border=PURPLE)
    draw_box(ax, 50, 72, 20, 6, 'API Gateway', color=PURPLE, dashed=True, fontsize=7.5)
    draw_box(ax, 75, 72, 18, 6, 'Lambda', color=PURPLE, dashed=True, fontsize=7.5)
    arrow_right(ax, 70, 75, 75, color=PURPLE, dashed=True)

    draw_box(ax, 50, 55, 20, 8, 'DynamoDB', sublabel='Inspection Metadata',
             color=PURPLE, dashed=True, fontsize=8, sublabel_size=6)
    draw_box(ax, 75, 55, 18, 8, 'S3', sublabel='Images / Reports',
             color=PURPLE, dashed=True, fontsize=8, sublabel_size=6)

    arrow_down(ax, 60, 72, 65, color=PURPLE, dashed=True)
    arrow_down(ax, 84, 72, 65, color=PURPLE, dashed=True)

    # Return path
    draw_box(ax, 58, 38, 25, 6, 'Acknowledgement', color=PURPLE, dashed=True, fontsize=7.5)
    arrow_down(ax, 70, 55, 46, color=PURPLE, dashed=True)
    arrow(ax, 58, 41, 38, 41, color=TEAL, dashed=True, lw=1.2)

    draw_box(ax, 8, 20, 25, 6, 'Local Status\nUpdated', sublabel='SYNCED', color=TEAL, dashed=True, fontsize=7.5, sublabel_size=6)
    arrow_down(ax, 20, 34, 28, color=TEAL, dashed=True)

    legend_box(ax, 50, 18, [
        (TEAL, 'Verified / Current', False),
        (ORANGE, 'Planned Edge', True),
        (PURPLE, 'Target Cloud', True),
    ])

    save(fig, 'figure_19_aws_architecture.png')


# ══════════════════════════════════════════════════════════════
# FIGURE 20 — INSPECTION DATA FLOW
# ══════════════════════════════════════════════════════════════
def fig20():
    fig, ax = new_fig('AeroEdge-X Inspection Data Flow')
    # Vertical data flow with field annotations
    data_steps = [
        ('Aircraft / Component', None, NAVY, False, []),
        ('Inspection Context', None, NAVY, False, ['aircraft_id', 'component_id']),
        ('Image', None, NAVY, False, ['image_path']),
        ('Detection Metadata', 'Vision Agent', TEAL, False,
         ['defect_class', 'confidence', 'bounding_box', 'severity']),
        ('Maintenance Context', 'RAG Agent', TEAL, False,
         ['source', 'page', 'procedure']),
        ('AI Guidance', 'Reasoning Agent', TEAL, False,
         ['reasoning_steps']),
        ('Inspection Record', 'Digital Twin', NAVY, False,
         ['inspection_id', 'timestamp']),
        ('Report Artifact', 'Report Generator', NAVY, False, ['pdf_path']),
        ('Local Storage', 'SQLite + Filesystem', NAVY, False, []),
        ('Cloud Sync', None, PURPLE, True, ['sync_status']),
    ]
    n = len(data_steps)
    bh, bw = 5.5, 22
    gap = 1.8
    total_h = n * bh + (n-1) * gap
    sy = 88 - (100 - total_h) / 2
    cx = 38

    for i, (name, agent, col, dash, fields) in enumerate(data_steps):
        y = sy - i * (bh + gap)
        draw_box(ax, cx, y, bw, bh, name, sublabel=agent, color=col,
                 dashed=dash, fontsize=7, sublabel_size=5.5)
        # Fields on the right
        if fields:
            for j, f in enumerate(fields):
                fx = cx + bw + 3
                fy = y + bh - 1.5 - j * 2.2
                ax.text(fx, fy, f'• {f}', ha='left', va='center',
                        fontsize=5.5, color=GRAY, fontfamily=FONT, fontstyle='italic')
        # Arrow
        if i < n - 1:
            next_dash = data_steps[i+1][3]
            arrow_down(ax, cx + bw/2, y, y - gap, color=GRAY,
                       dashed=next_dash, lw=0.8)

    # Category labels on the left
    categories = [
        (0, 2, 'RAW EVIDENCE', NAVY),
        (3, 5, 'DERIVED AI DATA', TEAL),
        (6, 8, 'PERSISTED RECORD', NAVY),
        (9, 9, 'FUTURE CLOUD', PURPLE),
    ]
    for start, end, label, col in categories:
        y_top = sy - start * (bh + gap) + bh
        y_bot = sy - end * (bh + gap)
        mid_y = (y_top + y_bot) / 2
        ax.plot([cx - 5, cx - 5], [y_bot + 1, y_top - 1], color=col, lw=1.5)
        ax.text(cx - 6, mid_y, label, ha='right', va='center', fontsize=6,
                color=col, fontfamily=FONT, fontweight='bold', rotation=90)

    save(fig, 'figure_20_inspection_data_flow.png')


# ══════════════════════════════════════════════════════════════
# FIGURE 21 — EVIDENCE TRACEABILITY
# ══════════════════════════════════════════════════════════════
def fig21():
    fig, ax = new_fig('AeroEdge-X Inspection Evidence Traceability',
                      'CURRENT VERIFIED CHAIN')
    stages = [
        ('VISUAL\nEVIDENCE', NAVY, [
            'Captured Image', 'Defect Detection', 'Bounding Box\n+ Confidence'
        ]),
        ('MAINTENANCE\nEVIDENCE', TEAL, [
            'Maintenance Doc', 'Source + Page', 'Retrieved Context'
        ]),
        ('GENERATED\nGUIDANCE', NAVY, [
            'Phi-3 Mini', 'AI Guidance'
        ]),
        ('HUMAN\nREVIEW', GRAY, [
            'Technician\nReview'
        ]),
        ('RECORDED\nOUTPUT', TEAL, [
            'Inspection Record', 'Final Report'
        ]),
    ]
    sw = 16.5
    gap = 2
    total = len(stages) * sw + (len(stages)-1) * gap
    sx = (100 - total) / 2
    sh = 55

    for i, (title, col, items) in enumerate(stages):
        x = sx + i * (sw + gap)
        # Stage zone
        draw_zone(ax, x, 20, sw, sh, '', color=LIGHT, border=col)
        # Header
        draw_box(ax, x + 0.5, 20 + sh - 9, sw - 1, 7, title,
                 color=col, fontsize=7)
        # Items stacked
        for j, item in enumerate(items):
            iy = 20 + sh - 14 - j * 10
            draw_box(ax, x + 1, iy, sw - 2, 7, item,
                     color=WHITE, text_color=BLACK, fontsize=6.5)
            ax.add_patch(FancyBboxPatch((x+1, iy), sw-2, 7,
                         boxstyle="round,pad=0.2", facecolor='none',
                         edgecolor=col, linewidth=0.5))
            # Vertical connector within stage
            if j > 0:
                arrow_down(ax, x + sw/2, iy + 7 + 1.5, iy + 7, color=col, lw=0.6)

        # Arrow to next stage
        if i < len(stages) - 1:
            ax.annotate('', xy=(x + sw + gap, 48), xytext=(x + sw, 48),
                        arrowprops=dict(arrowstyle='->', color=col, lw=1.2))

    # Chain label at bottom
    chain_items = ['Image', '→', 'Evidence', '→', 'Source', '→', 'Guidance', '→', 'Record', '→', 'Report']
    chain_text = '   '.join(chain_items)
    ax.text(50, 12, chain_text, ha='center', va='center',
            fontsize=9, fontweight='bold', color=NAVY, fontfamily=FONT)
    ax.add_patch(FancyBboxPatch((15, 9), 70, 7,
                 boxstyle="round,pad=0.3", facecolor=LIGHT,
                 edgecolor=NAVY, linewidth=0.8))

    save(fig, 'figure_21_evidence_traceability.png')


# ══════════════════════════════════════════════════════════════
# FIGURE 22 — STATUS + ROADMAP
# ══════════════════════════════════════════════════════════════
def fig22():
    fig, ax = new_fig('AeroEdge-X Current Status & Roadmap')
    milestones = [
        ('M1', 'Core AI POC', 'COMPLETED', TEAL, [
            'YOLOv11 detection', 'ChromaDB retrieval',
            'Phi-3 Mini reasoning', 'SQLite persistence', 'PDF reporting'
        ]),
        ('M2', 'Architecture\n& UI', 'COMPLETED', TEAL, [
            'System architecture', 'Stage 2 UI', 'Electron desktop'
        ]),
        ('M3', 'Jetson +\nCamera + AWS', 'NEXT', ORANGE, [
            'Jetson Orin Nano', 'Industrial camera',
            'TensorRT', 'AWS sync'
        ]),
        ('M4', 'Prototype\nValidation', 'REMAINING', ORANGE, [
            'Pipeline integration', 'Image-set validation',
            'Latency profiling', 'Offline test'
        ]),
        ('M5', 'Stage 3\nTarget', 'JAN 2027', PURPLE, [
            'End-to-end prototype'
        ]),
        ('M6', 'Future\nScope', 'BEYOND S3', PURPLE, [
            'Thermal / Multimodal', 'Fleet analytics',
            'Advanced digital twin', 'Production controls'
        ]),
    ]

    # Timeline line
    line_y = 55
    ax.plot([6, 94], [line_y, line_y], color=BORDER, lw=2, zorder=0)

    mw = 13
    gap = 1.3
    total = len(milestones) * mw + (len(milestones)-1) * gap
    sx = (100 - total) / 2

    for i, (num, title, status, col, items) in enumerate(milestones):
        x = sx + i * (mw + gap)
        # Dot on timeline
        circle = plt.Circle((x + mw/2, line_y), 1.5, facecolor=col,
                            edgecolor=WHITE, linewidth=2, zorder=2)
        ax.add_patch(circle)
        ax.text(x + mw/2, line_y, num, ha='center', va='center',
                fontsize=5.5, fontweight='bold', color=WHITE, fontfamily=FONT, zorder=3)

        # Status badge above
        badge_y = line_y + 4
        draw_box(ax, x + 1, badge_y, mw - 2, 3.5, status,
                 color=col, fontsize=5.5, radius=0.2)

        # Title above badge
        ax.text(x + mw/2, badge_y + 5.5, title, ha='center', va='center',
                fontsize=7, fontweight='bold', color=BLACK, fontfamily=FONT)

        # Items below timeline
        for j, item in enumerate(items):
            iy = line_y - 6 - j * 4.5
            ax.text(x + mw/2, iy, f'• {item}', ha='center', va='center',
                    fontsize=5.5, color=GRAY, fontfamily=FONT)

    save(fig, 'figure_22_current_status_roadmap.png')


# ══════════════════════════════════════════════════════════════
# FIGURE 23 — FUTURE EVOLUTION
# ══════════════════════════════════════════════════════════════
def fig23():
    fig, ax = new_fig('AeroEdge-X Future Evolution')
    groups = [
        ('INSPECTION', TEAL, [
            'Current Edge\nPrototype', 'Real-Time\nIndustrial Camera', 'Thermal\nSensing',
            'RGB + Thermal\nMultimodal'
        ]),
        ('EDGE', NAVY, [
            'Multi-Camera\nInspection', 'Multi-Jetson\nEdge Fleet'
        ]),
        ('FLEET', ORANGE, [
            'AWS Fleet\nAnalytics', 'Advanced\nDigital Twin'
        ]),
        ('INTELLIGENCE', TEAL, [
            'Predictive\nMaintenance', 'Technician\nFeedback', 'Model Monitoring\n& Retraining'
        ]),
        ('PRODUCTION', PURPLE, [
            'Production\nGovernance'
        ]),
    ]

    gx = 3
    gy_top = 82
    bw, bh = 10, 9
    arrow_gap = 1.5

    for gi, (group_name, col, items) in enumerate(groups):
        gw = len(items) * (bw + 1.5) + 3
        draw_zone(ax, gx, 28, gw, 55, group_name, color=LIGHT, border=col, label_color=col)

        for j, item in enumerate(items):
            ix = gx + 1.5 + j * (bw + 1.5)
            draw_box(ax, ix, 45, bw, bh, item,
                     color=col if gi == 0 and j == 0 else col,
                     dashed=(gi > 0 or j > 0),
                     fontsize=6, sublabel_size=5)
            # Arrow within group
            if j < len(items) - 1:
                arrow_right(ax, ix + bw, 45 + bh/2, ix + bw + 1.5,
                           color=col, dashed=True, lw=0.7)

        # Arrow to next group
        if gi < len(groups) - 1:
            next_gx = gx + gw + arrow_gap
            arrow_right(ax, gx + gw, 49.5, next_gx, color=GRAY, dashed=True, lw=1.0)
            gx = next_gx
        else:
            gx = gx + gw + arrow_gap

    # Production requirements strip
    prod_items = ['Human Approval', 'Audit Trail', 'RBAC', 'Device Identity',
                  'Encryption', 'Versioned Models', 'Signed Updates', 'Rollback']
    draw_zone(ax, 3, 8, 94, 14, 'PRODUCTION REQUIREMENTS — FUTURE',
              color='#FBF5FF', border=PURPLE)
    piw = 10.5
    px_start = 3 + (94 - len(prod_items)*piw - (len(prod_items)-1)*0.6) / 2
    for i, p in enumerate(prod_items):
        px = px_start + i * (piw + 0.6)
        draw_box(ax, px, 10, piw, 5, p, color=PURPLE, dashed=True, fontsize=5.5)

    save(fig, 'figure_23_future_evolution.png')


# ══════════════════════════════════════════════════════════════
# FIGURE 24 — VALIDATION MATRIX
# ══════════════════════════════════════════════════════════════
def fig24():
    fig, ax = new_fig('AeroEdge-X Prototype Validation Plan', w=16, h=10)

    headers = ['VALIDATION AREA', 'TEST', 'STATUS', 'EVIDENCE / MEASUREMENT']
    rows = [
        ['Offline Inspection', 'Complete workflow without Internet', 'VERIFIED',
         'rag_agent.py: HF_HUB_OFFLINE=1'],
        ['Defect Detection', 'Detection + localization', 'VERIFIED',
         'vision_agent.py: YOLOv11 via ultralytics'],
        ['RAG Retrieval', 'Correct source + page', 'VERIFIED',
         'rag_agent.py: ChromaDB + PyMuPDFLoader'],
        ['Local Reasoning', 'Guidance grounded in retrieved context', 'VERIFIED',
         'reasoning_agent.py: Ollama Phi-3 Mini'],
        ['Persistence', 'Inspection saved locally', 'VERIFIED',
         'digital_twin.py: SQLite log_inspection()'],
        ['Reporting', 'PDF generated', 'VERIFIED',
         'report_generator.py: ReportLab'],
        ['Jetson', 'Edge inference', 'PLANNED',
         'No JetPack / TensorRT scripts found'],
        ['Camera', 'Live image acquisition', 'PARTIAL',
         'Upload works; no VideoCapture code'],
        ['Synchronization', 'Offline queue + reconnect', 'PLANNED',
         'No sync queue or AWS code found'],
        ['Recovery', 'Restart / network failure', 'PLANNED',
         'Offline queue roadmap'],
        ['Performance', 'Latency / RAM / GPU / temperature', 'PLANNED',
         'Benchmarking planned for Stage 3'],
    ]

    status_colors = {
        'VERIFIED': TEAL, 'PARTIAL': ORANGE,
        'PLANNED': GRAY, 'NOT VERIFIED': RED
    }

    col_widths = [18, 28, 10, 35]
    col_x = [5]
    for w in col_widths[:-1]:
        col_x.append(col_x[-1] + w)

    row_h = 5.2
    header_h = 5.5
    header_y = 82

    # Header row
    for j, hdr in enumerate(headers):
        draw_box(ax, col_x[j], header_y, col_widths[j], header_h, hdr,
                 color=NAVY, fontsize=7)

    # Data rows
    for i, row in enumerate(rows):
        y = header_y - header_h - 0.5 - i * (row_h + 0.5)
        bg = LIGHT if i % 2 == 0 else WHITE
        for j, cell in enumerate(row):
            fc = bg
            tc = BLACK
            fw = 'normal'
            if j == 2:  # Status column
                sc = status_colors.get(cell, GRAY)
                fc = sc
                tc = WHITE
                fw = 'bold'
            box = FancyBboxPatch((col_x[j], y), col_widths[j], row_h,
                                boxstyle="round,pad=0.15", facecolor=fc,
                                edgecolor=BORDER, linewidth=0.4)
            ax.add_patch(box)
            ax.text(col_x[j] + col_widths[j]/2, y + row_h/2, cell,
                    ha='center', va='center', fontsize=6, color=tc,
                    fontfamily=FONT, fontweight=fw)

    save(fig, 'figure_24_validation_matrix.png')


# ══════════════════════════════════════════════════════════════
# FIGURE 25 — ARCHITECTURE EVOLUTION
# ══════════════════════════════════════════════════════════════
def fig25():
    fig, ax = new_fig('AeroEdge-X Architecture Evolution')
    stages_data = [
        ('STAGE 1 — LOCAL POC', 'VERIFIED', TEAL, False,
         ['Electron', 'Flask', 'YOLOv11', 'ChromaDB', 'Phi-3', 'SQLite', 'PDF']),
        ('STAGE 2 — EDGE / CLOUD', 'NEXT TARGET', ORANGE, True,
         ['Jetson', 'Camera', 'TensorRT', 'Sync Queue', 'AWS']),
        ('STAGE 3 — SCALABLE', 'FUTURE', PURPLE, True,
         ['Multi-Jetson', 'Fleet', 'Digital Twin', 'Analytics', 'Prod Controls']),
    ]
    pw = 28
    gap = 4
    total = len(stages_data) * pw + (len(stages_data)-1) * gap
    sx = (100 - total) / 2

    for i, (title, status, col, dash, items) in enumerate(stages_data):
        x = sx + i * (pw + gap)
        # Panel zone
        draw_zone(ax, x, 15, pw, 72, '', color=LIGHT if not dash else WHITE, border=col)
        # Panel header
        draw_box(ax, x + 1, 77, pw - 2, 8, title, color=col, fontsize=8, dashed=dash)
        # Status badge
        draw_box(ax, x + pw/2 - 6, 70, 12, 4, status, color=col, fontsize=6, dashed=dash, radius=0.2)
        # Items
        iw = pw - 4
        for j, item in enumerate(items):
            iy = 62 - j * 7
            draw_box(ax, x + 2, iy, iw, 5, item, color=col, dashed=dash,
                     fontsize=7, radius=0.2)

        # Arrow to next
        if i < len(stages_data) - 1:
            arrow_right(ax, x + pw, 50, x + pw + gap, color=col, dashed=True, lw=1.5)

    legend_box(ax, 3, 2, [
        (TEAL, 'Verified / Implemented', False),
        (ORANGE, 'Next Target', True),
        (PURPLE, 'Future Scope', True),
    ])

    save(fig, 'figure_25_architecture_evolution.png')


# ══════════════════════════════════════════════════════════════
# MAIN
# ══════════════════════════════════════════════════════════════
if __name__ == '__main__':
    print("AeroEdge-X Pre-Read Figure Generator")
    print("=" * 50)
    fig13()
    fig14()
    fig15()
    fig16()
    fig17()
    fig18()
    fig19()
    fig20()
    fig21()
    fig22()
    fig23()
    fig24()
    fig25()
    print("=" * 50)
    print(f"All figures saved to: {OUT_DIR}")
