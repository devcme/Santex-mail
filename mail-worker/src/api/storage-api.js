import app from '../hono/hono';
import result from '../model/result';

app.get('/storage/stats', async (c) => {
	const env = c.env;
	const data = {};
	const debug = { envKeys: Object.keys(env).filter(k => !k.startsWith('__')) };

	// D1 stats
	try {
		const db = env.db || env.DB;
		debug.d1Binding = db ? 'ok' : 'missing (tried: env.db, env.DB)';
		const tables = ['email', 'user', 'account', 'attachments', 'star', 'setting', 'perm', 'role', 'role_perm', 'reg_key', 'oauth', 'verify_record'];
		const tableStats = [];
		if (db) {
			for (const table of tables) {
				try {
					const row = db.prepare(`SELECT COUNT(*) as cnt FROM "${table}"`).first();
					const count = row ? Number(row.cnt || 0) : 0;
					tableStats.push({ table, count, ok: true });
				} catch (e) {
					tableStats.push({ table, count: 0, ok: false, err: e.message });
				}
			}
		}
		data.d1 = { tables: tableStats, totalRows: tableStats.reduce((s, t) => s + t.count, 0) };
	} catch (e) {
		data.d1 = { tables: [], totalRows: 0, fatalError: e.message };
	}

	// KV stats
	try {
		const kv = env.kv || env.KV;
		debug.kvBinding = kv ? 'ok' : 'missing (tried: env.kv, env.KV)';
		let kvCount = 0, cursor = undefined, loops = 0;
		if (kv) {
			do {
				const res = await kv.list({ cursor, limit: 1000 });
				kvCount += res.keys.length;
				cursor = res.list_complete ? undefined : res.cursor;
				loops++;
				if (loops > 20) break;
			} while (cursor);
		}
		data.kv = { keyCount: kvCount };
	} catch (e) {
		data.kv = { keyCount: 0, error: e.message };
	}

	// R2 stats
	try {
		const r2 = env.r2 || env.R2;
		debug.r2Binding = r2 ? 'ok' : 'missing (tried: env.r2, env.R2)';
		let objectCount = 0, totalSize = 0, cursor = undefined, loops = 0;
		const cats = { attachments: 0, backgrounds: 0, images: 0, other: 0, attachmentsSize: 0, backgroundsSize: 0, imagesSize: 0, otherSize: 0 };
		const imgExts = ['png','jpg','jpeg','gif','webp','svg','ico','bmp','tiff','jfif'];
		if (r2) {
			do {
				const res = await r2.list({ cursor, limit: 1000 });
				for (const obj of res.objects) {
					const sz = obj.size || 0;
					totalSize += sz;
					objectCount++;
					const key = obj.key || '';
					const ext = key.split('.').pop()?.toLowerCase() || '';
					if (key.startsWith('attachments/')) { cats.attachments++; cats.attachmentsSize += sz; }
					else if (key.startsWith('static/')) { cats.backgrounds++; cats.backgroundsSize += sz; }
					else if (imgExts.includes(ext)) { cats.images++; cats.imagesSize += sz; }
					else { cats.other++; cats.otherSize += sz; }
				}
				cursor = res.truncated ? res.cursor : undefined;
				loops++;
				if (loops > 20) break;
			} while (cursor);
		}
		debug.r2SampleKeys = (r2 ? 'r2 bound' : 'no r2');
		data.r2 = { objectCount, totalSize, categories: cats, totalSizeGB: +(totalSize / 1073741824).toFixed(4) };
	} catch (e) {
		data.r2 = { objectCount: 0, totalSize: 0, categories: null, error: e.message };
	}

	data._debug = debug;
	return c.json(result.ok(data));
});
