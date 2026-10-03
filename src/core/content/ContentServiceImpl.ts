import { AppException } from '../../contracts/types';
import type { ContentService, GuideMeta, QuizBank } from '../../contracts/content';
import type { ContentManifest, ContentRemote, BundledContent, CryptoPort, FileStore, KeyValueStore, PackageData } from '../platform/ports';
import { compareSemver, fromUtf8 } from '../util/bytes';
import { parseFrontMatter } from './frontMatter';

const CURRENT_KEY = 'content.current';
const PREVIOUS_KEY = 'content.previous';
const CATEGORIES = ['MOCHILA', 'ESTRUCTURAL', 'PLAN_FAMILIAR', 'PRIMEROS_AUXILIOS', 'OTRO'] as const;

const vdir = (version: string) => `content/v/${version}`;

export interface ContentDeps {
  files: FileStore;
  state: KeyValueStore;
  crypto: CryptoPort;
  /** Contenido incluido en la app (primer arranque sin red). */
  bundled?: BundledContent;
  /** Servidor. Opcional: sin remoto, checkUpdates devuelve {available:false}. */
  remote?: ContentRemote;
}

interface GuideEntry {
  meta: GuideMeta;
  path: string;
}

/**
 * ContentService real (RF-01).
 * - Paquete versionado en `content/v/<versión>/…` con `manifest.json`; el puntero `content.current` se cambia
 *   al final (instalación atómica) y se conserva la versión previa para rollback.
 * - Cada lectura verifica el SHA-256 contra el manifest → CONTENT_CORRUPT.
 */
export class ContentServiceImpl implements ContentService {
  private index = new Map<string, Map<string, GuideEntry>>();
  private ready: Promise<void> | undefined;

  constructor(private readonly deps: ContentDeps) {}

  async listGuides(): Promise<GuideMeta[]> {
    const idx = await this.guideIndex();
    return [...idx.values()].map((e) => e.meta).sort((a, b) => a.title.localeCompare(b.title, 'es'));
  }

  async getGuideMarkdown(id: string): Promise<string> {
    const version = await this.currentVersion();
    const entry = (await this.guideIndex()).get(id);
    if (!entry) throw new AppException('CONTENT_MISSING', `La guía "${id}" no existe en el contenido instalado`);
    const bytes = await this.readVerified(version, entry.path);
    const parsed = parseFrontMatter(fromUtf8(bytes));
    return parsed ? parsed.body.replace(/^\s+/, '') : fromUtf8(bytes);
  }

  async getQuizBank(): Promise<QuizBank> {
    const version = await this.currentVersion();
    const bytes = await this.readVerified(version, 'quiz/banco.json');
    let bank: QuizBank;
    try {
      bank = JSON.parse(fromUtf8(bytes)) as QuizBank;
    } catch {
      throw new AppException('CONTENT_CORRUPT', 'El banco de preguntas no es un JSON válido');
    }
    if (!Array.isArray(bank?.levels)) throw new AppException('CONTENT_CORRUPT', 'El banco de preguntas no tiene niveles');
    return bank;
  }

  /**
   * Compara con el servidor y, si hay una versión mayor, la descarga, verifica TODOS los hashes,
   * la escribe en una carpeta nueva y solo entonces mueve el puntero. Ante cualquier fallo no cambia nada.
   * Sin red/remoto no lanza: devuelve {available:false, applied:false} (no interrumpe la lectura).
   */
  async checkUpdates(): Promise<{ available: boolean; applied: boolean }> {
    const remote = this.deps.remote;
    if (!remote) return { available: false, applied: false };
    await this.ensureReady().catch(() => undefined); // instala el bundle antes de comparar versiones
    let manifest: ContentManifest | null;
    try {
      manifest = await remote.fetchManifest();
    } catch {
      return { available: false, applied: false };
    }
    const current = await this.deps.state.get(CURRENT_KEY);
    if (!manifest || (current && compareSemver(manifest.version, current) <= 0)) return { available: false, applied: false };

    try {
      const pkg = await remote.fetchPackage(manifest.version);
      await this.install(pkg);
      return { available: true, applied: true };
    } catch {
      return { available: true, applied: false };
    }
  }

