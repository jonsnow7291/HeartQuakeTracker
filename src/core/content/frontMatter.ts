/** Parser mínimo de front-matter YAML de las guías (claves simples, listas ["a","b"], números). */
export type FrontMatter = Record<string, string | number | string[]>;

export function parseFrontMatter(md: string): { data: FrontMatter; body: string } | null {
  const m = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/.exec(md);
  if (!m) return null;
  const data: FrontMatter = {};
  for (const line of m[1]!.split(/\r?\n/)) {
    const kv = /^([A-Za-z0-9_]+):\s*(.*)$/.exec(line);
    if (!kv) continue;
    const raw = kv[2]!.trim();
    if (raw.startsWith('[') && raw.endsWith(']')) {
      data[kv[1]!] = raw
        .slice(1, -1)
        .split(',')
        .map((s) => s.trim().replace(/^["']|["']$/g, ''))
        .filter(Boolean);
    } else if (/^-?\d+(\.\d+)?$/.test(raw) && !/^\d+\.\d+\.\d+$/.test(raw)) {
      data[kv[1]!] = Number(raw);
    } else {
      data[kv[1]!] = raw.replace(/^["']|["']$/g, '');
    }
  }
  return { data, body: m[2]! };
}
