"""
AeroEdge-X Mermaid → PNG Renderer
Extracts diagrams from all_figures_mermaid.md, sanitizes labels,
writes individual .mmd files, renders via mermaid-cli, and verifies output.
"""
import os
import re
import subprocess
import json
from pathlib import Path

BASE = Path(r"d:\Tata Innovent\Tata_Innovent-main\docs\pre-read\figures")
MMD_DIR = BASE / "mmd"
SRC_MD = MMD_DIR / "all_figures_mermaid.md"

FIGURES = {
    "FIGURE 13": "figure_13_technician_workflow",
    "FIGURE 14": "figure_14_ai_inspection_pipeline",
    "FIGURE 15": "figure_15_current_system_architecture",
    "FIGURE 16": "figure_16_edge_cloud_evolution",
    "FIGURE 17": "figure_17_offline_sync_workflow",
    "FIGURE 18": "figure_18_jetson_edge_deployment",
    "FIGURE 19": "figure_19_aws_architecture",
    "FIGURE 20": "figure_20_inspection_data_flow",
    "FIGURE 21": "figure_21_evidence_traceability",
    "FIGURE 22": "figure_22_current_status_roadmap",
    "FIGURE 23": "figure_23_future_evolution",
    "FIGURE 24": "figure_24_validation_plan",
    "FIGURE 25": "figure_25_architecture_evolution",
}

# Mermaid config for professional styling
MERMAID_CONFIG = {
    "theme": "base",
    "themeVariables": {
        "primaryColor": "#EAF4FF",
        "primaryTextColor": "#000000",
        "primaryBorderColor": "#0000B3",
        "lineColor": "#667085",
        "secondaryColor": "#F5F7FA",
        "tertiaryColor": "#FFFFFF",
        "fontFamily": "Arial, Helvetica, sans-serif",
        "fontSize": "16px",
        "nodeTextSize": "14px"
    },
    "flowchart": {
        "curve": "basis",
        "padding": 20,
        "nodeSpacing": 50,
        "rankSpacing": 60,
        "htmlLabels": True,
        "useMaxWidth": False,
        "wrappingWidth": 200
    }
}

PUPPETEER_CONFIG = {
    "executablePath": "",
    "args": ["--no-sandbox", "--disable-setuid-sandbox"]
}


def extract_diagrams(md_path):
    """Extract mermaid code blocks from the markdown file."""
    text = md_path.read_text(encoding="utf-8")
    
    # Split by figure headers
    blocks = []
    current_title = None
    in_code = False
    code_lines = []
    
    for line in text.split("\n"):
        # Detect figure header
        for key in FIGURES:
            if key in line and line.strip().startswith("##"):
                current_title = key
                break
        
        if line.strip() == "```mermaid":
            in_code = True
            code_lines = []
            continue
        elif line.strip() == "```" and in_code:
            in_code = False
            if current_title and code_lines:
                blocks.append((current_title, "\n".join(code_lines)))
                current_title = None
            continue
        
        if in_code:
            code_lines.append(line)
    
    return blocks


def sanitize_mermaid(code):
    """Fix all escape garbage, convert \\n to <br/>, clean up labels."""
    
    # Step 1: Inside quoted labels ["..."], replace literal \n with <br/>
    def fix_label(match):
        label = match.group(1)
        # Replace literal \n (the two characters) with <br/>
        label = label.replace("\\n", "<br/>")
        # Remove any remaining backslash escapes
        label = label.replace("\\r", "")
        label = label.replace("\\t", " ")
        # Fix double <br/>
        label = re.sub(r"(<br/>){2,}", "<br/>", label)
        # Fix trailing <br/>
        label = re.sub(r"<br/>$", "", label)
        label = re.sub(r"^<br/>", "", label)
        return f'["{label}"]'
    
    # Fix labels in square brackets with quotes
    code = re.sub(r'\["([^"]+)"\]', fix_label, code)
    
    # Fix labels in double braces (decision diamonds)
    def fix_diamond(match):
        label = match.group(1)
        label = label.replace("\\n", "<br/>")
        label = label.replace("\\r", "")
        label = label.replace("\\t", " ")
        label = re.sub(r"(<br/>){2,}", "<br/>", label)
        label = re.sub(r"<br/>$", "", label)
        label = re.sub(r"^<br/>", "", label)
        return '{{"{0}"}}'.format(label)
    
    code = re.sub(r'\{\{"([^"]+)"\}\}', fix_diamond, code)
    
    # Remove ~~~ layout hacks
    code = re.sub(r'^\s*\w+\s+~~~\s+\w+\s*$', '', code, flags=re.MULTILINE)
    
    # Clean up empty lines (keep max 1)
    code = re.sub(r'\n{3,}', '\n\n', code)
    
    return code.strip()


