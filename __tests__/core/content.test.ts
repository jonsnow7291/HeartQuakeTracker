import { join } from 'node:path';
import { ContentServiceImpl } from '../../src/core/content/ContentServiceImpl';
import { parseFrontMatter } from '../../src/core/content/frontMatter';
import type { ContentRemote, PackageData } from '../../src/core/platform/ports';
import { MemoryFileStore, MemoryKeyValueStore, makePackage, nodeCrypto, packageFromRepoContent } from './support/nodePorts';

const REPO_CONTENT = join(__dirname, '..', '..', 'content');
const mk = (bundled?: PackageData, remote?: ContentRemote) => {
  const files = new MemoryFileStore();
  const state = new MemoryKeyValueStore();
  const svc = new ContentServiceImpl({ files, state, crypto: nodeCrypto, bundled: bundled ? { load: async () => bundled } : undefined, remote });
  return { svc, files, state };
};
const GUIDE = (id: string, extra = '') => `---\nid: ${id}\ntitle: Guía ${id}\nsummary: Resumen\ncategory: MOCHILA\nversion: 1.0.0\nreadMin: 3\nsources: ["UNGRD"]\n---\n\n# Cuerpo ${id}${extra}\n`;
const QUIZ = JSON.stringify({ levels: [{ id: 'n1', order: 1, title: 'N1', questions: [] }] });

describe('front-matter', () => {
  it('parsea claves, listas y números', () => {
    const r = parseFrontMatter(GUIDE('a'))!;
    expect(r.data).toMatchObject({ id: 'a', readMin: 3, version: '1.0.0', sources: ['UNGRD'] });
    expect(r.body).toContain('# Cuerpo a');
    expect(parseFrontMatter('sin front matter')).toBeNull();
  });
});

describe('ContentService real con el contenido REAL del repo (RF-01)', () => {
  const pkg = packageFromRepoContent(REPO_CONTENT);

  it('primer arranque: instala el bundle y lista las guías de Santiago', async () => {
    const { svc } = mk(pkg);
    const guides = await svc.listGuides();
    expect(guides.length).toBe(pkg.files.filter((f) => f.path.startsWith('guias/')).length);
    expect(guides.map((g) => g.id)).toContain('mochila-emergencia');
    expect(guides.every((g) => g.title && g.readMin >= 1)).toBe(true);
  });

  it('devuelve el Markdown sin front-matter', async () => {
    const md = await mk(pkg).svc.getGuideMarkdown('mochila-emergencia');
    expect(md.startsWith('# Mochila')).toBe(true);
    expect(md).not.toContain('category: MOCHILA');
  });

  it('banco de preguntas válido', async () => {
    const bank = await mk(pkg).svc.getQuizBank();
    expect(bank.levels.length).toBeGreaterThan(0);
    expect(bank.levels[0]!.questions.length).toBeGreaterThan(0);
  });

  it('responde rápido (< 2 s, RF-01) tras el arranque', async () => {
    const { svc } = mk(pkg);
    await svc.listGuides();
    const t = Date.now();
    await svc.getGuideMarkdown('mochila-emergencia');
    expect(Date.now() - t).toBeLessThan(2000);
  });
});

