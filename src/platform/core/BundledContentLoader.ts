import type { BundledContent, ContentManifest, PackageData } from '../../core/platform/ports';
import { fromBase64 } from '../../core/util/bytes';

interface BundleJsonFormat {
  manifest: ContentManifest;
  files: Array<{
    path: string;
    dataBase64: string;
  }>;
}

/**
 * Adaptador BundledContent para el primer arranque de la app sin red.
 * Carga el paquete educativo empaquetado como asset estático (content/bundle/content.json).
 */
export class BundledContentLoader implements BundledContent {
  constructor(private readonly explicitPackage?: PackageData) {}

  async load(): Promise<PackageData | null> {
    if (this.explicitPackage) {
      return this.explicitPackage;
    }

    try {
      // Importa el JSON generado por scripts/bundle-content.js
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const bundle = require('../../../content/bundle/content.json') as BundleJsonFormat;
      if (!bundle || !bundle.manifest || !Array.isArray(bundle.files)) {
        return null;
      }

      return {
        manifest: bundle.manifest,
        files: bundle.files.map((f) => ({
          path: f.path,
          data: fromBase64(f.dataBase64),
        })),
      };
    } catch {
      return null;
    }
  }
}
