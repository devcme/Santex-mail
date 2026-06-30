import app from '../hono/hono';
import r2Service from '../service/r2-service';
import settingService from '../service/setting-service';

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
				const filenameMatch = disposition.match(/filename=?["']?([^"';]*)["']?/i);
				const storedFilename = filenameMatch ? filenameMatch[1].trim() : '';

				const needsFix = !disposition ||
					!storedFilename ||
					storedFilename === 'undefined' ||
					(!storedFilename.includes('.') && obj.key.includes('.'));

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
				const keyFilename = obj.key.split('/').pop();
				const isInline = disposition.startsWith('inline');

				const newMeta = {
					contentType: meta.contentType || getMimeTypeFromKey(obj.key),
					contentDisposition: `${isInline ? 'inline' : 'attachment'}; filename="${keyFilename}"`,
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
	return map[ext] || 'application/octet-stream';
}
