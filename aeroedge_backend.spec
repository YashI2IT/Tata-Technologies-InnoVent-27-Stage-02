# -*- mode: python ; coding: utf-8 -*-
import os
import sys
from pathlib import Path
from PyInstaller.utils.hooks import collect_data_files, collect_submodules

block_cipher = None

# Base path
base_dir = os.path.abspath(os.getcwd())

# Collect all necessary data files
datas = [
    (os.path.join(base_dir, 'models'), 'models'),
    (os.path.join(base_dir, 'manuals'), 'manuals'),
    (os.path.join(base_dir, 'data', 'chroma'), 'data/chroma'),
    (os.path.join(base_dir, 'templates'), 'templates'),
    (os.path.join(base_dir, 'frontend', 'public', 'logo.png'), 'frontend/public'),
]

site_packages = os.path.join(base_dir, '.venv', 'Lib', 'site-packages')
torchvision_pkg = os.path.join(site_packages, 'torchvision')

# Collect package data for packages with internal assets
datas += collect_data_files('ultralytics')
datas += collect_data_files('chromadb')
datas += collect_data_files('reportlab')
datas += collect_data_files('sentence_transformers')
datas += collect_data_files('transformers')
datas += [
    (os.path.join(torchvision_pkg, '_C_stable.pyd'), 'torchvision'),
    (os.path.join(torchvision_pkg, 'image_stable.pyd'), 'torchvision'),
]

binaries = [
    (os.path.join(torchvision_pkg, '_C_stable.pyd'), 'torchvision'),
    (os.path.join(torchvision_pkg, 'image_stable.pyd'), 'torchvision'),
]

# Hidden imports
hiddenimports = [
    'engineio.async_drivers.threading',
    'ultralytics',
    'ultralytics.nn',
    'ultralytics.models',
    'ultralytics.utils',
    'torch',
    'torchvision',
    'torchvision._C_stable',
    'torchvision.image_stable',
    'transformers',
    'transformers.models',
    'transformers.modeling_utils',
    'cv2',
    'chromadb',
    'chromadb.telemetry.product.posthog',
    'sentence_transformers',
]

# Collect all dynamic submodules for chromadb and sentence_transformers
hiddenimports += collect_submodules('chromadb')
hiddenimports += collect_submodules('sentence_transformers')

hiddenimports += [
    'langchain',
    'langchain_core',
    'langchain_community',
    'langchain_community.document_loaders',
    'langchain_community.document_loaders.pdf',
    'langchain_community.vectorstores',
    'langchain_huggingface',
    'langchain_ollama',
    'argon2',
    'argon2._ffi',
    'reportlab',
    'reportlab.platypus',
    'reportlab.lib',
    'reportlab.lib.colors',
    'reportlab.lib.styles',
    'reportlab.lib.units',
    'flask',
    'flask_cors',
    'werkzeug',
    'werkzeug.utils',
    'sqlite3',
    'pydantic',
    'dotenv',
]

a = Analysis(
    ['app.py'],
    pathex=[base_dir],
    binaries=binaries,
    datas=datas,
    hiddenimports=hiddenimports,
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=['tkinter', 'matplotlib', 'scipy.spatial.cKDTree'],
    win_no_prefer_redirects=False,
    win_private_assemblies=False,
    cipher=block_cipher,
    noarchive=False,
)

pyz = PYZ(a.pure, a.zipped_data, cipher=block_cipher)

exe = EXE(
    pyz,
    a.scripts,
    [],
    exclude_binaries=True,
    name='aeroedge-backend',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=False,
    console=True,
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
    icon=os.path.join(base_dir, 'frontend', 'public', 'logo.ico') if os.path.exists(os.path.join(base_dir, 'frontend', 'public', 'logo.ico')) else None,
)

coll = COLLECT(
    exe,
    a.binaries,
    a.zipfiles,
    a.datas,
    strip=False,
    upx=False,
    upx_exclude=[],
    name='aeroedge-backend',
)
