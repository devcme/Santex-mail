import app from '../hono/hono';
import result from '../model/result';

const CF_API = 'https://api.cloudflare.com/client/v4';

async function cfREST(env, path) {
    const resp = await fetch(`${CF_API}${path}`, {
        headers: {
            'Authorization': `Bearer ${env.CF_API_TOKEN}`,
            'Content-Type': 'application/json'
        }
    });
    const json = await resp.json();
    if (!json.success) {
        throw new Error(json.errors?.[0]?.message || 'CF API error');
    }
    return json.result;
}

async function cfGraphQL(env, query) {
    const resp = await fetch(`${CF_API}/graphql`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${env.CF_API_TOKEN}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ query })
    });
    const json = await resp.json();
    if (json.errors?.length) {
        throw new Error(json.errors[0].message);
    }
    return json.data;
}

// GET /storage/resources - list all resources with names
app.get('/storage/resources', async (c) => {
    try {
        const accountId = c.env.CF_ACCOUNT_ID || c.env.accountId;
        if (!accountId || !c.env.CF_API_TOKEN) {
            return c.json(result.ok({ d1: [], kv: [], r2: [], noToken: true }));
        }

        const [d1List, kvList, r2List] = await Promise.all([
            cfREST(c.env, `/accounts/${accountId}/d1/database`).catch(() => []),
            cfREST(c.env, `/accounts/${accountId}/workers/namespaces`).catch(() => []),
            cfREST(c.env, `/accounts/${accountId}/r2/buckets`).catch(() => { return { buckets: [] } }),
        ]);

        return c.json(result.ok({
            d1: (d1List || []).map(d => ({ id: d.uuid, name: d.name, created_at: d.created_at })),
            kv: (kvList || []).map(k => ({ id: k.id, name: k.title })),
            r2: ((r2List.buckets || r2List) || []).map(r => ({ id: r.name || r.bucketName, name: r.name || r.bucketName })),
        }));
    } catch (e) {
        return c.json(result.ok({ d1: [], kv: [], r2: [], error: e.message }));
    }
});

// POST /storage/stats - get usage stats via GraphQL
app.post('/storage/stats', async (c) => {
    try {
        const accountId = c.env.CF_ACCOUNT_ID || c.env.accountId;
        if (!accountId || !c.env.CF_API_TOKEN) {
            return c.json(result.ok({ noToken: true, hint: 'Set CF_API_TOKEN and CF_ACCOUNT_ID secrets in Worker' }));
        }

        const body = await c.req.json().catch(() => ({}));
        const { startDate, endDate } = body;
        const since = startDate || new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];
        const until = endDate || new Date().toISOString().split('T')[0];

        // GraphQL query for storage and operations
        const query = `{
            viewer {
                accounts(filter: { accountTag: "${accountId}" }) {
                    d1Storage: d1StorageAdaptiveGroups(
                        filter: { datetime_geq: "${since}", datetime_leq: "${until}" },
                        limit: 100
                    ) {
                        dimensions { databaseId, databaseTag }
                        sum { storageBytes }
                    }
                    d1Ops: d1AnalyticsAdaptiveGroups(
                        filter: { datetime_geq: "${since}", datetime_leq: "${until}" },
                        limit: 100
                    ) {
                        dimensions { databaseId, databaseTag }
                        sum { rowsRead, rowsWritten, queryCount }
                    }
                    kvStorage: kvStorageAdaptiveGroups(
                        filter: { datetime_geq: "${since}", datetime_leq: "${until}" },
                        limit: 100
                    ) {
                        dimensions { namespaceId }
                        sum { storageBytes }
                    }
                    kvOps: kvOperationsAdaptiveGroups(
                        filter: { datetime_geq: "${since}", datetime_leq: "${until}" },
                        limit: 100
                    ) {
                        dimensions { namespaceId, operation }
                        count
                    }
                    r2Storage: r2StorageAdaptiveGroups(
                        filter: { datetime_geq: "${since}", datetime_leq: "${until}" },
                        limit: 100
                    ) {
                        dimensions { bucketName }
                        sum { storageBytes, objectCount }
                    }
                    r2Ops: r2OperationsAdaptiveGroups(
                        filter: { datetime_geq: "${since}", datetime_leq: "${until}" },
                        limit: 100
                    ) {
                        dimensions { bucketName, operation }
                        count
                    }
                }
            }
        }`;

        const data = await cfGraphQL(c.env, query);
        const accountData = data?.viewer?.accounts?.[0] || {};

        return c.json(result.ok({
            d1Storage: accountData.d1Storage || [],
            d1Ops: accountData.d1Ops || [],
            kvStorage: accountData.kvStorage || [],
            kvOps: accountData.kvOps || [],
            r2Storage: accountData.r2Storage || [],
            r2Ops: accountData.r2Ops || [],
            updateTime: new Date().toISOString(),
            period: { since, until }
        }));
    } catch (e) {
        return c.json(result.error(e.message));
    }
});