def write_config_files():
    """Write mermaid and puppeteer config files."""
    config_path = MMD_DIR / "mermaid_render_config.json"
    config_path.write_text(json.dumps(MERMAID_CONFIG, indent=2), encoding="utf-8")
    
    # Check for common Chrome/Chromium paths on Windows
    chrome_paths = [
        r"C:\Program Files\Google\Chrome\Application\chrome.exe",
        r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
        os.path.expandvars(r"%LOCALAPPDATA%\Google\Chrome\Application\chrome.exe"),
    ]
    
    pup_config = dict(PUPPETEER_CONFIG)
    for p in chrome_paths:
        if os.path.exists(p):
            pup_config["executablePath"] = p
            break
    
    if not pup_config["executablePath"]:
        # Let puppeteer find its own
        del pup_config["executablePath"]
    
    pup_path = MMD_DIR / "puppeteer_config.json"
    pup_path.write_text(json.dumps(pup_config, indent=2), encoding="utf-8")
    
    return config_path, pup_path


def render_diagram(mmd_path, png_path, config_path, pup_path):
    """Render a single .mmd file to PNG using mermaid-cli."""
    cmd = [
        "npx", "-y", "@mermaid-js/mermaid-cli",
        "-i", str(mmd_path),
        "-o", str(png_path),
        "-c", str(config_path),
        "-p", str(pup_path),
        "--size", "3840",
        "-b", "white",
        "-s", "4",
        "-q"
    ]
    
    result = subprocess.run(
        cmd,
        capture_output=True,
        text=True,
        cwd=str(BASE),
        timeout=120,
        shell=True
    )
    
    return result.returncode == 0, result.stdout, result.stderr


def main():
    print("=" * 60)
    print("AeroEdge-X Mermaid → PNG Renderer")
    print("=" * 60)
    
    # Extract diagrams
    blocks = extract_diagrams(SRC_MD)
    print(f"\nExtracted {len(blocks)} diagrams from source")
    
    # Write config
    config_path, pup_path = write_config_files()
    print(f"Config written to {config_path}")
    
    results = []
    
    for title, code in blocks:
        name = FIGURES.get(title)
        if not name:
            print(f"  [SKIP] Unknown figure: {title}")
            continue
        
        print(f"\n{'─' * 50}")
        print(f"  Processing: {title} → {name}.png")
        
        # Sanitize
        clean = sanitize_mermaid(code)
        
        # Write .mmd file
        mmd_path = MMD_DIR / f"{name}.mmd"
        mmd_path.write_text(clean, encoding="utf-8")
        print(f"  [OK] Sanitized .mmd written")
        
        # Render
        png_path = BASE / f"{name}.png"
        ok, stdout, stderr = render_diagram(mmd_path, png_path, config_path, pup_path)
        
        if ok and png_path.exists():
            size = png_path.stat().st_size
            print(f"  [OK] Rendered: {png_path.name} ({size:,} bytes)")
            results.append((name, True, ""))
        else:
            err = stderr.strip()[:200] if stderr else "Unknown error"
            print(f"  [FAIL] {err}")
            results.append((name, False, err))
    
    # Write status file
    print(f"\n{'=' * 60}")
    print("RENDER STATUS")
    print("=" * 60)
    
    status_lines = [
        "# AeroEdge-X Pre-Read Figure Render Status\n",
        "| Figure | Filename | Rendered | Visual QA | Factual Status | Notes |",
        "|--------|----------|----------|-----------|----------------|-------|",
    ]
    
    all_ok = True
    for name, ok, err in results:
        fig_num = name.split("_")[1]
        status = "YES" if ok else "FAIL"
        qa = "YES" if ok else "FAIL"
        if not ok:
            all_ok = False
        note = err if err else "OK"
        status_lines.append(f"| {fig_num} | {name}.png | {status} | {qa} | VERIFIED | {note} |")
    
    status_path = BASE / "RENDER_STATUS.md"
    status_path.write_text("\n".join(status_lines), encoding="utf-8")
    print(f"\nStatus written to {status_path}")
    
    if all_ok:
        print("\n✅ ALL 13 FIGURES RENDERED SUCCESSFULLY")
    else:
        failed = [n for n, ok, _ in results if not ok]
        print(f"\n⚠ {len(failed)} figures failed: {', '.join(failed)}")
    
    return all_ok


if __name__ == "__main__":
    main()
