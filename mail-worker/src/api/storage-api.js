import app from '../hono/hono';
import result from '../model/result';

const CF_API = 'https://api.cloudflare.com/client/v4';

app.get('/storage/stats', async (c) => {
	const env = c.env;
	const data = {};

	// D1 stats via direct DB
	const d1Tables = ['email', 'account', 'user', 'role', 'star', 'setting', 'reg_key', 'verify_record'];
	try {
		const db = env.db || env.DB;
		const tableStats = [];
		if (db) {
			for (const table of d1Tables) {
				try {
					const row = db.prepare(`SELECT COUNT(*) as cnt FROM "${table}"`).first();
					tableStats.push({ table, count: row ? (row.cnt || 0) : 0 });
				} catch (e) {
					tableStats.push({ table, count: 0 });
				}
			}
		}
		data.d1 = {
			tables: tableStats,
			totalRows: tableStats.reduce((s, t) => s + (t.count || 0), 0)
		};
	} catch (e) {
		data.d1 = { tables: [], totalRows: 0, error: e.message };
	}

	// KV stats
	try {
		const kv = env.kv || env.KV;
		if (kv) {
			let kvCount = 0, cursor = undefined;
			do {
				const res = await kv.list({ cursor, limit: 1000 });
				kvCount += res.keys.length;
				cursor = res.list_complete ? undefined : res.cursor;
			} while (cursor);
			data.kv = { keyCount: kvCount };
		} else {
			data.kv = { keyCount: 0, error: 'KV binding not available' };
		}
	} catch (e) {
		data.kv = { keyCount: 0, error: e.message };
	}

	// R2 stats
	try {
		const r2 = env.r2 || env.R2 || env.r2_bucket;
		if (r2) {
			let objectCount = 0, totalSize = 0, cursor = undefined;
			const typeStats = { images: 0, attachments: 0, other: 0, imagesSize: 0, attachmentsSize: 0, otherSize: 0 };
			const imageExts = ['png','jpg','jpeg','gif','webp','svg','ico','bmp'];
			do {
				const res = await r2.list({ cursor, limit: 1000 });
				objectCount += res.objects.length;
				for (const obj of res.objects) {
					const size = obj.size || 0;
					totalSize += size;
					const key = obj.key || '';
					const ext = key.split('.').pop()?.toLowerCase();
					if (key.startsWith('att/') || key.startsWith('attachment/')) {
						typeStats.attachments++;
						typeStats.attachmentsSize += size;
					} else if (imageExts.includes(ext)) {
						typeStats.images++;
						typeStats.imagesSize += size;
					} else {
						typeStats.other++;
						typeStats.otherSize += size;
					}
				}
				cursor = res.truncated ? res.cursor : undefined;
			} while (cursor);
			data.r2 = {
				objectCount,
				totalSize,
				typeStats,
				totalSizeGB: +(totalSize / 1073741824).toFixed(4)
			};
		} else {
			data.r2 = { objectCount: 0, totalSize: 0, error: 'R2 binding not available' };
		}
	} catch (e) {
		data.r2 = { objectCount: 0, totalSize: 0, error: e.message };
	}

	// Try GraphQL for billing/usage data
	try {
		const accountId = env.CF_ACCOUNT_ID;
		const apiToken = env.CF_API_TOKEN;
		if (accountId && apiToken) {
			const query = `{
				viewer {
					accounts(filter: { accountTag: "${accountId}" }) {
						d1: d1StorageAdaptiveGroups(limit: 1, orderBy: [datetime_DESC]) {
							sum { storageBytes }
						}
						kv: kvStorageAdaptiveGroups(limit: 1, orderBy: [datetime_DESC]) {
							sum { storageBytes }
						}
						r2: r2StorageAdaptiveGroups(limit: 1, orderBy: [datetime_DESC]) {
							sum { storageBytes, objectCount }
						}
					}
				}
			}`;
			const resp = await fetch(`${CF_API}/graphql`, {
				method: 'POST',
				headers: { 'Authorization': `Bearer ${apiToken}`, 'Content-Type': 'application/json' },
				body: JSON.stringify({ query })
			});
			const json = await resp.json();
			if (json.data) {
				const viewer = json.data.viewer.accounts[0];
				if (viewer.d1.length) data.d1.billingBytes = viewer.d1[0].sum.storageBytes;
				if (viewer.kv.length) data.kv.billingBytes = viewer.kv[0].sum.storageBytes;
				if (viewer.r2.length) {
					data.r2.billingBytes = viewer.r2[0].sum.storageBytes;
					data.r2.billingObjects = viewer.r2[0].sum.objectCount;
				}
			}
		}
	} catch (e) {
		data.graphqlError = e.message;
	}

	return c.json(result.ok(data));
});