  /** Instala un paquete (bundled o descargado). Verifica integridad antes de activarlo. */
  async install(pkg: PackageData): Promise<void> {
    const { manifest } = pkg;
    const byPath = new Map(pkg.files.map((f) => [f.path, f.data]));
    for (const f of manifest.files) {
      const data = byPath.get(f.path);
      if (!data) throw new AppException('CONTENT_CORRUPT', `Falta el archivo ${f.path} en el paquete`);
      if (data.length !== f.bytes || (await this.deps.crypto.sha256Hex(data)) !== f.sha256) {
        throw new AppException('CONTENT_CORRUPT', `Integridad inválida en ${f.path}`);
      }
    }
    const dir = vdir(manifest.version);
    try {
      await this.deps.files.remove(dir); // reinstalación limpia
      for (const f of pkg.files) await this.deps.files.write(`${dir}/${f.path}`, f.data);
      await this.deps.files.write(`${dir}/manifest.json`, new TextEncoder().encode(JSON.stringify(manifest)));
    } catch (e) {
      await this.deps.files.remove(dir);
      throw e instanceof AppException ? e : new AppException('STORAGE_FAILED', 'No se pudo escribir el contenido');
    }
    const prev = await this.deps.state.get(CURRENT_KEY);
    await this.deps.state.set(CURRENT_KEY, manifest.version); // ← punto de conmutación atómico
    if (prev && prev !== manifest.version) {
      const older = await this.deps.state.get(PREVIOUS_KEY);
      await this.deps.state.set(PREVIOUS_KEY, prev);
      if (older && older !== prev && older !== manifest.version) await this.deps.files.remove(vdir(older));
    }
    this.index.clear();
  }

  // ---- internos ----

  private async ensureReady(): Promise<void> {
    this.ready ??= this.bootstrap();
    await this.ready;
  }

  private async currentVersion(): Promise<string> {
    await this.ensureReady();
    const v = await this.deps.state.get(CURRENT_KEY);
    if (!v) throw new AppException('CONTENT_MISSING', 'No hay contenido instalado', false);
    return v;
  }

  /** Primer arranque: instala el contenido incluido en la app si todavía no hay ninguno. */
  private async bootstrap(): Promise<void> {
    if (await this.deps.state.get(CURRENT_KEY)) return;
    const pkg = await this.deps.bundled?.load();
    if (pkg) await this.install(pkg);
  }

  private async readVerified(version: string, path: string): Promise<Uint8Array> {
    const manifest = await this.manifestOf(version);
    const info = manifest.files.find((f) => f.path === path);
    if (!info) throw new AppException('CONTENT_MISSING', `${path} no está en el manifest`);
    const data = await this.deps.files.read(`${vdir(version)}/${path}`);
    if (!data) throw new AppException('CONTENT_MISSING', `Archivo no encontrado: ${path}`);
    if (data.length !== info.bytes || (await this.deps.crypto.sha256Hex(data)) !== info.sha256) {
      throw new AppException('CONTENT_CORRUPT', `El archivo ${path} está dañado. Reinstala el paquete educativo`);
    }
    return data;
  }

  private async manifestOf(version: string): Promise<ContentManifest> {
    const raw = await this.deps.files.read(`${vdir(version)}/manifest.json`);
    if (!raw) throw new AppException('CONTENT_MISSING', 'Falta manifest.json del contenido instalado');
    try {
      return JSON.parse(fromUtf8(raw)) as ContentManifest;
    } catch {
      throw new AppException('CONTENT_CORRUPT', 'manifest.json dañado');
    }
  }

  private async guideIndex(): Promise<Map<string, GuideEntry>> {
    const version = await this.currentVersion();
    const cached = this.index.get(version);
    if (cached) return cached;
    const manifest = await this.manifestOf(version);
    const idx = new Map<string, GuideEntry>();
    for (const f of manifest.files) {
      if (!f.path.startsWith('guias/') || !f.path.endsWith('.md')) continue;
      const data = await this.deps.files.read(`${vdir(version)}/${f.path}`);
      if (!data) continue;
      const fm = parseFrontMatter(fromUtf8(data));
      const d = fm?.data;
      if (!d || typeof d.id !== 'string' || typeof d.title !== 'string') continue;
      const category = (CATEGORIES as readonly string[]).includes(String(d.category)) ? (d.category as GuideMeta['category']) : 'OTRO';
      idx.set(d.id, {
        path: f.path,
        meta: {
          id: d.id,
          title: d.title,
          summary: typeof d.summary === 'string' ? d.summary : '',
          category,
          version: typeof d.version === 'string' ? d.version : '1.0.0',
          readMin: typeof d.readMin === 'number' ? d.readMin : 1,
        },
      });
    }
    this.index.set(version, idx);
    return idx;
  }
}
