import { app } from 'electron';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class PathManager {
  static getBackendExecutable(): string {
    const appDir = path.dirname(app.getPath('exe'));
    const rootDir = path.resolve(__dirname, '..', '..');

    const candidates = [
      // 1. Packaged inside resources/aeroedge-backend next to electron.exe
      path.join(appDir, 'resources', 'aeroedge-backend', 'aeroedge-backend.exe'),
      // 2. Next to win-unpacked in build/windows/backend/aeroedge-backend
      path.join(appDir, '..', 'backend', 'aeroedge-backend', 'aeroedge-backend.exe'),
      // 3. Directly in aeroedge-backend folder in appDir
      path.join(appDir, 'aeroedge-backend', 'aeroedge-backend.exe'),
      // 4. In build/windows/backend/aeroedge-backend from workspace root
      path.join(rootDir, 'build', 'windows', 'backend', 'aeroedge-backend', 'aeroedge-backend.exe'),
      // 5. In dist/aeroedge-backend
      path.join(rootDir, 'dist', 'aeroedge-backend', 'aeroedge-backend.exe'),
      // 6. Absolute workspace fallback
      path.join('D:\\Tata Innovent\\Tata_Innovent-main\\build\\windows\\backend\\aeroedge-backend\\aeroedge-backend.exe')
    ];

    for (const p of candidates) {
      try {
        if (fs.existsSync(p)) {
          return p;
        }
      } catch {
        // Continue searching
      }
    }

    return candidates[0];
  }

  static verifyBackendExists(): boolean {
    const backendPath = this.getBackendExecutable();
    try {
      return fs.existsSync(backendPath);
    } catch {
      return false;
    }
  }
}
