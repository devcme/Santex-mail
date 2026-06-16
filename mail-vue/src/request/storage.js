import http from '@/axios/index.js';

export function storageResources() {
    return http.get('/storage/resources', { noMsg: true });
}

export function storageStats(params) {
    return http.post('/storage/stats', params, { noMsg: true });
}
