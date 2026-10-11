import { ChildProcess, spawn, exec } from 'child_process';
import path from 'path';
import { PathManager } from './paths';

export class BackendManager {
  private static backendProcess: ChildProcess | null = null;
  private static backendPort: number = 7860; // Standard Flask port

  static async start(): Promise<number> {
    if (this.backendProcess) {
      console.log('[BackendManager] Backend is already running on port', this.backendPort);
      return this.backendPort;
    }

    const backendExe = PathManager.getBackendExecutable();
    if (!PathManager.verifyBackendExists()) {
      console.log(`[BackendManager] Precompiled backend not found at: ${backendExe}. Connecting to active Python backend on port ${this.backendPort}.`);
      return this.backendPort;
    }

    const backendCwd = path.dirname(backendExe);
    console.log(`[BackendManager] Spawning local AI backend executable: ${backendExe}`);
    console.log(`[BackendManager] Working directory: ${backendCwd}`);

    try {
      this.backendProcess = spawn(backendExe, [], {
        cwd: backendCwd,
        detached: false,
        stdio: 'pipe',
        windowsHide: true
      });

      this.backendProcess.stdout?.on('data', (data) => {
        console.log(`[BACKEND STDOUT]: ${data.toString().trim()}`);
      });

      this.backendProcess.stderr?.on('data', (data) => {
        console.error(`[BACKEND STDERR]: ${data.toString().trim()}`);
      });

      this.backendProcess.on('close', (code) => {
        console.log(`[BackendManager] Backend process exited with code ${code}`);
        this.backendProcess = null;
      });

      this.backendProcess.on('error', (err) => {
        console.error('[BackendManager] Failed to start backend process:', err);
      });
    } catch (err) {
      console.error('[BackendManager] Spawn error:', err);
    }

    // Resolve immediately so Electron window opens without delay; backend initializes in parallel
    return this.backendPort;
  }

  static stop() {
    if (this.backendProcess) {
      console.log('[BackendManager] Gracefully shutting down local AI backend...');
      if (process.platform === 'win32' && this.backendProcess.pid) {
        exec(`taskkill /pid ${this.backendProcess.pid} /T /F`, (err) => {
          if (err) console.error('[BackendManager] Failed to kill backend tree:', err);
        });
      } else {
        this.backendProcess.kill();
      }
      this.backendProcess = null;
    }
  }

  static getPort(): number {
    return this.backendPort;
  }
}
