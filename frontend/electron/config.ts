import { app } from 'electron';
import path from 'path';
import fs from 'fs';

export type ExecutionMode = 'LOCAL' | 'JETSON';

export interface AppConfig {
  executionMode: ExecutionMode;
  jetsonConfig: {
    deviceAddress: string;
    devicePort: number;
    healthEndpoint: string;
    inspectionEndpoint: string;
  };
}

const DEFAULT_CONFIG: AppConfig = {
  executionMode: 'LOCAL',
  jetsonConfig: {
    deviceAddress: '192.168.1.100', // Example placeholder, not hardcoded execution
    devicePort: 5000,
    healthEndpoint: '/api/v1/health',
    inspectionEndpoint: '/api/v1/inspect'
  }
};

export class ConfigManager {
  private static configPath = path.join(app.getPath('userData'), 'aeroedge-config.json');
  private static config: AppConfig = DEFAULT_CONFIG;

  static load(): AppConfig {
    if (fs.existsSync(this.configPath)) {
      try {
        const data = fs.readFileSync(this.configPath, 'utf8');
        this.config = { ...DEFAULT_CONFIG, ...JSON.parse(data) };
      } catch (err) {
        console.error('Failed to load config, using defaults', err);
      }
    } else {
      this.save(this.config);
    }
    return this.config;
  }

  static save(newConfig: Partial<AppConfig>) {
    this.config = { ...this.config, ...newConfig };
    fs.writeFileSync(this.configPath, JSON.stringify(this.config, null, 2), 'utf8');
  }

  static get(): AppConfig {
    return this.config;
  }
}
