import matplotlib.pyplot as plt

import numpy as np

data = [
    ["Offline inspection", "Complete inspection without Internet", "VERIFIED", "rag_agent.py (HF_HUB_OFFLINE=1)"],
    ["Defect detection", "Detection + localization", "VERIFIED", "YOLOv11 implementation in vision_agent.py"],
    ["RAG retrieval", "Correct maintenance document + page", "VERIFIED", "ChromaDB + PyMuPDFLoader in rag_agent.py"],
    ["Local reasoning", "Guidance grounded in retrieved context", "VERIFIED", "Ollama Phi-3 integration in reasoning_agent.py"],
    ["Persistence", "Inspection saved locally", "VERIFIED", "SQLite digital_twin.py"],
    ["Reporting", "PDF generated", "VERIFIED", "report_generator.py"],
    ["Jetson", "Edge inference", "NOT VERIFIED", "No JetPack/TensorRT scripts found"],
    ["Camera", "Image acquisition", "PARTIAL", "Local upload works; live streaming pending"],
    ["Synchronization", "Offline queue + reconnect", "NOT VERIFIED", "No AWS sync logic implemented"],
    ["Recovery", "Restart / network failure", "PLANNED", "Offline queue roadmap"],
    ["Performance", "Latency / RAM / GPU / temperature", "PLANNED", "Benchmarking planned for Stage 3"]
]

columns = ["VALIDATION AREA", "TEST", "CURRENT STATUS", "EVIDENCE REQUIRED"]

fig, ax = plt.subplots(figsize=(12, 6), dpi=300)
ax.axis('tight')
ax.axis('off')

# Colors matching the requested palette
header_color = '#0000B3'
row_colors = ['#F8FAFC', '#ffffff'] * len(data)
edge_color = '#5F6673'

table = ax.table(cellText=data,
                 colLabels=columns,
                 cellLoc='left',
                 loc='center')

table.auto_set_font_size(False)
table.set_fontsize(10)
table.scale(1.2, 2.0)

for (row, col), cell in table.get_celld().items():
    if row == 0:
        cell.set_text_props(color='white', weight='bold')
        cell.set_facecolor(header_color)
    else:
        cell.set_facecolor(row_colors[(row-1) % 2])
        
        # Color coding for CURRENT STATUS
        if col == 2:
            status = cell.get_text().get_text()
            if status == "VERIFIED":
                cell.set_text_props(color='#12C6B3', weight='bold')
            elif status == "PARTIAL" or status == "PLANNED":
                cell.set_text_props(color='#FF9C00', weight='bold')
            elif status == "NOT VERIFIED":
                cell.set_text_props(color='red', weight='bold')

    cell.set_edgecolor(edge_color)

plt.title("AeroEdge-X Prototype Validation Plan", color='#0000B3', weight='bold', size=16, pad=20)
plt.tight_layout()
plt.savefig("docs/pre-read/figures/figure_24_validation_matrix.png", bbox_inches='tight')
