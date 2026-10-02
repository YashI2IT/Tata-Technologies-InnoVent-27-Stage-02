import os
import matplotlib.pyplot as plt
from matplotlib.patches import FancyBboxPatch, FancyArrowPatch, Rectangle, PathPatch
from matplotlib.path import Path

# Colors
NAVY = '#0000B3'
TEAL = '#12C6B3'
ORANGE = '#FF9C00'
BLACK = '#000000'
GRAY = '#5F6673'
LIGHT_GRAY = '#F0F2F5'
WHITE = '#FFFFFF'

FONT = 'sans-serif'
DPI = 300
WIDTH = 3840 / DPI
HEIGHT = 2160 / DPI

OUT_DIR = os.path.dirname(__file__)

def setup_canvas():
    fig, ax = plt.subplots(figsize=(WIDTH, HEIGHT), dpi=DPI)
    ax.set_xlim(0, 100)
    ax.set_ylim(0, 100)
    ax.axis('off')
    return fig, ax

def draw_panel(ax, x, y, w, h, title, title_color=NAVY):
    # Background panel
    radius = 1.0
    panel = FancyBboxPatch((x+radius, y+radius), w-2*radius, h-2*radius, 
                           boxstyle=f"round,pad={radius}",
                           facecolor=LIGHT_GRAY, edgecolor='none')
    ax.add_patch(panel)
    
    # Title bar
    # A simple filled rectangle or rounded top
    # We will just draw a box at the top of the panel
    th = 8
    ty = y + h - th
    tbar = FancyBboxPatch((x+radius, ty+radius), w-2*radius, th-2*radius, 
                           boxstyle=f"round,pad={radius}",
                           facecolor=title_color, edgecolor='none')
    ax.add_patch(tbar)
    
    # Cover the bottom corners of the title bar to make it flat at the bottom
    rect = Rectangle((x, ty), w, radius*2, facecolor=title_color, edgecolor='none')
    ax.add_patch(rect)
    
    # Title Text
    ax.text(x + w/2, ty + th/2, title, ha='center', va='center', 
            color=WHITE, fontsize=12, fontweight='bold', fontfamily=FONT)

def draw_node(ax, x, y, w, h, lines, color=WHITE, border_color=GRAY, text_color=BLACK, radius=0.5):
    box = FancyBboxPatch((x+radius, y+radius), w-2*radius, h-2*radius, 
                         boxstyle=f"round,pad={radius}",
                         facecolor=color, edgecolor=border_color, linewidth=1.5)
    ax.add_patch(box)
    
    if isinstance(lines, list):
        cy = y + h - 2
        for i, line in enumerate(lines):
            fw = 'bold' if i == 0 else 'normal'
            fs = 10 if i == 0 else 8
            if i > 0:
                cy -= 2.5
            ax.text(x + w/2, cy, line, ha='center', va='top', 
                    color=text_color, fontsize=fs, fontweight=fw, fontfamily=FONT)
    else:
        ax.text(x + w/2, y + h/2, lines, ha='center', va='center', 
                color=text_color, fontsize=10, fontweight='bold', fontfamily=FONT)
    return x + w/2, y, x + w/2, y + h  # cx, bottom_y, cx, top_y

def draw_arrow(ax, x1, y1, x2, y2, color=GRAY):
    a = FancyArrowPatch((x1, y1), (x2, y2),
                        arrowstyle='-|>', color=color,
                        mutation_scale=15, lw=1.5,
                        connectionstyle='arc3,rad=0')
    ax.add_patch(a)

def draw_person(ax, cx, cy):
    # Draw simple professional icon
    # Head
    head = plt.Circle((cx, cy + 3), 1.5, color=NAVY)
    ax.add_patch(head)
    # Body
    body = FancyBboxPatch((cx - 2, cy - 3), 4, 5, boxstyle="round,pad=0.5", facecolor=NAVY, edgecolor='none')
    ax.add_patch(body)
    ax.text(cx, cy - 5, "TECHNICIAN", ha='center', va='top', color=NAVY, fontsize=10, fontweight='bold', fontfamily=FONT)

