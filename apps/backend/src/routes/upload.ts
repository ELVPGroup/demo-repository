import Router from '@koa/router';
import multer from '@koa/multer';
import type { Context } from 'koa';
import fs from 'node:fs';
import path from 'node:path';
import type { File } from '@koa/multer';
import { getStaticRoot } from '@/utils/config.js';

function resolveUploadDirFromUrl(url: string): string {
  const STATIC_ROOT = getStaticRoot();
  const withoutQuery = url.split('?')[0] || '';
  const idx = withoutQuery.indexOf('/upload/');
  const sub = idx >= 0 ? withoutQuery.slice(idx + '/upload/'.length) : '';
  const normalized = sub.replace(/\\/g, '/').replace(/^\/+/, '');
  const abs = path.resolve(STATIC_ROOT, normalized);
  // 防止目录穿越，强制限定到 STATIC_ROOT 下
  if (!abs.startsWith(STATIC_ROOT)) return STATIC_ROOT;
  fs.mkdirSync(abs, { recursive: true });
  return abs;
}

const storage = multer.diskStorage({
  destination: (req, _file, cb) => {
    try {
      const dir = resolveUploadDirFromUrl(req.url || '/upload');
      cb(null, dir);
    } catch (err) {
      cb(err as Error, getStaticRoot());
    }
  },
  filename: (_req, file, cb) => {
    const base = path.basename(file.originalname);
    const ext = path.extname(base);
    // const name = path.basename(base, ext).replace(/[^a-zA-Z0-9_\-.]/g, '_');
    cb(null, `${Date.now()}${ext}`);
  },
});

const upload = multer({
  storage,
  fileFilter: (_req, file, cb) => {
    const ok =
      file.mimetype.startsWith('image/') || /\.(png|jpe?g|gif|svg|webp)$/i.test(file.originalname);
    cb(ok ? null : new Error('仅允许上传图片'), ok);
  },
});

const router = new Router({ prefix: '/api' });

// 上传到 static 根目录
// POST /api/upload/{subpath}
router.post('/upload/:subpath', upload.single('file'), async (ctx: Context) => {
  const file = ctx.request.file || ctx.file;
  if (!file) {
    ctx.status = 400;
    ctx.body = { _message: '未检测到上传文件' };
    return;
  }
  const filename = (file as File).filename as string;
  const subpath = String(ctx.params?.['subpath'] || '')
    .replace(/\\/g, '/')
    .replace(/^\/+/, '');
  const url = subpath ? `/static/${subpath}/${filename}` : `/static/${filename}`;
  ctx.status = 201;
  ctx.body = {
    _data: {
      url,
      filename,
      size: file.size as number,
      mimetype: file.mimetype as string,
    },
    _message: '上传成功',
  };
});

export default router;
