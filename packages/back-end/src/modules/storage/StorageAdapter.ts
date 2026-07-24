import fs from 'fs/promises';
import path from 'path';

export interface IStorageAdapter {
  saveFile(filePath: string, data: Buffer): Promise<string>;
  getFile(filePath: string): Promise<Buffer>;
  deleteFile(filePath: string): Promise<void>;
}

export class LocalStorageAdapter implements IStorageAdapter {
  private baseDir: string;

  constructor(baseDir: string = process.cwd()) {
    this.baseDir = baseDir;
  }

  async saveFile(filePath: string, data: Buffer): Promise<string> {
    const fullPath = path.join(this.baseDir, filePath);
    const dir = path.dirname(fullPath);
    try {
      await fs.access(dir);
    } catch {
      await fs.mkdir(dir, { recursive: true });
    }
    await fs.writeFile(fullPath, data);
    return filePath;
  }

  async getFile(filePath: string): Promise<Buffer> {
    const fullPath = path.join(this.baseDir, filePath);
    return await fs.readFile(fullPath);
  }

  async deleteFile(filePath: string): Promise<void> {
    const fullPath = path.join(this.baseDir, filePath);
    try {
      await fs.access(fullPath);
      await fs.unlink(fullPath);
    } catch {
      // Archivo no existe, ignorar
    }
  }
}
