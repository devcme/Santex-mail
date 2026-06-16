import http from '@/axios/index.js';

export function storageStats() {
    return http.get('/storage/stats', { noMsg: true });
}
