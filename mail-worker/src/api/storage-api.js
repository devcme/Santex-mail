import app from '../hono/hono';
import result from '../model/result';
import { sql } from 'drizzle-orm';

app.get('/storage/stats', async (c) => {
	const env = c.env;
	const data = {};

	// D1 stats
	try {
		const db = env.DB;
		const tables = ['email', 'star', 'account', 'user', 'role', 'reg_key', 'setting', 'verify_record'];
		const d1Stats = [];
		for (const table of tables) {
			try {
				const countResult = db.prepare(`SELECT COUNT(*) as cnt FROM "${table}"`).first();
				const count = countResult ? countResult.cnt : 0;
				d1Stats.push({ table, count });
			} catch (e) {
				d1Stats.push({ table, count: 0 });
			}
		}
		data.d1 = { tables: d1Stats, freeGB: 5 };
	} catch (e) {
		data.d1 = { tables: [], freeGB: 5, error: e.message };
	}

	// KV stats
	try {
		const kv = env.kv || env.KV || env.email_kv;
		if (kv && typeof kv.list === 'function') {
			let kvCount = 0;
			let cursor = undefined;
			do {
				const res = await kv.list({ cursor, limit: 1000 });
				kvCount += res.keys.length;
				cursor = res.list_complete ? undefined : res.cursor;
			} while (cursor);
			data.kv = {
				keyCount: kvCount,
				freeReads: 100000,
				freeWrites: 1000,
				freeStorageGB: 1,
				dailyReads: 100000,
				dailyWrites: 1000,
				storageGB: 1
			};
		} else {
			data.kv = { keyCount: 'N/A', error: 'KV binding not available' };
		}
	} catch (e) {
		data.kv = { keyCount: 0, error: e.message };
	}

	// R2 stats
	try {
		const r2 = env.R2 || env.r2_bucket;
		if (r2 && typeof r2.list === 'function') {
			let objectCount = 0;
			let totalSize = 0;
			let cursor = undefined;
			do {
				const res = await r2.list({ cursor, limit: 1000 });
				objectCount += res.objects.length;
				for (const obj of res.objects) {
					totalSize += obj.size || 0;
				}
				cursor = res.truncated ? res.cursor : undefined;
			} while (cursor);
			data.r2 = {
				objectCount,
				totalSize,
				totalSizeGB: +(totalSize / 1073741824).toFixed(4),
				freeStorageGB: 10,
				pricePerGB: 0.015,
				classAOpsPrice: 4.50,
				classBOpsPrice: 0.36
			};
		} else {
			data.r2 = { objectCount: 'N/A', error: 'R2 binding not available' };
		}
	} catch (e) {
		data.r2 = { objectCount: 0, totalSize: 0, error: e.message };
	}

	return c.json(result.ok(data));
});
