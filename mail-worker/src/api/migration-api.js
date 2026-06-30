import app from '../hono/hono';
import r2Service from '../service/r2-service';
import orm from '../entity/orm';
import { att } from '../entity/att';
import { eq, isNull, and, ne } from 'drizzle-orm';

app.get('/migration/fixR2Metadata/:secret', async (c) => {
	const initKey = c.env.INIT_KEY;
	if (!initKey || c.req.param('secret') !== initKey) {
		return c.json({ error: 'Unauthorized' }, 401);
	}

	const storageType = await r2Service.storageType(c);
	if (storageType !== 'R2') {
		return c.json({ message: `Storage type is ${storageType}, migration only applies to R2` });
	}

	const prefix = c.req.query('prefix') || 'attachments/';

	const allAtts = await orm(c).select({
		key: att.key,
		filename: att.filename,
		mimeType: att.mimeType,
		contentId: att.contentId,
	}).from(att).all();

	const attMap = new Map();
	for (const a of allAtts) {
		if (!attMap.has(a.key)) {
			attMap.set(a.key, a);
		}
	}

	const stats = { scanned: 0, fixed: 0, skipped: 0, errors: [] };
	let cursor;

	while (true) {
		const listed = await c.env.r2.list({ prefix, cursor, limit: 500 });
		cursor = listed.truncated ? listed.cursor : null;

		for (const obj of listed.objects) {
			stats.scanned++;
			try {
				const meta = obj.httpMetadata || {};
				const disposition = meta.contentDisposition || '';
				const storedContentType = meta.contentType || '';

				const needsFix = !disposition ||
					disposition.includes('filename=undefined') ||
					isBadDisposition(disposition) ||
					!storedContentType ||
					storedContentType === 'application/octet-stream' ||
					storedContentType === 'binary/octet-stream';

				if (!needsFix) {
					stats.skipped++;
					continue;
				}

				const r2Obj = await c.env.r2.get(obj.key);
				if (!r2Obj) {
					stats.errors.push({ key: obj.key, error: 'Object not found on get' });
					continue;
				}

				const body = await r2Obj.arrayBuffer();
				const dbAtt = attMap.get(obj.key);
				const keyFilename = obj.key.split('/').pop();

				const filename = dbAtt?.filename || keyFilename;
				const mimeType = dbAtt?.mimeType || getMimeTypeFromKey(obj.key) || 'application/octet-stream';
				const isInline = dbAtt?.contentId || disposition.startsWith('inline');

				const safeFilename = filename.replace(/"/g, '');

				const newMeta = {
					contentType: mimeType,
					contentDisposition: `${isInline ? 'inline' : 'attachment'}; filename="${safeFilename}"`,
				};
				if (meta.cacheControl) {
					newMeta.cacheControl = meta.cacheControl;
				}

				await c.env.r2.put(obj.key, body, { httpMetadata: newMeta });
				stats.fixed++;
			} catch (e) {
				stats.errors.push({ key: obj.key, error: e.message });
			}
		}

		if (!cursor) break;
	}

	return c.json(stats);
});

function isBadDisposition(disposition) {
	const match = disposition.match(/filename=["']?([^"';]*)["']?/i);
	if (!match) return true;
	const fn = match[1].trim();
	if (!fn || fn === 'undefined') return true;
	if (disposition.includes('filename=') && !disposition.includes('filename="') && !disposition.includes("filename='")) {
		return true;
	}
	return false;
}

function getMimeTypeFromKey(key) {
	const ext = key.includes('.') ? key.split('.').pop().toLowerCase() : '';
	const map = {
		pdf: 'application/pdf',
		doc: 'application/msword',
		docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
		xls: 'application/vnd.ms-excel',
		xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
		ppt: 'application/vnd.ms-powerpoint',
		pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
		zip: 'application/zip',
		rar: 'application/vnd.rar',
		'7z': 'application/x-7z-compressed',
		png: 'image/png',
		jpg: 'image/jpeg',
		jpeg: 'image/jpeg',
		gif: 'image/gif',
		bmp: 'image/bmp',
		webp: 'image/webp',
		svg: 'image/svg+xml',
		tiff: 'image/tiff',
		ico: 'image/x-icon',
		jfif: 'image/jpeg',
		txt: 'text/plain',
		html: 'text/html',
		csv: 'text/csv',
		mp3: 'audio/mpeg',
		mp4: 'video/mp4',
		wav: 'audio/wav',
		avi: 'video/x-msvideo',
		mov: 'video/quicktime',
		woff: 'font/woff',
		woff2: 'font/woff2',
		ttf: 'font/ttf',
		rtf: 'application/rtt',
		eml: 'message/rfc822',
	};
	return map[ext] || '';
}
