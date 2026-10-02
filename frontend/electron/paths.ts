import { app } from 'electron';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class PathManager {
  static getBackendExecutable(): string {
    const isDev = !app.isPackaged;
    
    if (isDev) {
      // In dev mode, assume the backend has been built to dist/aeroedge-backend
      const rootDir = path.join(__dirname, '..', '..');
      return path.join(rootDir, 'dist', 'aeroedge-backend', 'aeroedge-backend.exe');
    } else {
      // In prod mode, the backend is installed in the 'resources/aeroedge-backend' directory next to the app
      const appDir = path.dirname(app.getPath('exe'));
      return path.join(appDir, 'resources', 'aeroedge-backend', 'aeroedge-backend.exe');
    }
  }

  static verifyBackendExists(): boolean {
    const backendPath = this.getBackendExecutable();
    return fs.existsSync(backendPath);
  }
}
