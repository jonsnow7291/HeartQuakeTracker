import type { ContentManifest, ContentRemote, PackageData } from '../platform/ports';
import { fromBase64 } from '../util/bytes';

type FetchLike = (url: string, init?: { method?: string; headers?: Record<string, string> }) => Promise<{
  ok: boolean;
  status: number;
  json(): Promise<unknown>;
}>;

interface WirePackage {
  manifest: ContentManifest;
  files: { path: string; sha256: string; bytes: number; contentBase64: string }[];
}

/** Cliente de GET /v1/content/manifest y GET /v1/content/package/:version (ver docs/jd/api.md). */
export class HttpContentRemote implements ContentRemote {
  constructor(
    private readonly baseUrl: string,
    private readonly fetchFn: FetchLike = (globalThis as unknown as { fetch: FetchLike }).fetch,
  ) {}

  async fetchManifest(): Promise<ContentManifest | null> {
    const res = await this.fetchFn(`${this.baseUrl}/v1/content/manifest`);
    if (res.status === 404) return null; // el servidor aún no publicó contenido
    if (!res.ok) throw new Error(`manifest: HTTP ${res.status}`);
    return (await res.json()) as ContentManifest;
  }

  async fetchPackage(version: string): Promise<PackageData> {
    const res = await this.fetchFn(`${this.baseUrl}/v1/content/package/${encodeURIComponent(version)}`);
    if (!res.ok) throw new Error(`package ${version}: HTTP ${res.status}`);
    const wire = (await res.json()) as WirePackage;
    return { manifest: wire.manifest, files: wire.files.map((f) => ({ path: f.path, data: fromBase64(f.contentBase64) })) };
  }
}
