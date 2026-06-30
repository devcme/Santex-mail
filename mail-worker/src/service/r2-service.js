import s3Service from './s3-service';
import settingService from './setting-service';
import kvObjService from './kv-obj-service';

const r2Service = {

	async storageType(c) {

		const setting = await settingService.query(c);
		const { bucket, endpoint, s3AccessKey, s3SecretKey } = setting;

		if (!!(bucket && endpoint && s3AccessKey && s3SecretKey)) {
			return 'S3';
		}

		if (c.env.r2) {
			return 'R2';
		}

		return 'KV';
	},

	async putObj(c, key, content, metadata) {

		const storageType = await this.storageType(c);

		if (storageType === 'KV') {
			await kvObjService.putObj(c, key, content, metadata);
		}

		if (storageType === 'R2') {
			await c.env.r2.put(key, content, {
				httpMetadata: { ...metadata }
			});
		}

		if (storageType === 'S3') {
			await s3Service.putObj(c, key, content, metadata);
		}

	},

	async getObj(c, key) {
		const storageType = await this.storageType(c);

		if (storageType === 'KV') {
			return await kvObjService.getObj(c, key);
		}

		if (storageType === 'R2') {
			return await c.env.r2.get(key);
		}

		if (storageType === 'S3') {
			return await s3Service.getObj(c, key);
		}
	},

	async delete(c, key) {

		const storageType = await this.storageType(c);

		if (storageType === 'KV') {
			await kvObjService.deleteObj(c, key);
		}

		if (storageType === 'R2') {
			await c.env.r2.delete(key);
		}

		if (storageType === 'S3'){
			await s3Service.deleteObj(c, key);
		}

	},

	async toObjResp(c, key) {
		const storageType = await this.storageType(c);

		if (storageType === 'R2') {
			const obj = await c.env.r2.get(key);
			if (!obj) {
				return new Response('Not Found', { status: 404 });
			}
			const headers = new Headers();
			obj.writeHttpMetadata(headers);
			headers.set('etag', obj.httpEtag);
			headers.set('Access-Control-Allow-Origin', '*');

			const ext = key.includes('.') ? key.split('.').pop().toLowerCase() : '';
			const contentType = headers.get('Content-Type');
			if (!contentType || contentType === 'application/octet-stream' || contentType === 'binary/octet-stream') {
				const mime = getMimeType(ext);
				if (mime) headers.set('Content-Type', mime);
			}

			const disposition = headers.get('Content-Disposition') || '';
			const filenameMatch = disposition.match(/filename="?([^";]*)"?/i);
			const storedFilename = filenameMatch ? filenameMatch[1] : '';
			if (!storedFilename || storedFilename === 'undefined' || !storedFilename.includes('.')) {
				const keyFilename = key.split('/').pop();
				const isInline = disposition.startsWith('inline');
				const dispType = isInline ? 'inline' : 'attachment';
				headers.set('Content-Disposition', `${dispType}; filename="${keyFilename}"`);
			}

			return new Response(obj.body, { headers });
		}

		if (storageType === 'S3') {
			const resp = await s3Service.getObj(c, key);
			return resp || new Response('Not Found', { status: 404 });
		}

		const resp = await kvObjService.getObj(c, key);
		return resp || new Response('Not Found', { status: 404 });
	}

};

const MIME_MAP = {
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
	gzip: 'application/gzip',
	tar: 'application/x-tar',
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
	css: 'text/css',
	js: 'text/javascript',
	json: 'application/json',
	xml: 'application/xml',
	csv: 'text/csv',
	mp3: 'audio/mpeg',
	mp4: 'video/mp4',
	wav: 'audio/wav',
	avi: 'video/x-msvideo',
	mov: 'video/quicktime',
	wmv: 'video/x-ms-wmv',
	flv: 'video/x-flv',
	mkv: 'video/x-matroska',
	woff: 'font/woff',
	woff2: 'font/woff2',
	ttf: 'font/ttf',
	otf: 'font/otf',
	eot: 'application/vnd.ms-fontobject',
	rtf: 'application/rtt',
	odt: 'application/vnd.oasis.opendocument.text',
	ods: 'application/vnd.oasis.opendocument.spreadsheet',
	odp: 'application/vnd.oasis.opendocument.presentation',
	eml: 'message/rfc822',
	msg: 'application/vnd.ms-outlook',
};

function getMimeType(ext) {
	return MIME_MAP[ext] || '';
}

export default r2Service;
