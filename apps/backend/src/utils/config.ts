import path from 'node:path';
import os from 'node:os';

// 获取静态资源存储目录
export function getStaticRoot() {
  const raw = (process.env['STATIC_DIR'] || 'static').trim();
  const expanded =
    raw === '~'
      ? os.homedir()
      : raw.startsWith('~/') || raw.startsWith('~\\')
        ? path.join(os.homedir(), raw.slice(2))
        : raw;
  const abs = path.isAbsolute(expanded) ? expanded : path.resolve(process.cwd(), expanded);
  return abs;
}
