import * as RNFS from '@dr.pogodin/react-native-fs';
import { AppException } from '../../contracts/types';
import type { FileStore } from '../../core/platform/ports';
import { fromBase64, toBase64 } from '../../core/util/bytes';

export interface FileStoreOptions {
  /** Carpeta raíz base en el dispositivo (por defecto DocumentDirectoryPath). */
  baseDir?: string;
}

/**
 * Adaptador FileStore sobre @dr.pogodin/react-native-fs.
 * Gestiona archivos y carpetas en el almacenamiento privado de la app (guías educativas, paquetes).
 */
export class ReactNativeFileStore implements FileStore {
  private readonly baseDir: string;

  constructor(options: FileStoreOptions = {}) {
    this.baseDir = (options.baseDir ?? RNFS.DocumentDirectoryPath).replace(/\/+$/, '');
  }

  async read(filePath: string): Promise<Uint8Array | null> {
    const fullPath = this.resolve(filePath);
    try {
      const exists = await RNFS.exists(fullPath);
      if (!exists) return null;
      const base64Content = await RNFS.readFile(fullPath, 'base64');
      return fromBase64(base64Content);
    } catch (err) {
      throw new AppException('STORAGE_FAILED', `Error al leer archivo "${filePath}": ${String(err)}`);
    }
  }

  async write(filePath: string, data: Uint8Array): Promise<void> {
    const fullPath = this.resolve(filePath);
    try {
      const lastSlash = fullPath.lastIndexOf('/');
      if (lastSlash > -1) {
        const parentDir = fullPath.substring(0, lastSlash);
        const parentExists = await RNFS.exists(parentDir);
        if (!parentExists) {
          await RNFS.mkdir(parentDir);
        }
      }
      await RNFS.writeFile(fullPath, toBase64(data), 'base64');
    } catch (err) {
      throw new AppException('STORAGE_FAILED', `Error al escribir archivo "${filePath}": ${String(err)}`);
    }
  }

  async remove(filePath: string): Promise<void> {
    const fullPath = this.resolve(filePath);
    try {
      const exists = await RNFS.exists(fullPath);
      if (exists) {
        await RNFS.unlink(fullPath);
      }
    } catch (err) {
      throw new AppException('STORAGE_FAILED', `Error al eliminar ruta "${filePath}": ${String(err)}`);
    }
  }

  async list(prefix: string): Promise<string[]> {
    try {
      const results: string[] = [];
      await this.scanDir(this.baseDir, '', prefix, results);
      return results.sort();
    } catch (err) {
      throw new AppException('STORAGE_FAILED', `Error al listar archivos con prefijo "${prefix}": ${String(err)}`);
    }
  }

  private resolve(filePath: string): string {
    const clean = filePath.replace(/^\/+/, '');
    return `${this.baseDir}/${clean}`;
  }

  private async scanDir(currentDir: string, currentRel: string, prefix: string, out: string[]): Promise<void> {
    const exists = await RNFS.exists(currentDir);
    if (!exists) return;

    const items = await RNFS.readDir(currentDir);
    for (const item of items) {
      const relPath = currentRel ? `${currentRel}/${item.name}` : item.name;
      if (item.isDirectory()) {
        await this.scanDir(item.path, relPath, prefix, out);
      } else if (item.isFile()) {
        if (!prefix || relPath.startsWith(prefix)) {
          out.push(relPath);
        }
      }
    }
  }
}