def create_figure_13():
    fig, ax = setup_canvas()
    
    # Title
    ax.text(4, 92, "Figure 13 — AeroEdge-X End-to-End Technician Workflow", 
            fontsize=20, fontweight='bold', color=NAVY, fontfamily=FONT)
    
    # Status
    # Top right label
    sw, sh = 20, 4
    sx, sy = 96 - sw, 92
    box = FancyBboxPatch((sx+0.5, sy+0.5), sw-1, sh-1, boxstyle="round,pad=0.5", facecolor=WHITE, edgecolor=TEAL, linewidth=1.5)
    ax.add_patch(box)
    ax.text(sx + sw/2, sy + sh/2, "CURRENT VERIFIED WORKFLOW", ha='center', va='center', color=NAVY, fontsize=9, fontweight='bold')
    
    # Layout
    panel_y = 15
    panel_h = 65
    panel_w = 12
    gap = 2.5
    start_x = 14
    
    # Panels
    panels = [
        ("01 PREPARE", NAVY),
        ("02 CAPTURE", NAVY),
        ("03 INSPECT", TEAL),
        ("04 UNDERSTAND", TEAL),
        ("05 RECORD", NAVY),
        ("06 REPORT", ORANGE)
    ]
    
    xs = []
    for i, (title, color) in enumerate(panels):
        px = start_x + i*(panel_w + gap)
        xs.append(px)
        draw_panel(ax, px, panel_y, panel_w, panel_h, title, title_color=color)
        
    # Draw Technician
    tx, ty = 6, panel_y + panel_h - 15
    draw_person(ax, tx, ty)
    
    # 01 Nodes
    n1_1 = draw_node(ax, xs[0]+1, panel_y+45, 10, 6, "Open AeroEdge-X")
    n1_2 = draw_node(ax, xs[0]+1, panel_y+30, 10, 8, ["Select aircraft /", "component"])
    n1_3 = draw_node(ax, xs[0]+1, panel_y+15, 10, 8, ["Configure", "inspection"])
    
    draw_arrow(ax, n1_1[0], n1_1[1], n1_2[2], n1_2[3])
    draw_arrow(ax, n1_2[0], n1_2[1], n1_3[2], n1_3[3])
    
    # 02 Node
    n2_1 = draw_node(ax, xs[1]+1, panel_y+30, 10, 8, ["Local image", "acquisition"])
    
    # 03 Nodes
    n3_1 = draw_node(ax, xs[2]+1, panel_y+40, 10, 6, "YOLOv11", border_color=TEAL)
    n3_2 = draw_node(ax, xs[2]+1, panel_y+20, 10, 12, ["Detection Evidence", "Defect class", "Confidence", "Bounding box", "Severity"], border_color=TEAL)
    
    draw_arrow(ax, n3_1[0], n3_1[1], n3_2[2], n3_2[3], color=TEAL)
    
    # 04 Nodes
    n4_1 = draw_node(ax, xs[3]+1, panel_y+40, 10, 10, ["ChromaDB", "Local maintenance", "documents"], border_color=TEAL)
    n4_2 = draw_node(ax, xs[3]+1, panel_y+20, 10, 8, ["Phi-3 Mini", "Local Runtime"], border_color=TEAL)
    
    draw_arrow(ax, n4_1[0], n4_1[1], n4_2[2], n4_2[3], color=TEAL)
    
    # 05 Nodes
    n5_1 = draw_node(ax, xs[4]+1, panel_y+40, 10, 6, "Technician review")
    n5_2 = draw_node(ax, xs[4]+1, panel_y+25, 10, 6, "SQLite")
    n5_3 = draw_node(ax, xs[4]+1, panel_y+10, 10, 6, "Local artifacts")
    
    draw_arrow(ax, n5_1[0], n5_1[1], n5_2[2], n5_2[3])
    draw_arrow(ax, n5_2[0], n5_2[1], n5_3[2], n5_3[3])
    
    # 06 Node
    n6_1 = draw_node(ax, xs[5]+1, panel_y+30, 10, 10, ["PDF inspection", "report generation"], border_color=ORANGE)
    
    # Cross panel arrows
    draw_arrow(ax, tx + 4, ty, n1_1[0], n1_1[3] + (ty - n1_1[3])) # tech to node 1
    
    def connect_panels(ax, left_node, right_node, color=GRAY):
        draw_arrow(ax, left_node[0]+5, (left_node[1]+left_node[3])/2, right_node[0]-5, (right_node[1]+right_node[3])/2, color=color)
        
    connect_panels(ax, n1_3, n2_1)
    connect_panels(ax, n2_1, n3_1)
    connect_panels(ax, n3_2, n4_1, color=TEAL)
    connect_panels(ax, n4_2, n5_1)
    connect_panels(ax, n5_2, n6_1)
    
    # Bottom message
    ax.text(50, 5, "I N S P E C T  →  U N D E R S T A N D  →  R E C O R D  →  R E P O R T", ha='center', va='center', color=GRAY, fontsize=12, fontweight='bold')

    # Manual arrow routing adjustments if needed
    
    output_path = os.path.join(OUT_DIR, "figure_13_technician_workflow.png")
    fig.savefig(output_path, dpi=DPI, facecolor=WHITE, edgecolor='none')
    plt.close(fig)
    print(f"[OK] Saved {output_path}")

if __name__ == "__main__":
    create_figure_13()
