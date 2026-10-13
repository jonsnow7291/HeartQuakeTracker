import { BundledContentLoader } from '../../src/platform/core/BundledContentLoader';

describe('BundledContentLoader y bundle estático de contenido', () => {
  it('carga correctamente el paquete empaquetado en content/bundle/content.json', async () => {
    const loader = new BundledContentLoader();
    const pkg = await loader.load();

    expect(pkg).not.toBeNull();
    expect(pkg!.manifest.version).toBe('1.0.0');
    expect(pkg!.manifest.files.length).toBeGreaterThanOrEqual(9);

    // Debe contener banco de preguntas y guías
    const quizFile = pkg!.files.find((f) => f.path === 'quiz/banco.json');
    expect(quizFile).toBeDefined();
    expect(quizFile!.data.length).toBeGreaterThan(0);

    const guideFile = pkg!.files.find((f) => f.path.startsWith('guias/'));
    expect(guideFile).toBeDefined();
    expect(guideFile!.data.length).toBeGreaterThan(0);
  });
});