describe('ContentService real – integridad (RF-01 A1)', () => {
  const pkg = makePackage('1.0.0', { 'guias/a.md': GUIDE('a'), 'quiz/banco.json': QUIZ });

  it('archivo alterado → CONTENT_CORRUPT; borrado → CONTENT_MISSING; id desconocido → CONTENT_MISSING', async () => {
    const { svc, files } = mk(pkg);
    await svc.listGuides();
    await files.write('content/v/1.0.0/guias/a.md', new TextEncoder().encode(GUIDE('a', '\nMANIPULADO')));
    await expect(svc.getGuideMarkdown('a')).rejects.toMatchObject({ code: 'CONTENT_CORRUPT' });
    await files.remove('content/v/1.0.0/guias/a.md');
    await expect(svc.getGuideMarkdown('a')).rejects.toMatchObject({ code: 'CONTENT_MISSING' });
    await expect(svc.getGuideMarkdown('nope')).rejects.toMatchObject({ code: 'CONTENT_MISSING' });
  });

  it('sin bundle ni contenido instalado → CONTENT_MISSING', async () => {
    await expect(mk().svc.listGuides()).rejects.toMatchObject({ code: 'CONTENT_MISSING' });
  });

  it('un paquete con hash inválido no se instala', async () => {
    const bad = makePackage('1.0.0', { 'guias/a.md': GUIDE('a'), 'quiz/banco.json': QUIZ });
    bad.manifest.files[0]!.sha256 = '0'.repeat(64);
    await expect(mk(bad).svc.listGuides()).rejects.toMatchObject({ code: 'CONTENT_CORRUPT' });
  });

  it('banco con JSON roto → CONTENT_CORRUPT', async () => {
    const broken = makePackage('1.0.0', { 'guias/a.md': GUIDE('a'), 'quiz/banco.json': '{ no es json' });
    await expect(mk(broken).svc.getQuizBank()).rejects.toMatchObject({ code: 'CONTENT_CORRUPT' });
  });
});

describe('ContentService real – actualizaciones atómicas (RF-01 A2)', () => {
  const v1 = makePackage('1.0.0', { 'guias/a.md': GUIDE('a'), 'quiz/banco.json': QUIZ });
  const remoteOf = (pkg: PackageData | null, fail = false): ContentRemote => ({
    fetchManifest: async () => {
      if (fail) throw new Error('sin red');
      return pkg?.manifest ?? null;
    },
    fetchPackage: async () => pkg!,
  });

  it('versión mayor → descarga, verifica y activa; la lectura ve el contenido nuevo', async () => {
    const v2 = makePackage('1.1.0', { 'guias/a.md': GUIDE('a', '\nNUEVO'), 'guias/b.md': GUIDE('b'), 'quiz/banco.json': QUIZ });
    const { svc, state } = mk(v1, remoteOf(v2));
    expect((await svc.listGuides()).length).toBe(1);
    expect(await svc.checkUpdates()).toEqual({ available: true, applied: true });
    expect(await state.get('content.current')).toBe('1.1.0');
    expect((await svc.listGuides()).length).toBe(2);
    expect(await svc.getGuideMarkdown('a')).toContain('NUEVO');
    expect(await state.get('content.previous')).toBe('1.0.0');
  });

  it('misma versión, sin red o sin remoto → available:false y no lanza', async () => {
    expect(await mk(v1, remoteOf(v1)).svc.checkUpdates()).toEqual({ available: false, applied: false });
    expect(await mk(v1, remoteOf(null, true)).svc.checkUpdates()).toEqual({ available: false, applied: false });
    expect(await mk(v1).svc.checkUpdates()).toEqual({ available: false, applied: false });
  });

  it('paquete remoto corrupto → no se aplica y se conserva la versión actual', async () => {
    const bad = makePackage('1.2.0', { 'guias/a.md': GUIDE('a', '\nX'), 'quiz/banco.json': QUIZ });
    bad.files[0]!.data = new TextEncoder().encode('alterado en tránsito');
    const { svc, state, files } = mk(v1, remoteOf(bad));
    await svc.listGuides();
    expect(await svc.checkUpdates()).toEqual({ available: true, applied: false });
    expect(await state.get('content.current')).toBe('1.0.0');
    expect(await svc.getGuideMarkdown('a')).not.toContain('X');
    expect(await files.list('content/v/1.2.0')).toEqual([]); // nada a medio instalar
  });

  it('conserva solo la versión actual y la previa (poda la más antigua)', async () => {
    const mkv = (v: string) => makePackage(v, { 'guias/a.md': GUIDE('a', `\n${v}`), 'quiz/banco.json': QUIZ });
    const { svc, files } = mk(mkv('1.0.0'));
    await svc.listGuides();
    for (const v of ['1.1.0', '1.2.0']) await svc.install(mkv(v));
    expect((await files.list('content/v/1.0.0')).length).toBe(0);
    expect((await files.list('content/v/1.1.0')).length).toBeGreaterThan(0);
    expect((await files.list('content/v/1.2.0')).length).toBeGreaterThan(0);
  });
});
