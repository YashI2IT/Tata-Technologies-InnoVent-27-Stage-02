import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import { BackendManager } from './backend-manager';
import { ConfigManager, ExecutionMode } from './config';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow: BrowserWindow | null = null;
let backendPort = 7860;

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 768,
    title: "AeroEdge-X (Windows + Jetson Edge Architecture)",
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    }
  });

  const isDev = !app.isPackaged;

  if (isDev && process.env.VITE_DEV_SERVER_URL) {
    await mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
    // mainWindow.webContents.openDevTools();
  } else {
    await mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  }

  // Diagnostic Events
  mainWindow.webContents.on('did-finish-load', () => {
    console.log('[Electron] did-finish-load: Renderer loaded successfully');
  });
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
    console.error(`[Electron] did-fail-load: ${errorCode} - ${errorDescription} at ${validatedURL}`);
  });
  mainWindow.webContents.on('render-process-gone', (event, details) => {
    console.error(`[Electron] render-process-gone: ${details.reason}`);
  });
}

const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  app.whenReady().then(() => {
  // 1. Load config
  ConfigManager.load();

  // 2. Start Backend Asynchronously
  BackendManager.start().then(port => {
    backendPort = port;
  }).catch(err => {
    console.error("Critical failure starting backend:", err);
  });

  // 3. Register IPC endpoints
  ipcMain.handle('get-backend-port', () => backendPort);
  ipcMain.handle('get-execution-mode', () => ConfigManager.get().executionMode);
  ipcMain.handle('set-execution-mode', (_, mode: ExecutionMode) => {
    ConfigManager.save({ executionMode: mode });
    return mode;
  });
  ipcMain.handle('get-jetson-status', () => {
    // Hardware Validation Pending logic
    return {
      status: 'disconnected',
      message: 'ARCHITECTURE READY / HARDWARE VALIDATION PENDING'
    };
  });

  // 4. Create Window
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('will-quit', () => {
  BackendManager.stop();
});
}
