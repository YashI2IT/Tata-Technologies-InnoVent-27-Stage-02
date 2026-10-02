import { ChildProcess, spawn, exec } from 'child_process';
import { PathManager } from './paths';

export class BackendManager {
  private static backendProcess: ChildProcess | null = null;
  private static backendPort: number = 7860; // Keep the default Flask port

  static async start(): Promise<number> {
    if (this.backendProcess) {
      console.log('Backend is already running on port', this.backendPort);
      return this.backendPort;
    }

    const backendExe = PathManager.getBackendExecutable();
    if (!PathManager.verifyBackendExists()) {
      throw new Error(`Backend executable not found at: ${backendExe}`);
    }

    console.log(`Starting local AI backend from: ${backendExe}`);

    this.backendProcess = spawn(backendExe, [], {
      detached: false,
      stdio: 'pipe'
    });

    this.backendProcess.stdout?.on('data', (data) => {
      console.log(`[BACKEND STDOUT]: ${data.toString().trim()}`);
    });

    this.backendProcess.stderr?.on('data', (data) => {
      console.error(`[BACKEND STDERR]: ${data.toString().trim()}`);
    });

    this.backendProcess.on('close', (code) => {
      console.log(`Backend process exited with code ${code}`);
      this.backendProcess = null;
    });

    this.backendProcess.on('error', (err) => {
      console.error('Failed to start backend process:', err);
    });

    // We allow a brief moment for it to bind to port
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(this.backendPort);
      }, 3000);
    });
  }

  static stop() {
    if (this.backendProcess) {
      console.log('Gracefully shutting down local AI backend...');
      if (process.platform === 'win32' && this.backendProcess.pid) {
        exec(`taskkill /pid ${this.backendProcess.pid} /T /F`, (err) => {
          if (err) console.error('Failed to kill backend tree:', err);
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
