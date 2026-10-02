import { contextBridge, ipcRenderer } from 'electron';

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld(
  'electronAPI', {
    getBackendPort: () => ipcRenderer.invoke('get-backend-port'),
    getExecutionMode: () => ipcRenderer.invoke('get-execution-mode'),
    setExecutionMode: (mode: 'LOCAL' | 'JETSON') => ipcRenderer.invoke('set-execution-mode', mode),
    getJetsonStatus: () => ipcRenderer.invoke('get-jetson-status'),
  }
);
