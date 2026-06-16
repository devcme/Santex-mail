import app from '../hono/hono';
import result from '../model/result';

app.get('/storage/stats', async (c) => {
	const env = c.env;
	const data = {};

	// D1 stats
	try {
		const db = env.db || env.DB;
		const tables = ['email', 'user', 'account', 'attachments', 'star', 'setting', 'perm', 'role', 'role_perm', 'reg_key', 'oauth', 'verify_record'];
		const tableStats = [];
		if (db) {
			for (const table of tables) {
				try {
					const row = db.prepare(`SELECT COUNT(*) as cnt FROM "${table}"`).first();
					tableStats.push({ table, count: row ? (row.cnt || 0) : 0 });
				} catch (e) {
					tableStats.push({ table, count: 0, error: e.message });
				}
			}
		}
		data.d1 = {
			tables: tableStats,
			totalRows: tableStats.reduce((s, t) => s + (t.count || 0), 0),
			binding: db ? 'ok' : 'missing'
		};
	} catch (e) {
		data.d1 = { tables: [], totalRows: 0, error: e.message };
	}

	// KV stats
	try {
		const kv = env.kv || env.KV;
		if (kv) {
			let kvCount = 0, cursor = undefined, loopCount = 0;
			do {
				const res = await kv.list({ cursor, limit: 1000 });
				kvCount += res.keys.length;
				cursor = res.list_complete ? undefined : res.cursor;
				loopCount++;
				if (loopCount > 10) break; // safety
			} while (cursor);
			data.kv = { keyCount: kvCount, binding: 'ok' };
		} else {
			data.kv = { keyCount: 0, binding: 'missing' };
		}
	} catch (e) {
		data.kv = { keyCount: 0, error: e.message };
	}

	// R2 stats
	try {
		const r2 = env.r2 || env.R2 || env.r2_bucket;
		if (r2) {
			let objectCount = 0, totalSize = 0, cursor = undefined, loopCount = 0;
			const typeStats = { images: 0, attachments: 0, backgrounds: 0, other: 0, imagesSize: 0, attachmentsSize: 0, backgroundsSize: 0, otherSize: 0 };
			const imageExts = ['png','jpg','jpeg','gif','webp','svg','ico','bmp'];
			do {
				const res = await r2.list({ cursor, limit: 1000 });
				objectCount += res.objects.length;
				for (const obj of res.objects) {
					const size = obj.size || 0;
					totalSize += size;
					const key = obj.key || '';
					const ext = key.split('.').pop()?.toLowerCase();
					if (key.startsWith('attachments/')) {
						typeStats.attachments++;
						typeStats.attachmentsSize += size;
					} else if (key.startsWith('static/')) {
						typeStats.backgrounds++;
						typeStats.backgroundsSize += size;
					} else if (imageExts.includes(ext)) {
						typeStats.images++;
						typeStats.imagesSize += size;
					} else {
						typeStats.other++;
						typeStats.otherSize += size;
					}
				}
				cursor = res.truncated ? res.cursor : undefined;
				loopCount++;
				if (loopCount > 10) break;
			} while (cursor);
			data.r2 = {
				objectCount, totalSize, typeStats,
				totalSizeGB: +(totalSize / 1073741824).toFixed(4),
				binding: 'ok'
			};
		} else {
			data.r2 = { objectCount: 0, totalSize: 0, typeStats: { attachments:0, images:0, backgrounds:0, other:0, attachmentsSize:0, imagesSize:0, backgroundsSize:0, otherSize:0 }, binding: 'missing' };
		}
	} catch (e) {
		data.r2 = { objectCount: 0, totalSize: 0, typeStats: null, error: e.message };
	}

	return c.json(result.ok(data));
});
